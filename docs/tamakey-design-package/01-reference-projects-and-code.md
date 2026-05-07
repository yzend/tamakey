# 01. 参考项目模式分析

## 1. 调研结论

不要 fork 参考项目。Tamakey 应该做原创实现，只吸收架构模式和玩法模式。

| 项目                                                                 | 主要价值                          | 主要风险                                                                          | 对 Tamakey 的采用方式        |
| -------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- | ---------------------------- |
| [Tamaweb](https://github.com/autosam/Tamaweb)                        | 玩法广度、离线推进、PWA、存档边界 | CC BY-NC-SA 4.0，非商业和相同方式共享限制，素材和品牌额外受限                     | 只提炼通用产品需求和架构模式 |
| [tamagotchi-p1-web](https://github.com/tonypan2/tamagotchi-p1-web)   | React/Vite + Worker + 存档边界    | 无 LICENSE，依赖原版 ROM，含 emulator/WASM/HAL 路线，TamaLIB 子模块许可需单独核查 | 只借鉴 Worker/UI 解耦        |
| [jcreighton/tamagotchi](https://github.com/jcreighton/tamagotchi)    | MIT，Canvas 像素动画简单          | 玩法浅，无存档/PWA                                                                | 借鉴 sprite 动画节奏         |
| [tamagotchiClone](https://github.com/ChrisChrisLoLo/tamagotchiClone) | 菜单和玩法项完整                  | 无 LICENSE，Phaser 2 老旧                                                         | 借鉴菜单结构和玩法清单       |

## 2. 参考模式分析规范

下面只记录关键文件、行为模式和抽象伪代码。实现 Tamakey 时不要复制未授权代码。

硬规则：

- CC BY-NC-SA 来源不得进入实现代码、配置数据、数值表、素材或可分发产物。
- 无 LICENSE 来源不得复制代码、素材、字段表、概率公式、状态组织方式或 UI 表达。
- tamagotchi-p1-web 的 TamaLIB、WASM/HAL、ROM、ROM hash、ROM 处理脚本和仿真实现都不进入 Tamakey。
- Tamaweb 的存档 key、任务表、成长配置、资源定义、素材、声音、字体、品牌和 UI 表达都不进入 Tamakey。
- jcreighton/tamagotchi 是 MIT；优先也只借鉴模式。若未来确实复制 MIT 代码，必须在项目 NOTICE/LICENSE 中保留原版权和许可证声明。
- 实现人员应按本文档里的 Tamakey 伪代码 clean-room 重写，不从参考仓库复制粘贴。

对每个模式都给出：

- 来源文件。
- 代码意图。
- 可借鉴点。
- Tamakey 的重写方案。

## 3. Tamaweb：离线推进

来源：

- `autosam/Tamaweb/src/App.js`
- 本地调研路径：`/tmp/tamakey-reference-repos/Tamaweb/src/App.js`
- 关键位置：约 367-386 行

行为模式伪代码：

```js
if (save.hasLastUpdatedAt) {
  elapsedMs = now - save.lastUpdatedAt
  simulateOfflineProgress(elapsedMs)
}
```

代码意图：

- 存档恢复后读取 `lastTime`。
- 用当前时间计算离线时长。
- 把离线时长交给宠物规则做一次批量推进。

可借鉴点：

- 存档必须保存最后更新时间。
- 离线推进应该在恢复时完成。
- 离线恢复后应该给玩家反馈。

Tamakey 重写方案：

```ts
export function restoreGame(
  loadResult: LoadSaveResult,
  now: number
): RestoreResult {
  if (loadResult.status !== 'ok') {
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: loadResult.status === 'corrupt',
    }
  }

  const base = migrateSave(loadResult.data).gameState
  const elapsedMs = Math.max(0, now - base.lastTickAt)
  const simulatedMs = Math.min(elapsedMs, MAX_OFFLINE_MS)
  const result = advanceGameTimeByDelta(base, simulatedMs / 1000, now)

  return {
    state: result.state,
    events: result.events,
    offlineSummary: summarizeOfflineProgress(
      base,
      result.state,
      elapsedMs,
      simulatedMs
    ),
  }
}
```

## 4. Tamaweb：存档策略

来源：

- `autosam/Tamaweb/src/App.js`
- 关键位置：约 7925-8030 行

行为模式伪代码：

```js
savePayload = collectGameModules()
savePayload.lastUpdatedAt = now
writePrimaryStorage(savePayload)
writeFallbackStorage(savePayload)
```

代码意图：

- 把多个领域对象拆成多个 key 保存。
- 同时有 IndexedDB 和 localStorage fallback。
- 保存 `last_time` 支持离线推进。

可借鉴点：

- 不只存宠物，也要存设置、房间、任务、资源。
- 保存时机需要节流。
- 要有 fallback 或坏档恢复。

Tamakey 重写方案：

```ts
export type SaveData = {
  schemaVersion: 1
  savedAt: number
  gameState: GameState
}

repository.save({
  schemaVersion: 1,
  savedAt: now,
  gameState: {
    ...state,
    lastSavedAt: now,
  },
})
```

MVP 只用一个 localStorage key，后续再迁移 IndexedDB。

## 5. Tamaweb：Canvas 绘制和 z 排序

来源：

- `autosam/Tamaweb/src/Drawer.js`
- 关键位置：约 1-58 行

行为模式伪代码：

```js
disableImageSmoothing()
sortDrawableObjectsByDepth()
drawObjectsInOrder()
```

代码意图：

- 关闭图像平滑，保持像素风锐利。
- 每帧按 z/localZ 排序后绘制。

可借鉴点：

- PixiJS 也要关闭抗锯齿和纹理平滑。
- 渲染对象需要明确层级，不要靠 React DOM 顺序控制宠物画面。

Tamakey 重写方案：

```ts
await app.init({
  width: 160,
  height: 144,
  antialias: false,
  resolution: 1,
})

roomLayer.zIndex = 0
objectLayer.zIndex = 10
petLayer.zIndex = 20
effectLayer.zIndex = 30
```

## 6. Tamaweb：PWA 注册

来源：

- `autosam/Tamaweb/src/Main.js`
- 关键位置：约 96-123 行

行为模式伪代码：

```js
registerServiceWorker()
listenForServiceWorkerLifecycleMessages()
showUpdateOrCacheStatusInUi()
```

代码意图：

- 注册 service worker。
- 用 BroadcastChannel 通知页面缓存安装状态。

可借鉴点：

- PWA 更新和缓存状态要反馈给玩家。
- service worker 逻辑不要和游戏规则耦合。

Tamakey 重写方案：

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Tamakey',
    display: 'standalone',
  },
})
```

## 7. tamagotchi-p1-web：Worker 主循环

来源：

- `tonypan2/tamagotchi-p1-web/src/worker.ts`
- 关键位置：约 30-116 行

行为模式伪代码：

```ts
runGameLoopInsideWorker()
schedulePeriodicRuntimeSave()
handleMessagesFromMainThread()
```

代码意图：

- Worker 拥有游戏运行时。
- 主线程通过消息启动和输入。
- 自动保存与主线程 UI 解耦。

可借鉴点：

- 游戏逻辑可以独立于 React 运行。
- Worker 协议要简单明确。
- UI 不应该直接修改底层游戏状态。

Tamakey 重写方案：

```ts
self.onmessage = (event: MessageEvent<GameWorkerRequest>) => {
  const message = event.data

  if (message.type === 'INIT') init(message.state)
  if (message.type === 'TICK') tick(message.now)
  if (message.type === 'INTERACT') interact(message.interaction, message.now)
}
```

## 8. tamagotchi-p1-web：React 与 Worker 边界

来源：

- `tonypan2/tamagotchi-p1-web/src/App.tsx`
- 关键位置：约 28-49 行

行为模式伪代码：

```tsx
worker = createWorker()
worker.onMessage(updateUiSnapshot)
worker.postMessage(startRuntimeMessage)
```

代码意图：

- React 创建 Worker。
- Worker 发回屏幕数据。
- React 只保存 UI 所需数据。

可借鉴点：

- React 组件只接收 snapshot/view model。
- Worker 生命周期要在 bootstrap 层管理。

Tamakey 重写方案：

```tsx
useEffect(() => {
  const client = createGameWorkerClient()
  const unsubscribe = client.subscribe(handleWorkerMessage)
  client.post({ type: 'INIT', state, now: Date.now() })

  return () => {
    unsubscribe()
    client.dispose()
  }
}, [])
```

## 9. tamagotchi-p1-web：IndexedDB 存档

来源：

- `tonypan2/tamagotchi-p1-web/src/storageUtils.ts`
- 关键位置：约 1-72 行

行为模式伪代码：

```ts
openVersionedDatabase()
ensureStateObjectStore()
writeSerializableRuntimeSnapshot()
```

代码意图：

- 存 WASM CPU 状态。
- 使用 IndexedDB 保存 typed array。

可借鉴点：

- 后续复杂存档可迁移 IndexedDB。
- 存档需要版本和 key。

Tamakey MVP 不采用：

- MVP 只用 localStorage。
- Worker 不能直接访问 localStorage，所以存档由主线程处理。

## 10. jcreighton/tamagotchi：sprite 动画

来源：

- `jcreighton/tamagotchi/Animatable.js`
- 关键位置：约 51-64 行

行为模式伪代码：

```js
requestAnimationFrame(() => {
  drawSpriteSheetFrame(frameRect, targetPosition)
})
```

代码意图：

- 从 sprite sheet 取一帧。
- 用 requestAnimationFrame 绘制。
- generator 组织动画步骤。

可借鉴点：

- 动画要由帧序列驱动。
- 宠物行为动画可以拆成 `idle`、`eat`、`sleep`、`sick`。

Tamakey 重写方案：

```ts
const animationMap: Record<AnimationName, FrameSequence> = {
  baby_idle: { texture: 'baby', frames: [0, 1], fps: 2, loop: true },
  pet_eat: { texture: 'baby', frames: [2, 3, 2], fps: 4, loop: false },
}
```

## 11. jcreighton/tamagotchi：行为动画

来源：

- `jcreighton/tamagotchi/Tamagotchi.js`
- 关键位置：约 31-67 行

行为模式伪代码：

```js
runAnimationSequence([bounce(), moveRight(), moveLeft()])
```

代码意图：

- 行为不是单帧，而是一串小动作。
- 喂食失败会播放 dislike，成功会播放 eat。

可借鉴点：

- 互动反馈应该有短动画链路。
- 规则结果和视觉反馈要分离：规则先成功，渲染再播放动画。

Tamakey 重写方案：

```ts
effectRenderer.playInteraction('feedMeal')
petRenderer.playOnce('pet_eat', () => {
  petRenderer.playLoop(chooseIdleAnimation(viewModel))
})
```

## 12. tamagotchiClone：菜单广度

来源：

- `ChrisChrisLoLo/tamagotchiClone/js/userInterface.js`
- 关键位置：约 152-186 行

行为模式伪代码：

```js
mainMenu = [careAction, cleanAction, playAction, medicineAction, shopAction]
```

代码意图：

- 主界面是菜单入口。
- 玩法通过不同 state 页面承载。

可借鉴点：

- MVP 操作按钮应该覆盖照顾闭环。
- Shop 可以后置，不要一开始做复杂。

Tamakey MVP 操作：

```txt
feedMeal
feedSnack
play
clean
medicine
sleep/wake
```

`status` 是 UI 菜单，`reset` 是系统命令，不进入 `InteractionType`。

## 13. tamagotchiClone：tick 与疾病

来源：

- `ChrisChrisLoLo/tamagotchiClone/js/game.js`
- 关键位置：约 200-256 行

行为模式伪代码：

```js
if (realTimeElapsedPastThreshold) advanceGameTime()
decayNeeds()
increaseHealthRiskWhenRoomIsDirty()
```

代码意图：

- 真实时间每 5 分钟推进一次。
- 饥饿和快乐下降。
- 排泄物提高生病概率。

可借鉴点：

- tick 是虚拟宠物核心。
- 排泄物应该影响健康。

Tamakey 重写方案：

```ts
next = applyNaturalDecay(next, deltaSeconds)
next = applyPoopGeneration(next, deltaSeconds)
next = applyCarePressure(next, deltaSeconds)
next = applySicknessPressure(next, events, now)
```

不要直接用随机概率作为唯一机制。MVP 使用累计压力更可测试。

## 14. tamagotchiClone：localStorage 存档问题

来源：

- `ChrisChrisLoLo/tamagotchiClone/js/save.js`
- 关键位置：约 31-74 行

行为模式伪代码：

```js
writePetSnapshot()
writeGlobalSnapshot()
```

代码意图：

- 保存宠物和全局货币/设置。

问题：

- 没有 schema version。
- JSON parse 失败没有完整错误恢复。
- 背包存档被注释，状态不完整。

Tamakey 重写方案：

```ts
type SaveData = {
  schemaVersion: 1
  savedAt: number
  gameState: GameState
}
```

必须包含：

- `schemaVersion`
- `savedAt`
- 完整 `GameState`
- 坏档备份
- 迁移函数

## 15. 最终采用矩阵

| 能力            | 参考来源                                | Tamakey 实现                           |
| --------------- | --------------------------------------- | -------------------------------------- |
| 离线推进        | Tamaweb                                 | `restoreGame + advanceGameTimeByDelta` |
| 存档边界        | 通用模式，参考 Tamaweb/clone 的能力覆盖 | 单 key `SaveData`，保留 repository     |
| Worker 边界     | p1-web                                  | `GameWorkerRequest/Response`           |
| React 接 Worker | p1-web                                  | `GameBootstrap` 创建和释放 Worker      |
| 像素渲染        | Tamaweb / jcreighton                    | PixiJS + nearest + 160x144             |
| 行为动画        | jcreighton                              | `AnimationController`                  |
| 操作菜单        | 通用照顾闭环，参考 clone 的功能清单     | React `ActionDock`                     |
| 疾病/排泄       | 通用照顾规则，参考 clone 的抽象玩法     | 累计 care pressure，可测试             |
| PWA             | Tamaweb                                 | `vite-plugin-pwa`                      |
