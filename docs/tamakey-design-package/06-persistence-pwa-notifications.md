# 06. 存档、PWA 与通知

## 1. localStorage 存档

MVP 用 localStorage 单存档。

```ts
export const SAVE_KEY = 'tamakey.save.v1'
export const SAVE_BACKUP_KEY = 'tamakey.save.backup.v1'
```

```ts
export type SaveData = {
  schemaVersion: 1
  savedAt: number
  gameState: GameState
}

export type RestoreResult = {
  state: GameState
  events: GameEvent[]
  offlineSummary: OfflineSummary | null
  recoveredFromCorruptSave: boolean
}

export type LoadSaveResult =
  | { status: 'empty'; data: null }
  | { status: 'ok'; data: SaveData }
  | { status: 'corrupt'; data: null; raw: string | null; error: unknown }
```

## 2. SaveRepository

```ts
export interface SaveRepository {
  load(): LoadSaveResult
  save(data: SaveData): void
  backupCorruptSave(raw: string): void
  clear(): void
}
```

```ts
export class LocalStorageSaveRepository implements SaveRepository {
  load(): LoadSaveResult {
    let raw: string | null = null

    try {
      raw = localStorage.getItem(SAVE_KEY)
    } catch (error) {
      console.warn('Failed to read save data', error)
      return { status: 'corrupt', data: null, raw: null, error }
    }

    if (!raw) return { status: 'empty', data: null }

    try {
      return { status: 'ok', data: validateSaveData(JSON.parse(raw)) }
    } catch (error) {
      console.warn('Failed to parse or validate save data', error)
      this.backupCorruptSave(raw)
      return { status: 'corrupt', data: null, raw, error }
    }
  }

  save(data: SaveData) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to write save data', error)
    }
  }

  backupCorruptSave(raw: string) {
    try {
      localStorage.setItem(SAVE_BACKUP_KEY, raw)
    } catch (error) {
      console.warn('Failed to backup corrupt save data', error)
    }
  }

  clear() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch (error) {
      console.warn('Failed to clear save data', error)
    }
  }
}
```

不用 zod 时，MVP 可以手写最小校验：

```ts
export function validateSaveData(value: unknown): SaveData {
  if (!isRecord(value)) {
    throw new Error('Save data must be an object')
  }

  const data = value as Partial<SaveData>

  if (data.schemaVersion !== 1) {
    throw new Error('Unsupported save schema')
  }

  if (typeof data.savedAt !== 'number') {
    throw new Error('Save savedAt must be a number')
  }

  if (!data.gameState || typeof data.gameState !== 'object') {
    throw new Error('Save gameState is missing')
  }

  validateGameState(data.gameState)

  return data as SaveData
}

function validateGameState(value: unknown): asserts value is GameState {
  if (!isRecord(value)) throw new Error('GameState must be an object')

  const state = value as Partial<GameState>
  if (!isRecord(state.pet)) throw new Error('GameState.pet is missing')
  if (!isRecord(state.world)) throw new Error('GameState.world is missing')
  if (!isRecord(state.carePressure)) {
    throw new Error('GameState.carePressure is missing')
  }
  if (!isRecord(state.settings)) {
    throw new Error('GameState.settings is missing')
  }

  assertNumber(state.lastTickAt, 'GameState.lastTickAt')
  assertNumber(state.pet.ageSeconds, 'pet.ageSeconds')
  assertPercent(state.pet.hunger, 'pet.hunger')
  assertPercent(state.pet.happiness, 'pet.happiness')
  assertPercent(state.pet.energy, 'pet.energy')
  assertPercent(state.pet.cleanliness, 'pet.cleanliness')
  assertPercent(state.pet.health, 'pet.health')
  assertNumber(state.world.poopCount, 'world.poopCount')
  assertNumber(state.world.dirtySeconds, 'world.dirtySeconds')
  assertNumber(state.carePressure.neglectSeconds, 'carePressure.neglectSeconds')

  if (typeof state.settings.notificationsEnabled !== 'boolean') {
    throw new Error('settings.notificationsEnabled must be boolean')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function assertNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

function assertPercent(value: unknown, name: string): asserts value is number {
  assertNumber(value, name)
  if (value < 0 || value > 100) {
    throw new Error(`${name} must be between 0 and 100`)
  }
}
```

## 3. 保存时机

```txt
互动成功后立即保存
tick 后节流保存，建议 15 秒
visibilitychange -> hidden 时保存
beforeunload 时保存
```

```ts
const saveThrottled = throttle((state: GameState) => {
  repository.save({
    schemaVersion: 1,
    savedAt: Date.now(),
    gameState: {
      ...state,
      lastSavedAt: Date.now(),
    },
  })
}, 15_000)
```

## 4. 恢复与离线推进

```ts
const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000
```

完整 `restoreGame` 放在第 6 节，必须同时处理无存档、迁移失败和离线推进。

## 5. 坏档处理

必须做到：

- JSON parse 失败不白屏。
- 原始坏档保存到 `SAVE_BACKUP_KEY`。
- 创建新游戏。
- 控制台记录错误。
- UI 可以提示“存档损坏，已创建新宠物”。

## 6. 迁移

```ts
export function migrateSave(save: SaveData): SaveData {
  if (save.schemaVersion === 1) return save
  throw new Error(`Unsupported save schema: ${save.schemaVersion}`)
}
```

`restoreGame` 必须 catch 迁移错误，保证坏档和不支持版本都不会白屏：

```ts
export function restoreGame(
  loadResult: LoadSaveResult,
  now: number
): RestoreResult {
  if (loadResult.status === 'empty') {
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: false,
    }
  }

  if (loadResult.status === 'corrupt') {
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: true,
    }
  }

  try {
    const migrated = migrateSave(loadResult.data)
    const elapsedMs = Math.max(0, now - migrated.gameState.lastTickAt)
    const simulatedMs = Math.min(elapsedMs, MAX_OFFLINE_MS)
    const result = advanceGameTimeByDelta(
      migrated.gameState,
      simulatedMs / 1000,
      now
    )

    return {
      state: result.state,
      events: result.events,
      offlineSummary: summarizeOfflineProgress(
        migrated.gameState,
        result.state,
        elapsedMs,
        simulatedMs
      ),
      recoveredFromCorruptSave: false,
    }
  } catch (error) {
    console.warn('Failed to migrate or restore save data', error)
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: true,
    }
  }
}
```

后续：

```ts
const migrations = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
}
```

## 7. PWA 配置

安装：

```bash
pnpm add vite-plugin-pwa
```

`vite.config.ts`：

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Tamakey',
    short_name: 'Tamakey',
    description: 'A web virtual pet game.',
    theme_color: '#d9f99d',
    background_color: '#f8fafc',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      {
        src: '/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
  },
})
```

## 8. Notification 能力边界

浏览器限制：

- 必须 HTTPS 或 localhost。
- 权限请求必须由用户手势触发。
- 浏览器不保证精确后台闹钟。
- 关闭浏览器后的可靠通知需要 Web Push + 后端。

硬约束：

```txt
应用打开或 PWA 活跃时，尽量提醒玩家回来照顾宠物。
```

不得在 UI 文案、README 或代码注释里承诺“关闭浏览器后准时提醒”。MVP Notification 是 best-effort，本地 timer 和浏览器调度都可能被系统暂停。

## 9. ReminderPlan

```ts
export type ReminderPlan = {
  reminders: Reminder[]
}

export type Reminder = {
  id: string
  at: number
  title: string
  body: string
  reason: 'hungry' | 'dirty' | 'sick' | 'lonely' | 'energyFull'
}
```

提醒时间必须稳定。不能每次 tick 都用 `Date.now() + delay` 重算同一个提醒，否则 5 秒 tick 会持续把提醒往后推。

```ts
export function createReminderPlan(
  state: GameState,
  now: number,
  previousPlan: ReminderPlan | null = null
): ReminderPlan {
  const reminders: Reminder[] = []

  if (state.pet.hunger > 70) {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'hungry-soon',
        delayMs: 5 * 60 * 1000,
        now,
        title: 'Tamakey 饿了',
        body: '回来喂点东西吧。',
        reason: 'hungry',
      })
    )
  }

  if (state.world.poopCount >= 2 || state.pet.cleanliness < 30) {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'dirty-room',
        delayMs: 10 * 60 * 1000,
        now,
        title: '房间需要清洁',
        body: '太脏会让 Tamakey 生病。',
        reason: 'dirty',
      })
    )
  }

  return { reminders }
}

function createStableReminder(
  previousPlan: ReminderPlan | null,
  input: Omit<Reminder, 'at'> & { delayMs: number; now: number }
): Reminder {
  const previous = previousPlan?.reminders.find(
    (reminder) => reminder.id === input.id && reminder.reason === input.reason
  )

  return {
    id: input.id,
    at: previous?.at ?? input.now + input.delayMs,
    title: input.title,
    body: input.body,
    reason: input.reason,
  }
}
```

## 10. NotificationService

```ts
export class NotificationService {
  private timerIds = new Map<string, number>()

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied'
    try {
      return await Notification.requestPermission()
    } catch (error) {
      console.warn('Failed to request notification permission', error)
      return 'denied'
    }
  }

  schedule(plan: ReminderPlan) {
    this.cancelAll()

    for (const reminder of plan.reminders) {
      const delay = Math.max(0, reminder.at - Date.now())
      const timerId = window.setTimeout(() => {
        this.show(reminder)
      }, delay)

      this.timerIds.set(reminder.id, timerId)
    }
  }

  cancelAll() {
    for (const timerId of this.timerIds.values()) {
      window.clearTimeout(timerId)
    }
    this.timerIds.clear()
  }

  show(reminder: Reminder) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      new Notification(reminder.title, {
        body: reminder.body,
        tag: reminder.id,
      })
    } catch (error) {
      console.warn('Failed to show notification', error)
    }
  }
}
```

## 11. 验收

存档：

- 刷新页面后状态还在。
- 手动把 `lastTickAt` 改成过去，刷新后能离线推进。
- 坏档不会白屏。

PWA：

- DevTools 能看到 manifest。
- DevTools 能看到 service worker。
- `pnpm build && pnpm preview` 下可安装。

通知：

- 用户点击开启后才请求权限。
- 授权后能看到前台通知。
- 状态变化后旧 reminder 会被取消。
