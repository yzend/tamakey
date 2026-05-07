# 06-implementation-plan.md

## 1. 实施原则

- 先做 P0 最小可运行闭环，再扩展 P1/P2/P3。
- 每阶段必须有可运行版本和测试。
- 不引入 Tamaweb 源码或素材。
- 所有配置和数值由目标项目原创。

## 2. 阶段拆解

| 阶段 | 目标                        | 涉及文件                        | 依赖               | 验证方式              | 风险                |
| ---- | --------------------------- | ------------------------------- | ------------------ | --------------------- | ------------------- |
| S0   | 项目脚手架                  | `app`, `state`, `rendering`     | Vite/React/Pixi    | dev server、空 canvas | React/Pixi 生命周期 |
| S1   | Domain 基础模型             | `domain/pet`, `domain/world`    | TypeScript         | 单元测试              | 状态边界不清        |
| S2   | Egg 最小闭环                | `eggLifecycle`, `GameCanvas`    | assets placeholder | E2E 截图 egg          | reset 后误显示 baby |
| S3   | 存档和离线推进              | `persistence`, `time`           | IndexedDB          | save/load roundtrip   | schema 迁移         |
| S4   | 主菜单和基础照料            | `ui/menus`, `needs`, `commands` | S1-S3              | 喂食/睡觉/洗澡测试    | UI 与状态耦合       |
| S5   | 成长、死亡、新 egg          | `growth`, `death`               | S4                 | birthday/death tests  | 重复事件            |
| S6   | Missions/Stats/Settings     | `missions`, `settings`          | S4                 | 任务领取、设置保存    | 任务枚举膨胀        |
| S7   | Activity/Shop/School/Garden | `activities`, `garden`          | S5                 | 集成测试              | 活动锁控制          |
| S8   | PWA/导入导出/回归           | `services/pwa`, `importExport`  | S1-S7              | Lighthouse/E2E        | 缓存旧版本          |
| S9   | P2/P3 扩展                  | online/social/mod               | S8                 | mock API tests        | 隐私和审核          |

## 3. 最小可运行闭环

MVP 必须包含：

1. 打开应用进入 loading。
2. 无存档创建 egg。
3. canvas 显示 egg，不显示 baby。
4. egg 阶段 controls 锁定。
5. hatch 后显示 baby。
6. 主菜单打开。
7. feed/sleep/bath/toilet 基础交互。
8. stats tick。
9. 自动保存。
10. 刷新后恢复。

## 4. 文件级任务

### S0 脚手架

- 创建 Vite React TS。
- 安装 PixiJS、测试工具、IndexedDB helper。
- 建立 `src/domain`, `src/state`, `src/rendering`, `src/ui`, `src/persistence`。

### S1 Domain

- 定义 `GameState`, `PetState`, `WorldState`, `SaveDataV1`。
- 实现 reducer 和 command 类型。
- 实现 selector：`selectRenderModel`, `selectMenuAvailability`, `selectNeeds`.

### S2 Egg

- 实现 `createNewEggPet`.
- 实现 `advanceEggLifecycle`.
- 实现 Pixi egg render entity。
- 增加 fallback egg asset。
- E2E 验证 reset 后 egg 可见。

### S3 Persistence

- 实现 `saveRepository`.
- 实现 `migrations`.
- 实现 auto save scheduler。
- 实现 import/export JSON code，格式原创。

### S4 Care

- 实现 needs tick。
- 实现 feed/sleep/bath/toilet commands。
- 实现 main menu 和 display stack。
- 实现 activity lock。

### S5 Growth/Death

- 实现 growth rule engine。
- 实现 birthday command/activity placeholder。
- 实现 deathSafety 和 dead state。
- 实现 revive/new egg。

### S6 Meta Systems

- 实现 missions。
- 实现 stats/profile/achievements shell。
- 实现 settings save。
- 实现 error boundary/global error UI。

### S7 Content

- 实现 activity selector。
- 实现 shop/garden/school。
- 实现 basic minigame adapter。
- 实现 furniture/accessory/craft。

### S8 PWA

- 配置 manifest。
- 配置 service worker。
- 测试 offline reload。
- 增加版本提示。

### S9 Optional

- Online Hub mock。
- Social mock。
- Mod import sandbox。

## 5. 依赖关系

```text
S0 -> S1 -> S2 -> S3 -> S4 -> S5 -> S6 -> S7 -> S8 -> S9
```

不要在 S2 前做商店、任务或社交。Egg/render/save 是所有后续功能的基础。

## 6. 风险点

| 风险                   | 缓解                                  |
| ---------------------- | ------------------------------------- |
| 直接复用 Tamaweb 表达  | 所有代码由本文档重新实现，禁止粘贴    |
| Pixi 与 React 状态冲突 | 单向 command/store/render model       |
| 离线推进不可测试       | clock/random 注入                     |
| 存档迁移失败           | schemaVersion + migration tests       |
| 活动锁死               | activity finally 必须 unlock controls |
| 资源版权               | 使用目标自制或明确授权资源            |

## 7. 阶段验收

每阶段完成必须满足：

- 类型检查通过。
- 单元测试通过。
- 关键 E2E 通过。
- 没有 Tamaweb 资源/路径/endpoint。
- 更新 `09-difference-report.md` 中对应差异。
