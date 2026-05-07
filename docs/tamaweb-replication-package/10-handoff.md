# 10-handoff.md

## 1. 给实现 AI / 工程师的交接说明

你要实现的是一个 clean-room 虚拟宠物 Web/PWA 游戏。Tamaweb 只作为行为规格参考，不允许复制它的源码、素材、品牌、文案、数值表、存档格式或 endpoint。

优先阅读顺序：

1. `01-repo-overview.md`
2. `02-feature-map.md`
3. `05-target-architecture.md`
4. `03-feature-specs.md`
5. `06-implementation-plan.md`
6. `07-test-plan.md`
7. `08-validation-checklist.md`
8. `09-difference-report.md`
9. `04-pseudocode-transfer.md`

## 2. 推荐执行顺序

1. 搭 Vite React TypeScript 项目。
2. 建立 domain/state/rendering/persistence/ui 目录。
3. 实现 `GameState`、command、reducer、selector。
4. 实现 Pixi canvas 和 render model。
5. 实现 egg lifecycle。
6. 实现 save/load。
7. 实现 main menu。
8. 实现 feed/sleep/bath/toilet。
9. 实现 needs/offline。
10. 实现 growth/death/new egg。
11. 实现 missions/settings/stats。
12. 扩展 activity/shop/garden/school。

## 3. 必须遵守的边界

- 不粘贴 Tamaweb 代码。
- 不使用 Tamaweb 图片、声音、字体、logo。
- 不使用 Tamaweb endpoint。
- 不复制 growth/food/task/item 数值表。
- 不保留 Tamaweb 存档 key 或 save code 格式。
- 不使用原项目专有文案。
- 所有目标资产必须自制或明确授权。

## 4. 最小可运行闭环

最小可运行版本必须满足：

```text
open app
-> loading
-> no save
-> create egg
-> render egg
-> lock controls
-> hatch
-> render baby
-> open main menu
-> feed/sleep/bath/toilet
-> auto save
-> reload restore
```

如果这个闭环没完成，不要开始 Hubchi、mod、社交媒体或复杂小游戏。

## 5. 实现提示

### 5.1 Egg

Egg 是 P0 最高风险点。不要把 baby sprite 当 egg。实现时至少有：

- `pet.stage === 'egg'`
- `renderHints.eggVisible === true`
- `renderHints.activePetVisible === false`
- hatch 后反转

### 5.2 Store

所有 UI 操作发 command：

```ts
dispatch({ type: 'pet.feed', itemId })
dispatch({ type: 'pet.sleep.request' })
dispatch({ type: 'activity.start', activityId })
```

不要在 React component 里直接改 pet。

### 5.3 Renderer

Renderer 每帧读取 selector 输出：

```ts
const model = selectRenderModel(gameState)
renderSystem.apply(model)
```

Pixi pointer event 只能 dispatch command。

### 5.4 Persistence

保存层只知道 save schema，不知道业务规则。迁移函数必须纯函数和可测试。

## 6. 后续扩展建议

| 扩展       | 前置                        |
| ---------- | --------------------------- |
| School     | skills + activity lock      |
| Garden     | plant lifecycle + inventory |
| Animals    | garden + buffs              |
| Furniture  | render model + room state   |
| Minigames  | activity framework          |
| Online Hub | profile + moderation + API  |
| Social     | friends + content safety    |
| Mods       | sandbox + asset validation  |

## 7. 开工前检查

- 已阅读合规边界。
- 已确认目标项目名称和资产库。
- 已确认首发范围：P0/P1。
- 已确认 hatch 时间和测试 fast mode。
- 已确认是否启用 PWA。
- 已确认是否启用在线功能。

## 8. 完成定义

一个阶段完成必须同时满足：

- 功能可操作。
- 状态可保存和恢复。
- 单元测试通过。
- 关键 E2E 通过。
- 没有合规禁用内容。
- 文档差异已更新。
