# 07. Agent 实施任务书

本文档是执行清单。Agent 必须按任务顺序实现，每个任务完成后执行对应检查。

## 1. 最小可运行文件

这些文件是 MVP 必需文件，不能省略：

```txt
src/game/domain/gameTypes.ts
src/game/domain/constants.ts
src/game/domain/rules.ts
src/game/application/createInitialGame.ts
src/game/application/advanceGameTime.ts
src/game/application/applyInteraction.ts
src/game/application/restoreGame.ts
src/game/application/createReminderPlan.ts
src/game/application/summarizeOfflineProgress.ts
src/game/worker/protocol.ts
src/game/worker/game.worker.ts
src/game/worker/workerClient.ts
src/game/store/useGameStore.ts
src/game/store/useRuntimeStore.ts
src/game/store/selectors.ts
src/game/runtime/SaveCoordinator.ts
src/game/runtime/NotificationCoordinator.ts
src/game/persistence/SaveRepository.ts
src/game/persistence/LocalStorageSaveRepository.ts
src/game/persistence/saveSchema.ts
src/game/persistence/migrations.ts
src/game/persistence/saveKeys.ts
src/game/rendering/PixiStage.tsx
src/game/rendering/PixiGameRenderer.ts
src/game/rendering/PetSpriteRenderer.ts
src/game/rendering/RoomRenderer.ts
src/game/rendering/ObjectRenderer.ts
src/game/rendering/EffectRenderer.ts
src/game/rendering/ScreenOverlayRenderer.ts
src/game/rendering/AnimationController.ts
src/game/rendering/viewModels.ts
src/game/rendering/assetManifest.ts
src/game/notifications/NotificationService.ts
src/app/GameBootstrap.tsx
src/app/GameScreen.tsx
src/app/components/ActionDock.tsx
src/app/components/StatusIsland.tsx
src/app/components/StatMeter.tsx
src/app/components/NotificationControl.tsx
src/app/components/ResetControl.tsx
src/App.tsx
src/styles/tokens.css
src/styles/app.css
```

完整架构扩展文件可以后置：

```txt
src/game/domain/evolution.ts
src/game/domain/interactions.ts
src/game/domain/stats.ts
src/game/notifications/reminderRules.ts
src/game/notifications/notificationCopy.ts
src/shared/Clock.ts
src/shared/BrowserClock.ts
src/shared/Result.ts
```

## 2. 任务 1：安装依赖

目标：

- 安装 MVP 运行依赖。

修改范围：

- `package.json`
- lockfile

执行：

```bash
pnpm add zustand pixi.js vite-plugin-pwa
```

验收：

- `package.json` 包含 `zustand`、`pixi.js`、`vite-plugin-pwa`。

检查：

```bash
pnpm typecheck
```

失败处理：

- 如果 typecheck 因尚未实现模块失败，记录为预期；依赖安装失败必须先修复。

## 3. 任务 2：Domain 纯规则

目标：

- 在不启动 React 的情况下实现完整游戏规则。

修改范围：

- `src/game/domain`
- `src/game/application`
- `src/shared/clamp.ts`

必须实现：

- `GameState`
- `PetState`
- `GameEvent`
- `AdvanceResult`
- `RestoreResult`
- `InteractionType`
- `InteractionHandler`
- `InteractionRegistry`
- `createInitialGame`
- `advanceGameTime`
- `advanceGameTimeByDelta`
- `applyInteraction`

验收：

- `advanceGameTime` 一小时后增加 hunger。
- sleeping 时 energy 增加。
- awake 时 energy 下降。
- clean 清空 `poopCount` 和 `dirtySeconds`。
- medicine 能治疗 mild/severe。
- health <= 0 后进入 dead。
- dead 后 tick 只更新 `lastTickAt`，不继续衰减。

检查：

```bash
pnpm typecheck
pnpm lint
```

失败处理：

- 如果规则与文档冲突，以 `03-domain-and-gameplay.md` 为准。

## 4. 任务 3：Worker + Zustand

目标：

- Worker 成为游戏规则唯一运行时。
- Zustand 保存主线程 snapshot 和 events。

修改范围：

- `src/game/worker`
- `src/game/store`

必须实现：

- `GameWorkerRequest`
- `GameWorkerResponse`
- `game.worker.ts`
- `workerClient.ts`
- `useGameStore`
- `useRuntimeStore`
- `selectors`

验收：

- `INIT` 返回 `READY`。
- `TICK` 返回 `SYNC`。
- `INTERACT` 内先执行 `advanceGameTime(currentState, now)`，再执行 `applyInteraction`。
- `INTERACT feedMeal` 返回 `interactionApplied`。
- `SET_NOTIFICATIONS_ENABLED` 能更新 `settings.notificationsEnabled`。
- 未 INIT 时 `TICK` 返回 recoverable `ERROR`。
- Worker 不访问 localStorage、DOM、PixiJS、React。

检查：

```bash
pnpm typecheck
pnpm lint
```

失败处理：

- 如果 Worker import 路径失败，优先修 `new Worker(new URL(..., import.meta.url))`。

## 5. 任务 4：Persistence + Restore

目标：

- localStorage 单存档。
- 离线推进恢复。
- 坏档不白屏。

修改范围：

- `src/game/persistence`
- `src/game/application/restoreGame.ts`

必须实现：

- `SAVE_KEY`
- `SAVE_BACKUP_KEY`
- `SaveData`
- `RestoreResult`
- `SaveRepository`
- `LocalStorageSaveRepository`
- `validateSaveData`
- `migrateSave`
- `restoreGame`
- `summarizeOfflineProgress`

验收：

- 无存档创建新游戏。
- 合法存档恢复。
- JSON 坏档备份到 `SAVE_BACKUP_KEY` 并创建新游戏。
- `LoadSaveResult.status` 能区分 `empty`、`ok` 和 `corrupt`。
- schema 不支持或迁移失败也创建新游戏。
- `lastTickAt` 在过去时会离线推进。

检查：

```bash
pnpm typecheck
pnpm lint
```

失败处理：

- 如果存档解析失败，不允许 throw 到 React；必须返回 `RestoreResult`。

## 6. 任务 5：GameBootstrap composition root

目标：

- `GameBootstrap` 成为唯一 runtime composition root。
- `SaveCoordinator` 和 `NotificationCoordinator` 独立在 `src/game/runtime`，不内联到 React 组件。

修改范围：

- `src/game/runtime/SaveCoordinator.ts`
- `src/game/runtime/NotificationCoordinator.ts`
- `src/app/GameBootstrap.tsx`
- `src/app/GameScreen.tsx`
- `src/App.tsx`

必须初始化：

- `LocalStorageSaveRepository`
- `SaveCoordinator`
- `NotificationService`
- `NotificationCoordinator`
- `GameWorkerClient`
- Zustand subscriptions
- tick interval
- visibility/beforeunload listeners

验收：

- `src/App.tsx` 只渲染 `<GameBootstrap />`。
- 每 5 秒发送一次 `TICK`。
- interaction 成功后立即保存。
- 普通 tick 节流保存。
- cleanup 顺序符合 `04-runtime-worker-zustand.md`。

检查：

```bash
pnpm typecheck
pnpm lint
```

失败处理：

- 如果 React 严格模式导致重复初始化，必须确保 cleanup 完整，不能创建多个常驻 Worker。

## 7. 任务 6：PixiJS rendering

目标：

- 宠物主画面完全独立在 `src/game/rendering`。

修改范围：

- `src/game/rendering`
- `public/assets`

必须实现：

- `PixiStage`
- `PixiGameRenderer`
- `PetSpriteRenderer`
- `RoomRenderer`
- `ObjectRenderer`
- `EffectRenderer`
- `ScreenOverlayRenderer`
- `AnimationController`
- fallback 图形
- `PixelScreen` 容器样式

验收：

- canvas 挂载成功且不空白。
- renderer 只消费 `PetViewModel` 和 `GameEvent`。
- mood/stage 改变切动画。
- `poopCount` 改变更新对象层。
- events 被消费后调用 `ackEvents(upToId)`。
- 资源加载失败显示 fallback。
- 宠物、房间、对象和特效遵守 `09-visual-style-and-assets.md`。
- `ObjectRenderer` 在 MVP 只渲染 `poopCount`，除非 ViewModel 已明确提供 food/toy 状态。

检查：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

失败处理：

- 如果素材缺失，用原创 fallback 图形，不阻塞 MVP。
- 不允许临时使用 Tamagotchi、Tamaweb、Ping Island、Pixelium Design 或无 LICENSE 素材。

## 8. 任务 7：React UI

目标：

- 提供可操作的 MVP 页面。
- 落地 `09-visual-style-and-assets.md` 的紧凑暗色控制面。

修改范围：

- `src/app/GameScreen.tsx`
- `src/app` 相关 UI
- `src/styles`

必须实现：

- 状态栏。
- Pixi 屏幕容器。
- 六个照顾入口：feedMeal、feedSnack、play、clean、medicine、sleep/wake。
- reset 系统按钮，发送 Worker `RESET`，不走 `InteractionType`。
- notification permission 入口，授权后发送 Worker `SET_NOTIFICATIONS_ENABLED`。
- `src/styles/tokens.css`
- `StatusIsland`
- `ActionDock`
- `StatMeter`

验收：

- 所有按钮不直接改 `GameState`。
- 所有照顾按钮通过 Worker `INTERACT`。
- reset 通过 Worker `RESET`。
- 第一屏是可玩的宠物界面，不是 landing page。
- UI 符合 `09-visual-style-and-assets.md`，不复制 Ping Island 或 Pixelium Design 的具体外观。
- 按钮和状态文案在移动端不溢出、不重叠。

检查：

```bash
pnpm typecheck
pnpm lint
```

失败处理：

- 如果 UI 需要临时文案，保持简短，不写营销落地页。
- 如果视觉资产缺失，使用原创 CSS/Pixi fallback，不阻塞 MVP。

## 9. 任务 8：PWA + Notification

目标：

- 支持 PWA 安装。
- 支持 best-effort 通知。

修改范围：

- `vite.config.ts`
- `public`
- `src/game/notifications`
- `src/app` notification UI

必须实现：

- `VitePWA` 配置。
- PWA icon 占位资源。
- `NotificationService`
- `createReminderPlan`
- 用户手势触发的权限请求。

验收：

- `pnpm build` 成功。
- `pnpm preview` 下 DevTools 能看到 manifest 和 service worker。
- 用户授权后可收到前台通知。
- 文案不承诺关闭浏览器后准时提醒。
- PWA icon、favicon 和可选声音符合 `09-visual-style-and-assets.md`，不能来自参考项目。

检查：

```bash
pnpm build
```

失败处理：

- 如果通知权限被拒绝，UI 不报错，保持游戏可玩。

## 10. 任务 9：最终质量门禁

必须运行：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

手动验收：

- 打开页面能看到宠物屏幕。
- 点击 feedMeal 后 hunger 下降。
- 点击 clean 后 poopCount 清零。
- 刷新页面后状态保留。
- 修改 localStorage 的 `lastTickAt` 到过去后刷新，状态发生离线变化。
- Pixi canvas 不空白。
- Notification 授权后能收到测试通知。
- 页面整体符合 `09-visual-style-and-assets.md`。
- 代码、样式类名、资源名和 UI 文案中没有参考品牌复制痕迹。

版权和资产检查：

```bash
rg -n "Tamagotchi|Tamaweb|Ping Island|Pixelium|Vibe Island|ROM|TamaLIB|WASM|notch|Dynamic Island" src public
```

该命令在实现代码和资源路径中应无命中。文档目录可以出现参考项目名。
