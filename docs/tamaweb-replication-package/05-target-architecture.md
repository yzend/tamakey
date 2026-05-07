# 05-target-architecture.md

## 1. 架构目标

目标项目采用 clean-room 架构，复刻 Tamaweb 的行为规格而不是代码结构。

核心目标：

- React 负责应用 shell、菜单、弹窗、设置、表单。
- PixiJS 负责像素游戏画布、sprite、场景、动画。
- TypeScript domain 层负责所有业务状态和规则。
- Store 负责 command 分发和 selector 派生。
- IndexedDB repository 负责版本化存档。
- 所有资源、数值、文案、配置表都由目标项目重新创建。

## 2. 目标目录结构

```text
src/
  app/
    App.tsx
    bootstrap.ts
    providers.tsx
  domain/
    pet/
      petTypes.ts
      eggLifecycle.ts
      needs.ts
      growth.ts
      wants.ts
      discipline.ts
      death.ts
    world/
      sceneTypes.ts
      sceneRules.ts
      time.ts
      weather.ts
    inventory/
      inventoryTypes.ts
      inventoryRules.ts
    missions/
      missionTypes.ts
      missionRules.ts
    garden/
      plantTypes.ts
      plantRules.ts
      animalRules.ts
    activities/
      activityTypes.ts
      activityRegistry.ts
      activityGuards.ts
    events/
      eventQueue.ts
      randomEncounters.ts
    settings/
      settingsTypes.ts
      settingsRules.ts
  state/
    gameStore.ts
    gameReducer.ts
    commands.ts
    selectors.ts
  rendering/
    GameCanvas.tsx
    pixiApp.ts
    renderSystem.ts
    spriteRegistry.ts
    sceneRenderer.ts
    animationSystem.ts
  ui/
    shell/
    menus/
    dialogs/
    controls/
  persistence/
    saveSchema.ts
    saveRepository.ts
    migrations.ts
    importExport.ts
  assets/
    assetManifest.ts
    generated/
  config/
    gameBalance.ts
    featureFlags.ts
    routes.ts
  services/
    clock.ts
    random.ts
    audio.ts
    haptics.ts
    pwa.ts
    onlineApi.ts
  tests/
```

## 3. 模块边界

| 模块          | 职责                                   | 不允许做的事                 |
| ------------- | -------------------------------------- | ---------------------------- |
| `domain`      | 纯业务规则、状态转换、事件生成         | 访问 DOM、Pixi、IndexedDB    |
| `state`       | command/reducer/store/selectors        | 写具体渲染逻辑               |
| `rendering`   | PixiJS 初始化、sprite、场景、动画表现  | 修改业务状态，除非发 command |
| `ui`          | React 菜单、弹窗、设置和表单           | 直接改 domain 对象           |
| `persistence` | 存档读写、迁移、导入导出               | 解释游戏规则                 |
| `services`    | clock/random/audio/pwa/online adapters | 保有核心状态                 |
| `config`      | 目标项目原创配置和数值                 | 复制 Tamaweb 配置表          |

## 4. React 与 PixiJS 隔离

React 和 PixiJS 通过 store 通信：

```text
React UI command -> gameStore.dispatch(command)
Pixi pointer event -> gameStore.dispatch(command)
gameReducer -> new GameState
selectors -> RenderModel
renderSystem.apply(RenderModel)
```

PixiJS 不读取 React component state。React 不直接操作 Pixi sprites。两者只共享：

- command
- selector
- render model

## 5. 数据模型

### 5.1 GameState

```ts
type GameState = {
  schemaVersion: number
  app: AppState
  pet: PetState
  world: WorldState
  inventory: InventoryState
  missions: MissionState
  garden: GardenState
  social: SocialState
  settings: SettingsState
  ui: UiState
}
```

### 5.2 PetState

```ts
type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder'
type PetStatus =
  | 'normal'
  | 'sleeping'
  | 'sick'
  | 'misbehaving'
  | 'dead'
  | 'away'

type PetState = {
  id: string
  name: string
  stage: PetStage
  status: PetStatus
  createdAt: number
  hatchStartedAt?: number
  hatchedAt?: number
  lastBirthdayAt?: number
  formId: string
  stats: {
    hunger: number
    sleep: number
    fun: number
    bladder: number
    health: number
    cleanliness: number
    discipline: number
    care: number
    deathSafety: number
  }
  skills: {
    expression: number
    logic: number
    endurance: number
  }
  flags: {
    hasPoop: boolean
    pottyTrained: boolean
    revivedOnce: boolean
    atParents: boolean
    onVacation: boolean
  }
  currentWant?: WantState
  traits: string[]
  family: FamilyState
  friends: FriendState[]
}
```

### 5.3 WorldState

```ts
type WorldState = {
  sceneId: SceneId
  time: {
    now: number
    lastSavedAt?: number
    lastOpenedAt?: number
    playTimeMs: number
  }
  activity?: ActiveActivity
  queuedEvents: QueuedEvent[]
  room: {
    backgroundId: string
    furniture: PlacedFurniture[]
  }
  weather: WeatherState
  records: Record<string, unknown>
}
```

### 5.4 SaveData

```ts
type SaveDataV1 = {
  schemaVersion: 1
  savedAt: number
  game: Omit<GameState, 'ui' | 'app'>
  settings: SettingsState
}
```

规则：

- `ui` transient，不进存档。
- `app.status` transient，不进存档。
- 存档必须版本化。
- migration 必须幂等。
- 导入存档必须校验 schema 和基础字段。

## 6. API 规格

P0/P1 不依赖外部 API。

P3 online 功能可选设计：

| API                    | 方法    | 输入                 | 输出              | 说明                 |
| ---------------------- | ------- | -------------------- | ----------------- | -------------------- |
| `/api/profile`         | GET/PUT | username/pet summary | profile           | 替代 Hubchi 上传宠物 |
| `/api/pets/random`     | GET     | count                | pet summaries     | 随机在线宠物         |
| `/api/interactions`    | POST    | targetPetId/action   | result            | 记录互动             |
| `/api/moderation/name` | POST    | name                 | allowed/sanitized | 名称审核             |

默认实现可以用 local mock，不调用 Tamaweb endpoint。

## 7. 状态流

### 7.1 首次进入

```text
BOOT_REQUESTED
LOAD_ASSETS
LOAD_SAVE -> no save
CREATE_EGG
ENTER_SCENE(home)
PLAY_INTRO
OPEN_NAME_DIALOG
EGG_TICK
HATCH_PET
ENABLE_CONTROLS
AUTO_SAVE
```

### 7.2 回访

```text
BOOT_REQUESTED
LOAD_SAVE
VALIDATE_SAVE
MIGRATE_SAVE
RESTORE_STATE
ADVANCE_OFFLINE_TIME
RESTORE_ACTIVITY_OR_SCENE
SHOW_WELCOME_BACK_IF_NEEDED
AUTO_SAVE
```

### 7.3 活动

```text
OPEN_ACTIVITY_SELECTOR
CHOOSE_ACTIVITY
RUN_ACTIVITY_GUARD
LOCK_GAMEPLAY_CONTROLS
ENTER_ACTIVITY_SCENE
RUN_ACTIVITY_SCRIPT
APPLY_REWARD_OR_EFFECT
RETURN_HOME
UNLOCK_GAMEPLAY_CONTROLS
SAVE
```

## 8. 核心算法规格

| 算法                | 输入                     | 输出                       | 文件                              |
| ------------------- | ------------------------ | -------------------------- | --------------------------------- |
| Egg lifecycle       | pet/time                 | egg visible 或 hatch event | `domain/pet/eggLifecycle.ts`      |
| Need advancement    | pet/context/delta        | next pet/events            | `domain/pet/needs.ts`             |
| Offline progression | save/now                 | advanced state             | `domain/world/time.ts`            |
| Growth              | pet/rules/random         | next form/stage            | `domain/pet/growth.ts`            |
| Want refresh        | pet/context/random       | next want                  | `domain/pet/wants.ts`             |
| Event queue gating  | state                    | runnable event             | `domain/events/eventQueue.ts`     |
| Plant lifecycle     | plant/time/weather/buffs | next plant                 | `domain/garden/plantRules.ts`     |
| Mission progress    | mission/action           | next mission               | `domain/missions/missionRules.ts` |

## 9. 权限模型

本地 P0/P1 不需要登录。

浏览器权限：

- Clipboard：导入/导出复制，可 fallback 文本框。
- Persistent storage：可请求，不强制。
- Notifications：默认不实现。
- PWA install：由 browser prompt 控制。

在线 P3：

- 需要 username。
- 需要内容审核。
- 不上传完整存档，只上传最小 pet summary。

目标项目不复刻 Tamaweb 的外部身份体系。`username` 只是本地 profile/在线昵称，不是认证凭据。若后续启用真实在线功能，必须新增独立认证方案、速率限制、内容审核和隐私策略。

## 10. 配置项

| 配置                             | 说明                      |
| -------------------------------- | ------------------------- |
| `featureFlags.onlineHub`         | 是否启用在线 Hub 替代功能 |
| `featureFlags.mods`              | 是否启用 mod              |
| `featureFlags.social`            | 是否启用社交媒体          |
| `balance.needRates`              | 目标原创需求消耗          |
| `balance.growthRules`            | 目标原创成长规则          |
| `persistence.autoSaveMs`         | 自动保存间隔              |
| `rendering.baseWidth/baseHeight` | 画布逻辑尺寸              |
| `testing.fastHatch`              | 测试环境快速孵化          |

## 11. 错误处理策略

| 错误             | 策略                                |
| ---------------- | ----------------------------------- |
| 资源加载失败     | fallback asset + error toast        |
| 存档损坏         | 备份原始内容，提示导入/重置         |
| IndexedDB 不可用 | localStorage fallback，显示风险提示 |
| 活动脚本异常     | 记录错误，回 Home，解锁 controls    |
| PWA 缓存失败     | 不阻断游戏                          |
| 在线 API 失败    | 降级到离线模式                      |
