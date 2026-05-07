import type { CraftRecipe, ShopCatalogItem } from '../gameTypes'

export type LocalModDefinition = {
  // 本地模组 schema 版本，目前只接受 1。
  schemaVersion: 1
  // 模组展示名称。
  name: string
  // 模组新增或覆盖的商店商品。
  shopItems: ShopCatalogItem[]
  // 模组新增或覆盖的合成配方。
  craftRecipes: CraftRecipe[]
}

// 外部输入先以 unknown 进入沙箱，逐字段校验后才转换为领域类型。
type LocalModInput = {
  // 未校验的 schema 版本输入。
  schemaVersion?: unknown
  // 未校验的模组名称输入。
  name?: unknown
  // 未校验的商店商品输入。
  shopItems?: unknown
  // 未校验的合成配方输入。
  craftRecipes?: unknown
}

// 本地模组限制大小、数量和文本格式，避免把任意内容注入运行时目录。
const MAX_MOD_BYTES = 24_000
const MAX_ENTRIES = 16
const SAFE_ID = /^[a-z][a-z0-9-]{1,40}$/
const SAFE_LABEL = /^[\w .'-]{1,48}$/
const DISALLOWED_TEXT = /https?:\/\/|javascript:|<script|<\/script/i
const ITEM_KINDS = new Set<ShopCatalogItem['kind']>([
  'food',
  'seed',
  'medicine',
  'furniture',
  'accessory',
  'material',
])
const OUTPUT_BUCKETS = new Set<CraftRecipe['outputBucket']>([
  'items',
  'furniture',
  'accessories',
  'food',
])

// 解析本地模组：只接受白名单字段，并返回可展示给玩家的拒绝原因。
export function parseLocalModDefinition(
  text: string
):
  | { status: 'ok'; mod: LocalModDefinition }
  | { status: 'rejected'; reason: string } {
  const trimmed = text.trim()
  if (!trimmed) return { status: 'rejected', reason: '模组文本为空。' }
  if (trimmed.length > MAX_MOD_BYTES) {
    return { status: 'rejected', reason: '模组文本过大。' }
  }
  if (DISALLOWED_TEXT.test(trimmed)) {
    return { status: 'rejected', reason: '模组文本包含不安全内容。' }
  }

  let parsed: LocalModInput
  try {
    parsed = JSON.parse(trimmed) as LocalModInput
  } catch {
    return { status: 'rejected', reason: '模组 JSON 无效。' }
  }

  if (!isRecord(parsed)) {
    return { status: 'rejected', reason: '模组根内容必须是对象。' }
  }
  if (parsed.schemaVersion !== 1) {
    return { status: 'rejected', reason: '模组 schemaVersion 必须为 1。' }
  }
  if (!isSafeLabel(parsed.name)) {
    return { status: 'rejected', reason: '模组名称无效。' }
  }

  const shopItems = parseShopItems(parsed.shopItems)
  if (shopItems.status === 'rejected') return shopItems

  const craftRecipes = parseCraftRecipes(parsed.craftRecipes)
  if (craftRecipes.status === 'rejected') return craftRecipes

  if (shopItems.items.length === 0 && craftRecipes.items.length === 0) {
    return {
      status: 'rejected',
      reason: '模组至少需要提供一个商店物品或合成配方。',
    }
  }

  return {
    status: 'ok',
    mod: {
      schemaVersion: 1,
      name: parsed.name.trim(),
      shopItems: shopItems.items,
      craftRecipes: craftRecipes.items,
    },
  }
}

// 商店物品只允许新增安全的 mod-* id，避免覆盖内置物品协议。
function parseShopItems(
  value: unknown
):
  | { status: 'ok'; items: ShopCatalogItem[] }
  | { status: 'rejected'; reason: string } {
  if (value === undefined) return { status: 'ok', items: [] }
  if (!Array.isArray(value)) {
    return { status: 'rejected', reason: 'shopItems 必须是数组。' }
  }
  if (value.length > MAX_ENTRIES) {
    return { status: 'rejected', reason: 'shopItems 条目过多。' }
  }

  const items: ShopCatalogItem[] = []
  for (const raw of value) {
    if (!isRecord(raw)) {
      return { status: 'rejected', reason: '商店物品必须是对象。' }
    }
    if (!isSafeId(raw.id) || !String(raw.id).startsWith('mod-')) {
      return {
        status: 'rejected',
        reason: '商店物品 id 必须是安全的 mod-* id。',
      }
    }
    if (!isSafeLabel(raw.label)) {
      return { status: 'rejected', reason: '商店物品名称无效。' }
    }
    if (!ITEM_KINDS.has(raw.kind as ShopCatalogItem['kind'])) {
      return { status: 'rejected', reason: '商店物品类型无效。' }
    }
    if (!isSafePrice(raw.price)) {
      return { status: 'rejected', reason: '商店物品价格无效。' }
    }

    items.push({
      id: String(raw.id),
      label: String(raw.label).trim(),
      kind: raw.kind as ShopCatalogItem['kind'],
      price: Math.round(Number(raw.price)),
    })
  }

  return { status: 'ok', items }
}

// 合成配方会同时校验消耗、产出和产出分类，确保导入后可以被规则安全消费。
function parseCraftRecipes(
  value: unknown
):
  | { status: 'ok'; items: CraftRecipe[] }
  | { status: 'rejected'; reason: string } {
  if (value === undefined) return { status: 'ok', items: [] }
  if (!Array.isArray(value)) {
    return { status: 'rejected', reason: 'craftRecipes 必须是数组。' }
  }
  if (value.length > MAX_ENTRIES) {
    return { status: 'rejected', reason: 'craftRecipes 条目过多。' }
  }

  const recipes: CraftRecipe[] = []
  for (const raw of value) {
    if (!isRecord(raw)) {
      return { status: 'rejected', reason: '合成配方必须是对象。' }
    }
    if (!isSafeId(raw.id) || !String(raw.id).startsWith('mod-')) {
      return {
        status: 'rejected',
        reason: '合成配方 id 必须是安全的 mod-* id。',
      }
    }
    if (!isSafeLabel(raw.label)) {
      return { status: 'rejected', reason: '合成配方名称无效。' }
    }
    if (!Array.isArray(raw.cost) || raw.cost.length > 6) {
      return { status: 'rejected', reason: '合成配方消耗无效。' }
    }
    if (!isRecord(raw.output)) {
      return { status: 'rejected', reason: '合成配方产出无效。' }
    }
    if (!OUTPUT_BUCKETS.has(raw.outputBucket as CraftRecipe['outputBucket'])) {
      return {
        status: 'rejected',
        reason: '合成配方产出分类无效。',
      }
    }

    const cost = []
    for (const item of raw.cost) {
      if (
        !isRecord(item) ||
        !isSafeId(item.id) ||
        !isSafeQuantity(item.quantity)
      ) {
        return {
          status: 'rejected',
          reason: '合成配方消耗物品无效。',
        }
      }
      cost.push({
        id: String(item.id),
        quantity: Math.round(Number(item.quantity)),
      })
    }

    if (!isSafeId(raw.output.id) || !isSafeQuantity(raw.output.quantity)) {
      return { status: 'rejected', reason: '合成配方产出无效。' }
    }

    recipes.push({
      id: String(raw.id),
      label: String(raw.label).trim(),
      cost,
      output: {
        id: String(raw.output.id),
        quantity: Math.round(Number(raw.output.quantity)),
      },
      outputBucket: raw.outputBucket as CraftRecipe['outputBucket'],
    })
  }

  return { status: 'ok', items: recipes }
}

// 下面的守卫函数把 unknown 输入缩窄为领域层可用的安全值。
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID.test(value)
}

function isSafeLabel(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    SAFE_LABEL.test(value.trim()) &&
    !DISALLOWED_TEXT.test(value)
  )
}

function isSafeQuantity(value: unknown): value is number {
  return Number.isFinite(value) && Number(value) > 0 && Number(value) <= 99
}

function isSafePrice(value: unknown): value is number {
  return Number.isFinite(value) && Number(value) >= 1 && Number(value) <= 999
}
