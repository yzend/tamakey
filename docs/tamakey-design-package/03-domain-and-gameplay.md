# 03. Domain 与玩法设计

## 1. MVP 玩法闭环

```txt
查看状态
  -> 发现饥饿/低快乐/脏/生病/困
  -> 执行互动
  -> 状态改变
  -> 播放反馈动画
  -> 保存
  -> 关闭游戏
  -> 下次打开做离线推进
```

## 2. 核心类型

```ts
export type PetStage =
  | 'egg'
  | 'baby'
  | 'child'
  | 'teen'
  | 'adult'
  | 'elder'
  | 'dead'

export type PetMood =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sick'
  | 'sleepy'
  | 'sleeping'

export type SicknessState = 'none' | 'mild' | 'severe'
export type SleepState = 'awake' | 'sleeping'

export type InventoryItem = {
  id: string
  quantity: number
}
```

MVP 阶段实际使用：

```txt
egg
baby
child
adult
dead
```

`teen` 和 `elder` 保留在类型中，作为后续扩展阶段；MVP 资产可以先 fallback 到 `child`/`adult`。

## 3. GameState

```ts
export type PetState = {
  id: string
  name: string
  species: string
  stage: PetStage
  mood: PetMood
  ageSeconds: number
  hunger: number
  happiness: number
  cleanliness: number
  energy: number
  health: number
  sickness: SicknessState
  sleepState: SleepState
  careMistakes: number
  bornAt: number
  lastInteractionAt: number
}

export type GameState = {
  version: number
  pet: PetState
  resources: {
    coins: number
    food: InventoryItem[]
    medicine: number
  }
  world: {
    poopCount: number
    roomId: string
    digestionSeconds: number
  }
  carePressure: {
    hungrySeconds: number
    dirtySeconds: number
    sickSeconds: number
  }
  settings: {
    notificationsEnabled: boolean
    reducedMotion: boolean
    soundEnabled: boolean
  }
  createdAt: number
  lastTickAt: number
  lastSavedAt: number | null
}
```

## 4. GameEvent

`GameEvent` 是 Worker、Zustand、PixiJS 动画和 UI 提示之间的协议。

```ts
export type GameEvent =
  | { type: 'hatched'; at: number }
  | { type: 'evolved'; from: PetStage; to: PetStage; at: number }
  | { type: 'poopCreated'; count: number; at: number }
  | { type: 'becameSick'; sickness: SicknessState; at: number }
  | { type: 'recovered'; at: number }
  | { type: 'died'; reason: 'hunger' | 'sickness' | 'neglect'; at: number }
  | { type: 'interactionApplied'; interaction: InteractionType; at: number }
  | {
      type: 'invalidInteraction'
      interaction: InteractionType
      reason: string
      at: number
    }
```

## 5. 结果类型与工具函数

所有 domain/application 函数必须返回 plain object，不能返回 class 实例。

```ts
export type AdvanceResult = {
  state: GameState
  events: GameEvent[]
}

export type RestoreResult = {
  state: GameState
  events: GameEvent[]
  offlineSummary: OfflineSummary | null
  recoveredFromCorruptSave: boolean
}

export type OfflineSummary = {
  elapsedMs: number
  simulatedMs: number
  messages: string[]
}

export function summarizeOfflineProgress(
  before: GameState,
  after: GameState,
  elapsedMs: number,
  simulatedMs: number
): OfflineSummary
```

数值工具放在 `src/shared/clamp.ts`：

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function clampInteger(value: number, min: number, max: number): number {
  return Math.trunc(clamp(value, min, max))
}
```

## 6. 数值语义

```txt
hunger:
  0   = 不饿
  100 = 极度饥饿

happiness:
  0   = 极不开心
  100 = 很开心

cleanliness:
  0   = 很脏
  100 = 很干净

energy:
  0   = 没精力
  100 = 精力充足

health:
  0   = 死亡
  100 = 健康
```

## 7. 初始游戏

```ts
export function createInitialGame(now: number): GameState {
  return {
    version: 1,
    pet: {
      id: crypto.randomUUID(),
      name: 'Tamakey',
      species: 'starter',
      stage: 'egg',
      mood: 'idle',
      ageSeconds: 0,
      hunger: 0,
      happiness: 60,
      cleanliness: 100,
      energy: 80,
      health: 100,
      sickness: 'none',
      sleepState: 'awake',
      careMistakes: 0,
      bornAt: now,
      lastInteractionAt: now,
    },
    resources: {
      coins: 0,
      food: [{ id: 'basic-meal', quantity: 5 }],
      medicine: 2,
    },
    world: {
      poopCount: 0,
      roomId: 'default',
      digestionSeconds: 0,
    },
    carePressure: {
      hungrySeconds: 0,
      dirtySeconds: 0,
      sickSeconds: 0,
    },
    settings: {
      notificationsEnabled: false,
      reducedMotion: false,
      soundEnabled: true,
    },
    createdAt: now,
    lastTickAt: now,
    lastSavedAt: null,
  }
}
```

## 8. 互动类型

孵化采用自动孵化：`egg` 到达年龄阈值后由 `applyEvolution` 触发 `hatched` 事件，不提供用户点击孵化的 `hatch` 互动。

`status` 是纯 UI 菜单，`reset` 走 Worker 的 `RESET` 消息，不属于宠物互动规则。

```ts
export type InteractionType =
  | 'feedMeal'
  | 'feedSnack'
  | 'play'
  | 'clean'
  | 'medicine'
  | 'sleep'
  | 'wake'
```

MVP 操作按钮是 6 个照顾入口：

```txt
feedMeal
feedSnack
play
clean
medicine
sleep/wake
```

其中 `sleep/wake` 共用一个按钮，根据当前 `sleepState` 发送不同 interaction。

`RESET` 是 Worker 系统命令：

```ts
{
  type: 'RESET'
  now
}
```

Worker 收到 `RESET` 后必须自己调用 `createInitialGame(now)`。主线程不能传入自造的 `GameState`。

它不能进入 `InteractionType`，也不能由 `applyInteraction` 处理。

## 9. 互动效果

| 互动        | 条件                        | 结果                                             |
| ----------- | --------------------------- | ------------------------------------------------ |
| `feedMeal`  | 非 egg/dead，醒着，饥饿 > 5 | hunger -28，happiness +3，energy -2              |
| `feedSnack` | 非 egg/dead，醒着           | hunger -10，happiness +12，health -2             |
| `play`      | 非 egg/dead，醒着，非重病   | happiness +18，energy -12，hunger +8             |
| `clean`     | 非 egg/dead                 | cleanliness +45，poopCount = 0，dirtySeconds = 0 |
| `medicine`  | 非 egg/dead，有病，有药     | severe -> mild 或 mild -> none，health +30       |
| `sleep`     | 非 egg/dead，醒着           | sleepState = sleeping                            |
| `wake`      | sleeping                    | sleepState = awake                               |

## 10. InteractionHandler

```ts
export type InteractionContext = {
  now: number
}

export type InteractionResult = {
  state: GameState
  events: GameEvent[]
}

export interface InteractionHandler {
  canApply(state: GameState): boolean
  apply(state: GameState, context: InteractionContext): InteractionResult
}
```

## 11. InteractionRegistry

`applyInteraction` 只通过 registry 分发。新增互动只能新增 handler 并注册，不改调用者。

```ts
export type InteractionRegistry = Record<InteractionType, InteractionHandler>

export const interactionRegistry: InteractionRegistry = {
  feedMeal: new FeedMealHandler(),
  feedSnack: new FeedSnackHandler(),
  play: new PlayHandler(),
  clean: new CleanHandler(),
  medicine: new MedicineHandler(),
  sleep: new SleepHandler(),
  wake: new WakeHandler(),
}

export function applyInteraction(
  state: GameState,
  interaction: InteractionType,
  now: number
): InteractionResult {
  const handler = interactionRegistry[interaction]

  if (!handler.canApply(state)) {
    return {
      state,
      events: [
        {
          type: 'invalidInteraction',
          interaction,
          reason: 'Interaction is not allowed in the current state',
          at: now,
        },
      ],
    }
  }

  const result = handler.apply(state, { now })

  return {
    state: result.state,
    events: [
      ...result.events,
      {
        type: 'interactionApplied',
        interaction,
        at: now,
      },
    ],
  }
}
```

`interactionApplied` 由 `applyInteraction` wrapper 统一追加。单个 handler 只返回业务事件，例如 `recovered`、`poopCreated` 或 `invalidInteraction`。这样保存和视觉反馈不会依赖每个 handler 自行记得发通用事件。

## 12. 时间推进

在线 tick：

```txt
每 5 秒一次
```

离线推进：

```txt
读取 lastTickAt
计算 now - lastTickAt
限制最大模拟时长
调用同一个 advanceGameTimeByDelta
```

```ts
export function advanceGameTime(state: GameState, now: number): AdvanceResult {
  if (state.pet.stage === 'dead') {
    return {
      state: {
        ...state,
        lastTickAt: now,
      },
      events: [],
    }
  }

  const deltaMs = Math.max(0, now - state.lastTickAt)
  return advanceGameTimeByDelta(state, deltaMs / 1000, now)
}
```

主流程：

```ts
export function advanceGameTimeByDelta(
  state: GameState,
  deltaSeconds: number,
  now: number
): AdvanceResult {
  if (state.pet.stage === 'dead') {
    return {
      state: {
        ...state,
        lastTickAt: now,
      },
      events: [],
    }
  }

  const events: GameEvent[] = []

  let next = incrementAge(state, deltaSeconds)
  next = applyNaturalDecay(next, deltaSeconds)
  next = applySleep(next, deltaSeconds)
  next = applyPoopGeneration(next, deltaSeconds, events, now)
  next = applyCarePressure(next, deltaSeconds)
  next = applySicknessPressure(next, events, now)
  next = applyHealthPressure(next, deltaSeconds)
  next = applyEvolution(next, events, now)
  next = applyMood(next)
  next = applyDeath(next, events, now)

  return {
    state: {
      ...next,
      lastTickAt: now,
    },
    events,
  }
}
```

`incrementAge` 是纯函数，只累加存活宠物的年龄：

```ts
function incrementAge(state: GameState, deltaSeconds: number): GameState {
  if (state.pet.stage === 'dead') return state

  return {
    ...state,
    pet: {
      ...state.pet,
      ageSeconds: state.pet.ageSeconds + deltaSeconds,
    },
  }
}
```

## 13. 自然衰减

```ts
function applyNaturalDecay(state: GameState, deltaSeconds: number): GameState {
  const hours = deltaSeconds / 3600
  const pet = state.pet

  return {
    ...state,
    pet: {
      ...pet,
      hunger: clamp(pet.hunger + 12 * hours, 0, 100),
      happiness: clamp(pet.happiness - 8 * hours, 0, 100),
      cleanliness: clamp(pet.cleanliness - 6 * hours, 0, 100),
    },
  }
}
```

## 14. 睡眠

```ts
function applySleep(state: GameState, deltaSeconds: number): GameState {
  const hours = deltaSeconds / 3600

  if (state.pet.sleepState === 'sleeping') {
    return {
      ...state,
      pet: {
        ...state.pet,
        energy: clamp(state.pet.energy + 25 * hours, 0, 100),
      },
    }
  }

  return {
    ...state,
    pet: {
      ...state.pet,
      energy: clamp(state.pet.energy - 6 * hours, 0, 100),
    },
  }
}
```

## 15. 排泄与累计压力

```ts
function applyPoopGeneration(
  state: GameState,
  deltaSeconds: number,
  events: GameEvent[],
  now: number
): GameState {
  const total = state.world.digestionSeconds + deltaSeconds
  const poopIncrease = Math.floor(total / (3 * 3600))
  const remaining = total % (3 * 3600)
  const nextPoopCount = clampInteger(state.world.poopCount + poopIncrease, 0, 5)

  if (nextPoopCount > state.world.poopCount) {
    events.push({ type: 'poopCreated', count: nextPoopCount, at: now })
  }

  return {
    ...state,
    world: {
      ...state.world,
      poopCount: nextPoopCount,
      digestionSeconds: remaining,
    },
  }
}
```

```ts
function applyCarePressure(state: GameState, deltaSeconds: number): GameState {
  return {
    ...state,
    carePressure: {
      hungrySeconds:
        state.pet.hunger > 85
          ? state.carePressure.hungrySeconds + deltaSeconds
          : 0,
      dirtySeconds:
        state.pet.cleanliness < 20 || state.world.poopCount >= 3
          ? state.carePressure.dirtySeconds + deltaSeconds
          : 0,
      sickSeconds:
        state.pet.sickness !== 'none'
          ? state.carePressure.sickSeconds + deltaSeconds
          : 0,
    },
  }
}
```

## 16. 生病、健康、死亡

```txt
dirtySeconds > 3 小时 -> mild sickness
sickSeconds > 6 小时 -> severe sickness
hungrySeconds > 4 小时 -> health 持续下降
severe sickness -> health 持续下降
health <= 0 -> dead
```

```ts
function applySicknessPressure(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  if (
    state.pet.sickness === 'none' &&
    state.carePressure.dirtySeconds > 3 * 3600
  ) {
    events.push({ type: 'becameSick', sickness: 'mild', at: now })
    return {
      ...state,
      pet: {
        ...state.pet,
        sickness: 'mild',
      },
    }
  }

  if (
    state.pet.sickness === 'mild' &&
    state.carePressure.sickSeconds > 6 * 3600
  ) {
    events.push({ type: 'becameSick', sickness: 'severe', at: now })
    return {
      ...state,
      pet: {
        ...state.pet,
        sickness: 'severe',
      },
    }
  }

  return state
}
```

```ts
function applyHealthPressure(
  state: GameState,
  deltaSeconds: number
): GameState {
  const hours = deltaSeconds / 3600
  let healthLoss = 0

  if (state.carePressure.hungrySeconds > 4 * 3600) healthLoss += 8 * hours
  if (state.pet.sickness === 'mild') healthLoss += 3 * hours
  if (state.pet.sickness === 'severe') healthLoss += 10 * hours

  if (healthLoss === 0) return state

  return {
    ...state,
    pet: {
      ...state.pet,
      health: clamp(state.pet.health - healthLoss, 0, 100),
    },
  }
}
```

```ts
function applyDeath(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  if (state.pet.health > 0) return state
  if (state.pet.stage === 'dead') return state

  events.push({ type: 'died', reason: 'neglect', at: now })

  return {
    ...state,
    pet: {
      ...state.pet,
      stage: 'dead',
      mood: 'idle',
    },
  }
}
```

## 17. 成长

开发环境可以短周期，正式环境再拉长。

```ts
export const DEV_EVOLUTION_THRESHOLDS_SECONDS = {
  egg: 10,
  baby: 60,
  child: 180,
  adult: 600,
} as const
```

正式建议：

```txt
egg: 3 分钟
baby: 30 分钟
child: 24 小时
adult: 5 天
```

```ts
function applyEvolution(
  state: GameState,
  events: GameEvent[],
  now: number
): GameState {
  const previous = state.pet.stage
  const next = deriveNextStageForMvp(state.pet.ageSeconds)

  if (previous === next) return state

  events.push(
    previous === 'egg'
      ? { type: 'hatched', at: now }
      : { type: 'evolved', from: previous, to: next, at: now }
  )

  return {
    ...state,
    pet: {
      ...state.pet,
      stage: next,
    },
  }
}

function deriveNextStageForMvp(ageSeconds: number): PetStage {
  if (ageSeconds < 3 * 60) return 'egg'
  if (ageSeconds < 30 * 60) return 'baby'
  if (ageSeconds < 24 * 60 * 60) return 'child'
  return 'adult'
}
```

后续成长路线可以受 careScore 影响。

## 18. Mood 推导

```ts
function applyMood(state: GameState): GameState {
  const pet = state.pet
  let mood: PetMood = 'idle'

  if (pet.stage === 'dead') mood = 'idle'
  else if (pet.sleepState === 'sleeping') mood = 'sleeping'
  else if (pet.sickness !== 'none') mood = 'sick'
  else if (pet.energy < 15) mood = 'sleepy'
  else if (pet.hunger > 85) mood = 'angry'
  else if (pet.happiness < 25) mood = 'sad'
  else if (pet.happiness > 75 && pet.hunger < 50) mood = 'happy'

  return {
    ...state,
    pet: {
      ...pet,
      mood,
    },
  }
}
```
