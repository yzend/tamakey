# 08. 测试与验收

## 1. 测试目标

优先保证规则正确、存档可靠、离线推进一致、渲染不空白。

不要只测 React 组件。虚拟宠物的核心风险在 domain、时间推进和存档。

测试优先级：

```txt
P0 Domain 纯规则
P0 Persistence/restore
P1 Worker 协议
P1 Store subscriptions
P1 Rendering smoke
P1 Visual style and assets
P2 E2E
```

如果项目没有安装测试框架，先不要为了 E2E 引入 Playwright。优先补可用现有工具执行的 domain 测试或手动验证脚本。

## 2. Milestone 测试映射

| Milestone          | 必测内容                                        | 验收方式                              |
| ------------------ | ----------------------------------------------- | ------------------------------------- |
| Domain             | 状态推进、互动、成长、死亡                      | 单元测试优先                          |
| Worker + Zustand   | INIT/TICK/INTERACT/RESET/settings、store events | 单元测试或手动 worker smoke           |
| Persistence        | load/save/坏档/迁移/离线推进                    | 单元测试优先                          |
| GameBootstrap      | 初始化、订阅、cleanup、tick interval            | 组件 smoke 或手动验证                 |
| Rendering          | canvas、view model、events、fallback            | smoke test 或浏览器手动验证           |
| Visual style       | tokens、首屏、移动端、原创资产                  | 浏览器手动验证 + 资源扫描             |
| PWA + Notification | manifest、service worker、权限请求              | `pnpm build && pnpm preview` 手动验证 |

## 3. Domain 单元测试

必须覆盖：

```txt
createInitialGame 返回完整初始状态
advanceGameTime 会增加 hunger
sleeping 时 energy 恢复
awake 时 energy 下降
cleanliness 下降会累计 dirtySeconds
dirtySeconds 超阈值会生病
clean 清空 poopCount 和 dirtySeconds
medicine 治疗 mild/severe
health <= 0 后 stage = dead
dead 后 tick 不再改变核心状态
ageSeconds 到阈值会成长
```

示例：

```ts
it('increases hunger after one hour', () => {
  const state = createInitialGame(0)
  const oneHourLater = state.lastTickAt + 60 * 60 * 1000
  const result = advanceGameTime(state, oneHourLater)
  expect(result.state.pet.hunger).toBeGreaterThan(state.pet.hunger)
})
```

## 4. 离线推进测试

在线 8 小时和离线 8 小时结果应该一致或在允许误差内一致。

```ts
it('uses the same rules for offline progression', () => {
  const initial = createInitialGame(0)

  const online = advanceGameTimeByDelta(initial, 8 * 3600, 8 * 3600 * 1000)

  const restored = restoreGame(
    {
      status: 'ok',
      data: {
        schemaVersion: 1,
        savedAt: 0,
        gameState: initial,
      },
    },
    8 * 3600 * 1000
  )

  expect(restored.state.pet.hunger).toEqual(online.state.pet.hunger)
})
```

## 5. Worker 测试

覆盖：

```txt
INIT -> READY
TICK -> SYNC
INTERACT feedMeal -> SYNC + interactionApplied
INTERACT 会先推进时间再应用互动
RESET -> SYNC
SET_NOTIFICATIONS_ENABLED -> SYNC
未 INIT 时 TICK -> ERROR
```

## 6. Store 测试

覆盖：

```txt
setSnapshot 会替换 snapshot
enqueueEvents 会追加事件
ackEvents(upToId) 只清空已处理事件
subscribeWithSelector 能监听 snapshot
```

## 7. 存档测试

覆盖：

```txt
无存档时返回 LoadSaveResult status=empty
合法存档可读取
坏 JSON 会进入 backupCorruptSave 且 status=corrupt
save 会写 SAVE_KEY
clear 会删除 SAVE_KEY
schemaVersion 不支持时恢复失败但不白屏
```

## 8. PixiJS smoke test

覆盖：

```txt
PixiStage 挂载 canvas
setViewModel 会调用 renderer
mood 变化会选择新 animation
poopCount 变化会更新 ObjectLayer
unmount 会 destroy Pixi application
事件队列消费后 ackEvents(upToId) 被调用
资源加载失败时显示 fallback 图形
```

## 9. E2E 验收

Playwright 是建议项，不是 MVP 强制依赖。如果项目尚未安装 Playwright，先用手动验收覆盖这组路径。

路径：

```txt
打开首页
看到设备和宠物屏幕
点击喂食
hunger 降低
点击清洁
poopCount 归零
刷新页面
状态保留
篡改 lastTickAt 到过去
刷新后出现离线摘要
开启通知
收到测试通知
```

## 10. 视觉和资产验收

必须符合 `09-visual-style-and-assets.md`。

视觉：

```txt
第一屏是可玩的宠物界面
页面不是 landing page
整体是紧凑暗色控制面
像素屏是视觉主角
StatusIsland 不复制 Ping Island notch 外观
控件是原创硬边像素风格，不复制 Pixelium Design 组件外观
ActionDock 移动端不溢出
状态颜色区分 hunger/happy/clean/sick/sleep
```

资产：

```txt
宠物 sprite 原创或 fallback 生成
PWA icon 原创或 fallback 生成
不使用 Tamagotchi/Tamaweb/Ping Island/Pixelium Design 素材
不使用无 LICENSE 像素包、字体或声音
```

检查：

```bash
rg -n "Tamagotchi|Tamaweb|Ping Island|Pixelium|Vibe Island|ROM|TamaLIB|WASM|notch|Dynamic Island" src public
```

该命令在实现代码、样式类名、资源名和 UI 文案中应无命中。

## 11. 手动验收清单

视觉：

- 移动端屏幕不变形。
- 按钮不溢出。
- canvas 不空白。
- 像素边缘清晰。
- 页面符合 `09-visual-style-and-assets.md`。

玩法：

- 蛋能孵化。
- 宠物会饿。
- 宠物会脏。
- 不清洁会生病。
- 治疗有效。
- 睡眠恢复精力。
- 长期忽视会死亡。

存档：

- 刷新不丢状态。
- 关闭再打开有离线变化。
- 坏档不白屏。

PWA：

- 可以安装。
- 离线打开能看到应用壳。
- 更新后能自动刷新缓存。

通知：

- 不自动弹权限。
- 用户点击后才请求权限。
- 授权后能收到提醒。

## 12. 发布前质量门禁

```bash
pnpm typecheck
pnpm lint
pnpm build
```

浏览器检查：

```txt
Chrome desktop
Safari desktop
iOS Safari
Android Chrome
```

DevTools：

```txt
Application -> Manifest 存在
Application -> Service Worker 激活
Application -> Local Storage 存档存在
Lighthouse PWA 基础项通过
```
