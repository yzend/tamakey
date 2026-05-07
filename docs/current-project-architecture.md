# Tamakey 当前项目架构

本文基于当前仓库代码整理，重点说明模块职责、运行时关系和数据流；不是文件 tree 的重复。

## 1. 项目定位

Tamakey 是一个本地优先的 Web 虚拟宠物游戏：

- 前端应用：Vite + React + TypeScript。
- 游戏状态：Zustand 在主线程保存快照，Web Worker 负责推进和互动计算。
- 画面渲染：PixiJS 渲染像素宠物屏幕，React 渲染控制面板和系统 UI。
- 存档：IndexedDB 优先，localStorage 兜底，支持旧版本存档迁移和导入导出。
- PWA：vite-plugin-pwa 生成 manifest 和 service worker，用于安装和离线缓存。
- 通知：Browser Notification API + 本地 setTimeout 提醒计划。
- 联网/社交：当前是浏览器本地 mock，尚无真实后端。

## 2. 总体架构图

读图方式：从“用户操作”开始看，React 负责界面，Worker 负责游戏计算，Domain 负责纯游戏规则，Zustand 是主线程上的状态快照，PixiJS 只负责把状态画出来。

```mermaid
flowchart TB
  %% 用户和浏览器外壳
  User["用户\n点击按钮、打开菜单、切换设置"]
  Browser["浏览器 / PWA 外壳\n承载页面、Service Worker、通知权限"]

  %% 前端界面层
  React["React 界面层\nsrc/app + src/App.tsx\n负责页面、按钮、菜单、状态面板"]
  Components["React 组件\nsrc/app/components/*\n只做展示和触发命令"]

  %% 主线程状态层
  Zustand["Zustand 主线程状态\nuseGameStore: 游戏快照和事件\nuseRuntimeStore: Worker/PWA/通知/错误"]

  %% Worker 和游戏计算层
  WorkerClient["Worker 通信封装\nsrc/game/worker/workerClient.ts\n主线程 post/subscribe/dispose"]
  Worker["Game Worker\nsrc/game/worker/game.worker.ts\n持有当前 GameState，接收 INIT/TICK/INTERACT"]
  Application["应用用例层\nsrc/game/application/*\n编排恢复、时间推进、互动、提醒"]
  Domain["业务领域层，不是 DOM\nsrc/game/domain/*\n定义宠物/世界/规则/互动怎么变化"]

  %% 展示、存储、通知基础设施
  Rendering["PixiJS 游戏画面\nsrc/game/rendering/*\n把 GameState view model 画成像素屏幕"]
  Persistence["存档模块\nHybridSaveRepository\n负责读写、迁移、损坏备份"]
  IndexedDB["IndexedDB\n主存档 tamakey-save-db"]
  LocalStorage["localStorage\n旧存档兼容 + IndexedDB 失败兜底"]
  Notifications["浏览器通知\nNotificationService\n根据提醒计划 setTimeout + Notification"]
  ServiceWorker["PWA 离线缓存\nvite-plugin-pwa / Workbox"]
  TestKit["开发测试面板\nsrc/devtools/testkit\n?testkit=1 时挂载"]

  User --> Browser
  Browser --> React
  React --> Components
  React --> Zustand
  React --> WorkerClient
  WorkerClient <--> Worker
  Worker --> Application
  Application --> Domain
  Worker --> WorkerClient
  WorkerClient --> Zustand
  Zustand --> React
  Zustand --> Rendering
  Zustand --> Persistence
  Zustand --> Notifications
  Persistence --> IndexedDB
  Persistence --> LocalStorage
  Browser --> ServiceWorker
  TestKit --> Zustand
  TestKit --> WorkerClient
```

更直白地说：

- `src/app`：前端页面和按钮在哪里。
- `src/game/worker`：按钮命令怎么送进游戏运行时。
- `src/game/application`：一次操作要按什么顺序处理。
- `src/game/domain`：宠物和游戏世界到底怎么算。
- `src/game/rendering`：怎么算出来的状态怎么画成像素画面。
- `src/game/persistence`：怎么算出来的状态怎么保存。

## 3. 主运行时数据流

```mermaid
sequenceDiagram
  autonumber
  participant UI as React UI
  participant Boot as GameBootstrap
  participant Store as Zustand Stores
  participant Repo as HybridSaveRepository
  participant Worker as Game Worker
  participant App as Application Layer
  participant Domain as Domain Rules
  participant Pixi as PixiJS Renderer
  participant Notify as NotificationCoordinator

  Boot->>Repo: load()
  Repo-->>Boot: SaveData / empty / corrupt
  Boot->>App: restoreGame(loadResult, now)
  App->>Domain: hydrate + offline advance
  App-->>Boot: restored GameState + events
  Boot->>Store: setSnapshot + enqueueEvents
  Boot->>Worker: INIT(state, now)
  Worker-->>Boot: READY(state)
  Boot->>Store: workerReady = true
  Store-->>Pixi: selectPetViewModel(snapshot)
  Store-->>Notify: createReminderPlan(snapshot)

  UI->>Worker: INTERACT(command, now)
  Worker->>App: advanceGameTime(currentState, now)
  App->>Domain: lifecycle rules
  Worker->>App: applyInteraction(state, command, now)
  App->>Domain: interactionRegistry handler
  Worker-->>Store: SYNC(newState, events)
  Store-->>Pixi: render view model + play effects
  Store-->>Repo: saveNow for interaction, saveThrottled for tick
  Store-->>Notify: resync reminders
```

## 4. 源码模块职责

| 模块           | 位置                                             | 职责                                                                                                |
| -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 应用入口       | `src/main.tsx`, `src/App.tsx`                    | 挂载 React；开发环境带 `?testkit=1` 时懒加载 TestKit。                                              |
| 应用编排       | `src/app/GameBootstrap.tsx`                      | 初始化存档、Worker、Zustand、通知、PWA 更新处理；监听页面隐藏和卸载保存。                           |
| 页面 UI        | `src/app/GameScreen.tsx`, `src/app/components/*` | 将 GameState 转成屏幕快照；渲染动作、菜单、状态、系统面板；把用户操作转成 GameCommand 发给 Worker。 |
| UI 组装规则    | `src/app/gameScreenUi.ts`                        | 生成动作按钮、资源项、状态 meter 的展示模型。                                                       |
| 主线程状态     | `src/game/store/*`                               | `useGameStore` 保存游戏快照和事件队列；`useRuntimeStore` 保存 Worker、通知权限、PWA、错误状态。     |
| Worker 通信    | `src/game/worker/*`                              | 定义请求/响应协议；封装 Worker post/subscribe/dispose；Worker 内持有当前 GameState。                |
| 用例层         | `src/game/application/*`                         | 编排领域规则：创建初始状态、恢复存档、离线推进、tick 推进、互动、提醒计划。                         |
| 领域模型       | `src/game/domain/gameTypes.ts`, `constants.ts`   | 定义 GameState、PetState、资源、任务、社交、活动、事件、命令、存档类型。                            |
| 领域规则       | `src/game/domain/rules/*`                        | 生命周期衰减、睡眠、排泄、生病、成长、死亡、活动完成、花园、任务、互动 handler。                    |
| 本地模组       | `src/game/domain/mods/modSandbox.ts`             | 安全解析本地 JSON 模组，只允许受限商店物品和合成配方。                                              |
| 主线程运行协调 | `src/game/runtime/*`                             | `SaveCoordinator` 节流保存；`NotificationCoordinator` 根据状态同步本地提醒。                        |
| 存档           | `src/game/persistence/*`                         | IndexedDB/localStorage 存取、schema 校验、旧存档迁移、损坏备份、导入导出。                          |
| 渲染           | `src/game/rendering/*`                           | React 创建 Pixi Application；PixiGameRenderer 分层渲染房间、对象、宠物、特效、覆盖层。              |
| 通知           | `src/game/notifications/NotificationService.ts`  | 请求权限、调度本地 timer、展示浏览器通知、取消提醒。                                                |
| Mock 在线服务  | `src/game/services/mockOnlineApi.ts`             | 本地模拟资料、好友、在线宠物、社交动态、快餐下单。未来真实 API 可替换这个边界。                     |
| DevTools       | `src/devtools/testkit/*`                         | 仅开发/测试时挂载，用于切换场景、调状态、跳时间、导入测试状态。                                     |
| 样式和资产     | `src/styles/*`, `public/assets/*`                | 全局样式、主题 token、像素字体和 PWA 图标等静态资源。                                               |
| 测试           | `src/**/*.test.ts`, `tests/e2e/*`                | Vitest 覆盖领域和导入导出；Playwright 覆盖核心用户流、PWA、移动布局和 TestKit 场景。                |

## 5. 模块依赖图

```mermaid
flowchart LR
  main["main.tsx"] --> app["App / GameBootstrap / GameScreen"]
  app --> components["app/components"]
  app --> store["game/store"]
  app --> workerClient["game/worker/workerClient"]
  app --> runtime["game/runtime"]
  app --> persistence["game/persistence"]
  app --> rendering["game/rendering"]
  app --> notifications["game/notifications"]

  workerClient --> protocol["game/worker/protocol"]
  worker["game/worker/game.worker"] --> protocol
  worker --> application["game/application"]

  runtime --> persistence
  runtime --> notifications
  runtime --> application

  persistence --> saveSchema["persistence/saveSchema"]
  saveSchema --> domain["game/domain"]
  saveSchema --> application

  application --> domain
  domain --> rules["game/domain/rules"]
  rules --> shared["shared/clamp"]
  rules --> modSandbox["domain/mods/modSandbox"]
  rules --> mockOnline["game/services/mockOnlineApi"]

  rendering --> viewModels["rendering/viewModels"]
  viewModels --> domain
  rendering --> pixi["pixi.js"]

  components --> viewModels
  testkit["devtools/testkit"] --> store
  testkit --> workerClient
```

## 6. GameState 的主要内容

`GameState` 是项目的核心真相源，Worker 持有当前值，主线程只拿快照展示和持久化。

```mermaid
mindmap
  root((GameState))
    pet
      stage/mood/age
      hunger/happiness/cleanliness
      bladder/energy/health
      sickness/sleep/care
      skills/want/misbehavior
      accessories
    resources
      coins
      food/items/seeds
      furniture/accessories/materials
      medicine
    world
      scene/activity/room
      poop/digestion/weather
      furniture placements
    missions
      daily seed/reset
      mission list/points
    garden
      plots/harvests
      animals/weather/buff
    catalogs
      shop/craft
      activities/minigames
      evolutions
    social
      profile/friends/posts
      mock online
    settings
      notification/sound/theme
      PWA update
    featureFlags
      social/onlineHub/mods
    ui
      displayStack
      lastToast
```

## 7. 业务领域模块地图

这一节按“前端开发时想找某类业务代码”来分，不按目录 tree 分。

```mermaid
flowchart TB
  GameState["GameState\n整个游戏的总状态\nsrc/game/domain/gameTypes.ts"]

  Pet["宠物基础信息\npet\n名字、阶段、心情、年龄、饥饿、快乐、清洁、健康、睡眠、生病"]
  World["全局世界信息\nworld\n当前场景、活动、房间、便便数量、天气、家具摆放"]
  Resources["资源和背包\nresources\n金币、食物、道具、种子、家具、饰品、材料、药品"]
  Missions["任务系统\nmissions\n每日任务、任务进度、奖励金币"]
  Garden["花园系统\ngarden\n地块、作物、收获、动物、天气 buff"]
  Catalogs["配置目录\ncatalogs\n商店商品、合成配方、活动、小游戏、成长规则"]
  Social["本地社交/模拟在线\nprofile / friends / social / mockOnline\n昵称、好友、动态、模拟在线宠物"]
  Settings["设置和功能开关\nsettings / featureFlags\n主题、声音、通知、快速孵化、社交/在线/模组开关"]
  UiState["游戏内 UI 状态\nui\n打开了哪些菜单、最近 toast"]

  GameState --> Pet
  GameState --> World
  GameState --> Resources
  GameState --> Missions
  GameState --> Garden
  GameState --> Catalogs
  GameState --> Social
  GameState --> Settings
  GameState --> UiState

  Pet --> Lifecycle["宠物自然变化\nrules/lifecycle.ts\n年龄、饥饿、清洁、睡眠、生病、成长、死亡"]
  Pet --> Interactions["玩家互动\nrules/interactions.ts\n喂食、玩耍、洗澡、睡觉、买东西、发动态"]
  World --> Activities["活动处理\nrules/activities.ts + lifecycle.ts\n活动开始、结束、奖励、场景切换"]
  Garden --> GardenRules["花园规则\nrules/garden.ts + interactions.ts\n种植、浇水、成熟、收获"]
  Missions --> MissionRules["任务规则\nrules/missions.ts + interactions.ts\n进度更新、每日重置、领奖"]
  Catalogs --> InitialGame["初始配置\napplication/createInitialGame.ts\n默认商品、活动、小游戏、成长表"]
```

### 前端常找的代码位置

| 你想找的内容             | 主要看哪里                                                                  | 说明                                                                       |
| ------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 宠物基础信息有哪些       | `src/game/domain/gameTypes.ts` 里的 `PetState`                              | 阶段、心情、年龄、饥饿、快乐、清洁、膀胱、能量、健康、生病、睡眠都在这里。 |
| 整个游戏全局信息有哪些   | `src/game/domain/gameTypes.ts` 里的 `GameState`                             | `pet/resources/world/missions/garden/settings` 这些都挂在总状态下面。      |
| 初始宠物、初始金币和背包 | `src/game/application/createInitialGame.ts`                                 | 新开局默认值、默认商店商品、活动、任务、成长规则都从这里来。               |
| 时间流逝怎么影响宠物     | `src/game/application/advanceGameTime.ts` 和 `src/game/domain/rules/*`      | 每次 tick 会按固定顺序计算饥饿、清洁、生病、成长、死亡等。                 |
| 点击按钮后怎么改状态     | `src/game/application/applyInteraction.ts` 和 `rules/interactions.ts`       | `applyInteraction` 找 handler，具体喂食/洗澡/买东西逻辑在 interactions。   |
| 渲染代码在哪里           | `src/game/rendering/PixiStage.tsx`, `PixiGameRenderer.ts`, 各 Renderer      | Pixi 只消费 view model，不直接改游戏规则。                                 |
| React 页面在哪里         | `src/app/GameScreen.tsx`, `src/app/components/*`, `src/app/gameScreenUi.ts` | UI 负责展示状态，并把操作转成 `GameCommand`。                              |
| UI 用的宠物展示数据      | `src/game/rendering/viewModels.ts`                                          | `selectPetViewModel` 把完整 `GameState` 裁剪成渲染需要的数据。             |
| 存档结构和迁移           | `src/game/persistence/saveSchema.ts`, `HybridSaveRepository.ts`             | 校验、迁移、IndexedDB/localStorage 兜底都在这里。                          |
| 通知提醒                 | `src/game/application/createReminderPlan.ts`, `runtime/Notification*`       | 根据状态生成提醒，再交给浏览器通知服务。                                   |
| 社交和在线模拟           | `src/game/services/mockOnlineApi.ts`, `rules/interactions.ts`               | 目前是本地 mock，不是真后端。                                              |

## 8. 业务到渲染的对应关系

```mermaid
flowchart LR
  DomainState["GameState\n完整业务状态"]
  Selector["selectPetViewModel\nsrc/game/rendering/viewModels.ts\n从完整状态里挑渲染需要的数据"]
  PixiStage["PixiStage.tsx\nReact 里创建 Pixi Application"]
  PixiRenderer["PixiGameRenderer.ts\n管理 Pixi 图层"]
  Room["RoomRenderer\n画房间/背景"]
  Objects["ObjectRenderer\n画家具、场景物件"]
  PetSprite["PetSpriteRenderer\n画宠物阶段和动画"]
  Effects["EffectRenderer\n画互动、孵化、进化、生病等特效"]
  Overlay["ScreenOverlayRenderer\n画屏幕覆盖效果"]

  DomainState --> Selector
  Selector --> PixiStage
  PixiStage --> PixiRenderer
  PixiRenderer --> Room
  PixiRenderer --> Objects
  PixiRenderer --> PetSprite
  PixiRenderer --> Effects
  PixiRenderer --> Overlay
```

渲染层的关键边界：它只负责“把状态画出来”。例如宠物饿不饿、生不生病、能不能成长，不在 PixiJS 里算；这些都在 `domain/application` 里算完后，再传给渲染层。

## 9. 互动和 tick 的处理逻辑

```mermaid
flowchart TD
  TickOrInteract["TICK 或 INTERACT"] --> Advance["advanceGameTime"]
  Advance --> Age["incrementAge"]
  Age --> MissionReset["applyDailyMissionReset"]
  MissionReset --> Decay["applyNaturalDecay"]
  Decay --> Sleep["applySleep"]
  Sleep --> Poop["applyPoopGeneration"]
  Poop --> Pressure["applyCarePressure"]
  Pressure --> Sick["applySicknessPressure"]
  Sick --> Health["applyHealthPressure"]
  Health --> Evolution["applyEvolution"]
  Evolution --> Garden["applyGardenProgress"]
  Garden --> Activity["applyActivityCompletion"]
  Activity --> Want["applyWantAndMisbehavior"]
  Want --> Mood["applyMood"]
  Mood --> Death["applyDeath"]

  Death --> IsInteract{"INTERACT?"}
  IsInteract -- "否" --> Sync["SYNC(state, events)"]
  IsInteract -- "是" --> Registry["interactionRegistry[command.type]"]
  Registry --> CanApply{"canApply?"}
  CanApply -- "否" --> Invalid["invalidInteraction + toast"]
  CanApply -- "是" --> Apply["handler.apply"]
  Apply --> DeathAfter["applyDeath again"]
  Invalid --> Sync
  DeathAfter --> Sync
```

## 10. 存档与离线推进

```mermaid
flowchart TB
  Load["启动 load()"] --> IDB["IndexedDB load"]
  IDB -- ok --> Restore["restoreGame"]
  IDB -- empty --> LS["localStorage legacy/fallback load"]
  IDB -- corrupt/error --> Fallback["fallback to localStorage"]
  LS -- ok --> MigrateToIDB["async save to IndexedDB"]
  LS --> Restore
  Fallback --> Restore
  Restore --> Validate["validateSaveData / migrateLegacySaveData"]
  Validate --> Hydrate["hydrateSavedGame"]
  Hydrate --> Offline["advanceGameTimeByDelta\n最多 MAX_OFFLINE_MS"]
  Offline --> Store["setSnapshot"]

  Store --> SaveDecision{"保存场景"}
  SaveDecision -- "互动事件" --> SaveNow["saveNow"]
  SaveDecision -- "tick/ready" --> SaveThrottle["saveThrottled 15s"]
  SaveDecision -- "隐藏/卸载" --> SaveNow
  SaveNow --> CreateSave["createSaveData\n去掉 ui，分离 settings/profile"]
  SaveThrottle --> CreateSave
  CreateSave --> IDBSave["IndexedDB save"]
  IDBSave -- "失败" --> LSSave["localStorage fallback"]
```

## 11. PWA 和通知

```mermaid
flowchart LR
  Vite["vite.config.ts"] --> PWA["vite-plugin-pwa"]
  PWA --> Manifest["manifest\nname/icons/start_url"]
  PWA --> Workbox["Workbox glob cache"]
  Browser["Browser"] --> SW["serviceWorker.ready/getRegistration"]
  SW --> RuntimeStore["pwaOfflineReady / pwaUpdateAvailable"]
  RuntimeStore --> UI["System/Menu Panel update button"]

  GameState["GameState"] --> ReminderPlan["createReminderPlan"]
  ReminderPlan --> NotificationCoordinator
  Permission["Notification.permission"] --> NotificationCoordinator
  NotificationCoordinator --> NotificationService
  NotificationService --> Timers["window.setTimeout"]
  Timers --> NativeNotification["new Notification(...)"]
```

注意：`README.md` 写的是 PWA `registerType: 'autoUpdate'`，但当前 `vite.config.ts` 是 `registerType: 'prompt'`，并且 `GameBootstrap` 实现了发现新版后提示并触发 `SKIP_WAITING` 的逻辑。以当前代码为准。

## 12. 当前边界和不确定点

- 当前没有真实后端。好友、社交、在线中心都通过 `mockOnlineApi` 在本地模拟；`docs/⭐️backend-capabilities-todo.md` 已列出后端演进方向。
- 设计文档强调 domain 应保持纯规则层，但当前 `src/game/domain/rules/interactions.ts` 直接依赖了 `src/game/services/mockOnlineApi.ts`。这在现状可工作，但如果后续接真实 API，建议把 mock/real online adapter 上移到 application 或 infrastructure 边界。
- 存档实际已经从早期文档的 localStorage MVP 进化为 IndexedDB 优先、localStorage fallback。
- PWA 更新策略文档和代码存在差异，见上一节。
- 本地模组只解析受限 JSON 配置，不执行用户脚本，也不加载远程资源。

## 13. 阅读代码建议顺序

1. `src/app/GameBootstrap.tsx`：理解启动、Worker、存档、通知、PWA 的总编排。
2. `src/game/domain/gameTypes.ts`：理解核心 GameState 结构。
3. `src/game/worker/game.worker.ts`：理解命令如何进入游戏逻辑。
4. `src/game/application/advanceGameTime.ts` 和 `applyInteraction.ts`：理解 tick 和互动的主流程。
5. `src/game/domain/rules/interactions.ts`、`rules/lifecycle.ts`：理解具体玩法规则。
6. `src/app/GameScreen.tsx` 和 `src/app/components/*`：理解 UI 如何把状态展示出来、如何发命令。
7. `src/game/rendering/PixiStage.tsx`、`PixiGameRenderer.ts`：理解 PixiJS 渲染层。
8. `src/game/persistence/HybridSaveRepository.ts`、`saveSchema.ts`：理解存档、迁移、校验。
