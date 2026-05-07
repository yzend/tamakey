import { applyDeath, interactionRegistry } from '../domain/rules'
import type {
  GameCommand,
  GameState,
  InteractionResult,
  InteractionType,
  InventoryItem,
} from '../domain/gameTypes'

const INVALID_INTERACTION_REASON = '当前状态不允许这个互动'

export function applyInteraction(
  state: GameState,
  interaction: InteractionType | GameCommand,
  now: number
): InteractionResult {
  const command =
    typeof interaction === 'string' ? { type: interaction } : interaction
  const handler = interactionRegistry[command.type]

  if (!handler || !handler.canApply(state, command)) {
    const reason = getInvalidInteractionReason(state, command)
    return {
      state: {
        ...state,
        ui: {
          ...state.ui,
          lastToast: reason,
        },
      },
      events: [
        {
          type: 'invalidInteraction',
          interaction: command.type,
          reason,
          at: now,
        },
      ],
    }
  }

  const result = handler.apply(state, { now, command })
  const events = [...result.events]
  const nextState = applyDeath(result.state, events, now)

  return {
    state: nextState,
    events: [
      ...events,
      {
        type: 'interactionApplied',
        interaction: command.type,
        at: now,
      },
    ],
  }
}

function getInvalidInteractionReason(
  state: GameState,
  command: GameCommand
): string {
  if (state.world.activity && command.type !== 'endActivity') {
    return '活动进行中，先等当前活动结束。'
  }

  if (state.pet.stage === 'egg' && command.type !== 'openMenu') {
    return '蛋还没孵化，暂时不能这样做。'
  }

  if (
    state.pet.stage === 'dead' &&
    command.type !== 'revive' &&
    command.type !== 'newEgg' &&
    command.type !== 'openMenu'
  ) {
    return '宠物已经离开，只能复活或迎接新蛋。'
  }

  if (
    state.pet.sleepState === 'sleeping' &&
    command.type !== 'wake' &&
    command.type !== 'openMenu'
  ) {
    return '宠物正在睡觉，先叫醒它。'
  }

  switch (command.type) {
    case 'feedMeal':
      if (getInventoryQuantity(state.resources.food, 'basic-meal') <= 0) {
        return '没有正餐了，先去商店买一份。'
      }
      if (state.pet.hunger <= 5) return '现在还不饿。'
      return INVALID_INTERACTION_REASON

    case 'medicine':
      if (state.pet.sickness === 'none') return '现在不需要吃药。'
      if (state.resources.medicine <= 0) return '没有药品了，先去商店购买。'
      return INVALID_INTERACTION_REASON

    case 'toilet':
      return '现在还不需要如厕。'

    case 'wake':
      return '宠物已经醒着。'

    case 'birthday':
      if (state.pet.stage === 'elder') return '已经是长者阶段。'
      return '还没到可以庆生的年龄。'

    case 'revive':
      return state.records.revives >= 1
        ? '复活机会已经用完。'
        : INVALID_INTERACTION_REASON

    case 'plant': {
      const plot = state.garden.plots.find(
        (item) => item.id === command.targetId
      )
      if (!plot) return '没有找到这块地。'
      if (plot.cropId) return '这块地已经种了作物。'
      if (getInventoryQuantity(state.resources.seeds, 'sprout-seed') <= 0) {
        return '没有种子了，先去商店购买。'
      }
      return INVALID_INTERACTION_REASON
    }

    case 'water': {
      const plot = state.garden.plots.find(
        (item) => item.id === command.targetId
      )
      if (!plot) return '没有找到这块地。'
      return '这块地还没有作物可以浇水。'
    }

    case 'harvest': {
      const plot = state.garden.plots.find(
        (item) => item.id === command.targetId
      )
      if (!plot) return '没有找到这块地。'
      if (!plot.cropId) return '这块地还没有作物可以收获。'
      if (plot.cropId === 'withered') return '作物已经枯萎，不能收获。'
      return '作物还没成熟。'
    }

    case 'buyItem':
      return '金币不够，种子包需要 10 金币。'

    case 'buyShopItem': {
      const item = state.catalogs.shop.find(
        (shopItem) => shopItem.id === command.targetId
      )
      if (!item) return '商店里没有这个物品。'
      return `金币不够，${item.label}需要 ${item.price} 金币。`
    }

    case 'useItem':
      return '没有肥皂可以使用。'

    case 'cook':
      return '没有收获物可以烹饪。'

    case 'craftItem': {
      const recipe = state.catalogs.craft.find(
        (item) => item.id === command.targetId
      )
      if (!recipe) return '没有这个合成配方。'
      return `材料不足，不能合成${recipe.label}。`
    }

    case 'placeFurniture':
      return '还没有这个家具可以摆放。'

    case 'removeFurniture':
      return '没有找到要移除的家具。'

    case 'equipAccessory':
      return '还没有这个饰品可以佩戴。'

    case 'unequipAccessory':
      return '这个饰品还没有佩戴。'

    case 'claimMission':
      return '这个任务还不能领取。'

    case 'refreshOnline':
    case 'interactOnlinePet':
      return '在线模拟功能还没有开启。'

    case 'postSocial':
      return state.featureFlags.social
        ? '动态内容不能为空。'
        : '社交功能还没有开启。'

    case 'snapMeal':
      return '金币不够，快餐需要 12 金币。'

    case 'addFriend':
      return '请输入好友码。'

    case 'removeFriend':
      return '没有找到这个好友。'

    case 'endActivity':
      return '当前没有活动需要结束。'

    case 'finishMinigame':
      return '当前没有正在进行的街机游戏。'

    case 'endVacation':
      return '当前不在度假中。'

    case 'updateProfile':
      return '昵称不能为空。'

    default:
      return INVALID_INTERACTION_REASON
  }
}

function getInventoryQuantity(items: InventoryItem[], itemId: string) {
  return items.find((item) => item.id === itemId)?.quantity ?? 0
}
