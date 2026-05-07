# 04. Runtime、Worker 与 Zustand

## 1. Runtime 目标

Worker 负责游戏规则运行，主线程负责 UI、PixiJS、存档和通知。

```txt
Worker:
  INIT
  TICK
  INTERACT
  RESET
  SET_NOTIFICATIONS_ENABLED

Main thread:
  Zustand snapshot
  React UI
  PixiJS rendering
  localStorage persistence
  Notification scheduling
```

## 2. Worker 协议

```ts
export type GameWorkerRequest =
  | { type: 'INIT'; state: GameState; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'INTERACT'; interaction: InteractionType; now: number }
  | { type: 'RESET'; now: number }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; enabled: boolean; now: number }

export type GameWorkerResponse =
  | { type: 'READY'; state: GameState }
  | { type: 'SYNC'; state: GameState; events: GameEvent[] }
  | { type: 'ERROR'; message: string; recoverable: boolean }
```

## 3. game.worker.ts

```ts
let currentState: GameState | null = null

self.onmessage = (event: MessageEvent<GameWorkerRequest>) => {
  try {
    const message = event.data

    if (message.type === 'INIT') {
      currentState = message.state
      post({ type: 'READY', state: currentState })
      return
    }

    if (message.type === 'RESET') {
      currentState = createInitialGame(message.now)
      post({ type: 'SYNC', state: currentState, events: [] })
      return
    }

    if (!currentState) {
      post({
        type: 'ERROR',
        message: 'Worker is not initialized',
        recoverable: true,
      })
      return
    }

    if (message.type === 'TICK') {
      const result = advanceGameTime(currentState, message.now)
      currentState = result.state
      post({ type: 'SYNC', state: result.state, events: result.events })
      return
    }

    if (message.type === 'INTERACT') {
      const advanceResult = advanceGameTime(currentState, message.now)
      const interactionResult = applyInteraction(
        advanceResult.state,
        message.interaction,
        message.now
      )
      currentState = interactionResult.state
      post({
        type: 'SYNC',
        state: interactionResult.state,
        events: [...advanceResult.events, ...interactionResult.events],
      })
      return
    }

    if (message.type === 'SET_NOTIFICATIONS_ENABLED') {
      const advanceResult = advanceGameTime(currentState, message.now)
      currentState = {
        ...advanceResult.state,
        settings: {
          ...advanceResult.state.settings,
          notificationsEnabled: message.enabled,
        },
      }
      post({ type: 'SYNC', state: currentState, events: advanceResult.events })
    }
  } catch (error) {
    post({
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown worker error',
      recoverable: false,
    })
  }
}

function post(message: GameWorkerResponse) {
  self.postMessage(message)
}
```

## 4. workerClient.ts

```ts
export function createGameWorkerClient() {
  const worker = new Worker(new URL('./game.worker.ts', import.meta.url), {
    type: 'module',
  })

  return {
    post(message: GameWorkerRequest) {
      worker.postMessage(message)
    },

    subscribe(onMessage: (message: GameWorkerResponse) => void) {
      const handler = (event: MessageEvent<GameWorkerResponse>) => {
        onMessage(event.data)
      }
      const errorHandler = (event: ErrorEvent) => {
        onMessage({
          type: 'ERROR',
          message: event.message || 'Worker runtime error',
          recoverable: false,
        })
      }
      const messageErrorHandler = () => {
        onMessage({
          type: 'ERROR',
          message: 'Worker message serialization failed',
          recoverable: true,
        })
      }

      worker.addEventListener('message', handler)
      worker.addEventListener('error', errorHandler)
      worker.addEventListener('messageerror', messageErrorHandler)
      return () => {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', errorHandler)
        worker.removeEventListener('messageerror', messageErrorHandler)
      }
    },

    dispose() {
      worker.terminate()
    },
  }
}
```

## 5. Zustand store

需要 `subscribeWithSelector`，否则文档里的 selector subscribe 不成立。

```ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type GameStore = {
  snapshot: GameState | null
  events: QueuedGameEvent[]
  setSnapshot: (snapshot: GameState) => void
  enqueueEvents: (events: GameEvent[]) => void
  ackEvents: (upToQueueId: number) => void
}

export type QueuedGameEvent = GameEvent & {
  queueId: number
}

let nextEventQueueId = 1

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    snapshot: null,
    events: [],
    setSnapshot: (snapshot) => set({ snapshot }),
    enqueueEvents: (events) => {
      if (events.length === 0) return
      set((state) => ({
        events: [
          ...state.events,
          ...events.map((event) => ({
            ...event,
            queueId: nextEventQueueId++,
          })),
        ],
      }))
    },
    ackEvents: (upToQueueId) =>
      set((state) => ({
        events: state.events.filter((event) => event.queueId > upToQueueId),
      })),
  }))
)
```

## 6. Runtime store

```ts
type RuntimeStore = {
  workerClient: GameWorkerClient | null
  workerReady: boolean
  focused: boolean
  notificationPermission: NotificationPermission
  setWorkerClient: (client: GameWorkerClient | null) => void
  setWorkerReady: (ready: boolean) => void
  setFocused: (focused: boolean) => void
  setNotificationPermission: (permission: NotificationPermission) => void
}
```

## 7. GameBootstrap composition root

`GameBootstrap` 是唯一 runtime composition root。它负责创建和销毁：

- `LocalStorageSaveRepository`
- `SaveCoordinator`
- `NotificationService`
- `NotificationCoordinator`
- `GameWorkerClient`
- `useGameStore` subscriptions
- tick interval
- page lifecycle listeners

其他 React 组件不得创建 Worker、repository、coordinator 或全局 timer。

文件归属：

```txt
src/game/runtime/SaveCoordinator.ts
src/game/runtime/NotificationCoordinator.ts
```

```tsx
export function GameBootstrap() {
  const setSnapshot = useGameStore((state) => state.setSnapshot)
  const enqueueEvents = useGameStore((state) => state.enqueueEvents)
  const setWorkerClient = useRuntimeStore((state) => state.setWorkerClient)
  const setWorkerReady = useRuntimeStore((state) => state.setWorkerReady)

  useEffect(() => {
    const now = Date.now()
    const repository = new LocalStorageSaveRepository()
    const saveCoordinator = new SaveCoordinator(repository)
    const notificationCoordinator = new NotificationCoordinator(
      new NotificationService()
    )
    const restored = restoreGame(repository.load(), now)
    const client = createGameWorkerClient()

    setSnapshot(restored.state)
    enqueueEvents(restored.events)
    setWorkerClient(client)

    const unsubscribeWorker = client.subscribe((message) => {
      if (message.type === 'READY') {
        setWorkerReady(true)
        setSnapshot(message.state)
      }

      if (message.type === 'SYNC') {
        setSnapshot(message.state)
        enqueueEvents(message.events)

        if (
          message.events.some((event) => event.type === 'interactionApplied')
        ) {
          saveCoordinator.saveImmediately(message.state)
        }
      }

      if (message.type === 'ERROR') {
        console.warn(message.message)
        setWorkerReady(false)
      }
    })

    const unsubscribeSave = useGameStore.subscribe(
      (state) => state.snapshot,
      (snapshot) => {
        if (!snapshot) return
        saveCoordinator.schedule(snapshot)
      }
    )

    const unsubscribeNotifications = useGameStore.subscribe(
      (state) => state.snapshot,
      (snapshot) => {
        if (!snapshot) return
        notificationCoordinator.sync(snapshot)
      }
    )

    client.post({ type: 'INIT', state: restored.state, now })

    const timer = window.setInterval(() => {
      client.post({ type: 'TICK', now: Date.now() })
    }, 5_000)

    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') saveCoordinator.flush()
    }
    const flushBeforeUnload = () => saveCoordinator.flush()

    document.addEventListener('visibilitychange', flushWhenHidden)
    window.addEventListener('beforeunload', flushBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', flushWhenHidden)
      window.removeEventListener('beforeunload', flushBeforeUnload)
      window.clearInterval(timer)
      unsubscribeNotifications()
      unsubscribeSave()
      unsubscribeWorker()
      notificationCoordinator.dispose()
      saveCoordinator.dispose()
      client.dispose()
      setWorkerClient(null)
      setWorkerReady(false)
    }
  }, [enqueueEvents, setSnapshot, setWorkerClient, setWorkerReady])

  return <GameScreen />
}
```

Cleanup 顺序必须保持：

```txt
1. 移除 page lifecycle listeners
2. 停止 tick interval
3. 取消 notification subscription
4. 取消 save subscription
5. 取消 worker subscription
6. dispose NotificationCoordinator
7. dispose SaveCoordinator 并 flush
8. terminate Worker
9. 清空 runtime store 中的 workerClient/workerReady
```

## 8. UI 发起互动和设置

```tsx
function ActionDock() {
  const workerClient = useRuntimeStore((state) => state.workerClient)
  const snapshot = useGameStore((state) => state.snapshot)

  function interact(interaction: InteractionType) {
    workerClient?.post({
      type: 'INTERACT',
      interaction,
      now: Date.now(),
    })
  }

  return (
    <nav>
      <button onClick={() => interact('feedMeal')}>Feed</button>
      <button onClick={() => interact('feedSnack')}>Snack</button>
      <button onClick={() => interact('play')}>Play</button>
      <button onClick={() => interact('clean')}>Clean</button>
      <button onClick={() => interact('medicine')}>Medicine</button>
      <button
        onClick={() =>
          interact(snapshot?.pet.sleepState === 'sleeping' ? 'wake' : 'sleep')
        }
      >
        Sleep/Wake
      </button>
    </nav>
  )
}
```

React UI 不直接改 `GameState`。按钮只发 Worker message。

通知开关也不能由 React 直接写 `GameState`。`NotificationService` 由 `GameBootstrap` 创建；`GameBootstrap` 可以把 `onEnableNotifications` callback 传给 `GameScreen` / `NotificationControl`。用户授权成功后发送 Worker 系统命令：

```ts
async function onEnableNotifications() {
  const permission = await notificationService.requestPermission()
  setNotificationPermission(permission)

  workerClient?.post({
    type: 'SET_NOTIFICATIONS_ENABLED',
    enabled: permission === 'granted',
    now: Date.now(),
  })
}
```

## 9. 主线程保存订阅

```ts
// 只在 GameBootstrap 内创建，不要在其他组件重复订阅。
const unsubscribeSave = useGameStore.subscribe(
  (state) => state.snapshot,
  (snapshot) => {
    if (!snapshot) return
    saveCoordinator.schedule(snapshot)
  }
)
```

Worker 不碰 localStorage，避免违反浏览器限制。

## 10. SaveCoordinator

存档链路由主线程 coordinator 负责闭合：初始化 repository、订阅 snapshot、互动后立即保存、tick 节流保存、页面隐藏/卸载时 flush。

```ts
export class SaveCoordinator {
  private pendingSnapshot: GameState | null = null
  private timerId: number | null = null

  constructor(private readonly repository: SaveRepository) {}

  schedule(snapshot: GameState) {
    this.pendingSnapshot = snapshot

    if (this.timerId !== null) return

    this.timerId = window.setTimeout(() => {
      this.flush()
    }, 15_000)
  }

  saveImmediately(snapshot: GameState) {
    this.pendingSnapshot = snapshot
    this.flush()
  }

  flush() {
    if (!this.pendingSnapshot) return

    const now = Date.now()
    this.repository.save({
      schemaVersion: 1,
      savedAt: now,
      gameState: {
        ...this.pendingSnapshot,
        lastSavedAt: now,
      },
    })

    this.pendingSnapshot = null

    if (this.timerId !== null) {
      window.clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  dispose() {
    this.flush()
  }
}
```

接入 `GameBootstrap`：

```ts
const coordinator = new SaveCoordinator(repository)

const unsubscribeSave = useGameStore.subscribe(
  (state) => state.snapshot,
  (snapshot) => {
    if (!snapshot) return
    coordinator.schedule(snapshot)
  }
)

const flushWhenHidden = () => {
  if (document.visibilityState === 'hidden') coordinator.flush()
}
const flushBeforeUnload = () => coordinator.flush()

document.addEventListener('visibilitychange', flushWhenHidden)
window.addEventListener('beforeunload', flushBeforeUnload)

return () => {
  unsubscribeSave()
  document.removeEventListener('visibilitychange', flushWhenHidden)
  window.removeEventListener('beforeunload', flushBeforeUnload)
  coordinator.dispose()
}
```

`interactionApplied` 事件可触发立即保存：

```ts
if (message.type === 'SYNC') {
  setSnapshot(message.state)
  enqueueEvents(message.events)

  if (message.events.some((event) => event.type === 'interactionApplied')) {
    coordinator.saveImmediately(message.state)
  }
}
```

## 11. NotificationCoordinator

通知调度也由主线程 coordinator 管理，不放在 Worker。

```ts
export class NotificationCoordinator {
  private currentPlan: ReminderPlan | null = null

  constructor(private readonly service: NotificationService) {}

  sync(snapshot: GameState) {
    if (!snapshot.settings.notificationsEnabled) {
      this.currentPlan = null
      this.service.cancelAll()
      return
    }

    const plan = createReminderPlan(snapshot, Date.now(), this.currentPlan)
    this.currentPlan = plan
    this.service.schedule(plan)
  }

  dispose() {
    this.currentPlan = null
    this.service.cancelAll()
  }
}
```

接入：

```ts
const notificationCoordinator = new NotificationCoordinator(
  new NotificationService()
)

const unsubscribeNotifications = useGameStore.subscribe(
  (state) => state.snapshot,
  (snapshot) => {
    if (!snapshot) return
    notificationCoordinator.sync(snapshot)
  }
)
```
