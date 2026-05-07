# 09-difference-report.md

## 1. 差异原则

目标项目复刻行为规格，不复刻表达。任何差异分三类：

- 必须差异：合规要求导致不能相同。
- 可接受差异：目标架构或阶段计划导致。
- 待确认差异：产品需要决定。

## 2. 差异表

| 原仓库行为                  | 目标复刻行为                                                                          | 差异点                                  | 差异原因         | 是否可接受 | 后续处理                         |
| --------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- | ---------------- | ---------- | -------------------------------- |
| 使用 Tamaweb 名称/图标/素材 | 使用目标项目自有品牌和资产                                                            | 视觉和品牌完全不同                      | 合规             | 必须       | 设计新资产                       |
| 原生 JS 全局 App            | React + TS + domain/store/Pixi                                                        | 架构不同                                | 可维护性         | 可接受     | 按 05 实现                       |
| Canvas 2D 自研 Drawer       | PixiJS 渲染                                                                           | 渲染引擎不同                            | 目标技术栈       | 可接受     | 保证像素风和可见性               |
| 原 growth chart             | 目标原创成长规则                                                                      | 成长结果不同                            | 禁止复制数值表   | 必须       | 设计目标 balance                 |
| 原 food/item/task 表        | 目标原创内容表                                                                        | 具体内容不同                            | 合规             | 必须       | 仅保留类别机制                   |
| 原 save key/code            | 目标 versioned save schema                                                            | 不兼容原存档                            | 合规/工程        | 可接受     | 提供导入目标格式                 |
| Google Apps Script Hubchi   | 目标 mock 或自建 API                                                                  | endpoint 不同                           | 隐私/合规        | 必须       | P3 决策                          |
| 原 service worker 手写缓存  | Vite PWA/Workbox                                                                      | 实现不同                                | 工程标准化       | 可接受     | PWA 测试                         |
| 原 UI 文案                  | 目标原创文案                                                                          | 文案不同                                | 合规             | 必须       | 产品写新文案                     |
| 原 exact hatch duration     | 目标可配置 hatch duration                                                             | 数值不同                                | 不复制数值       | 可接受     | 保持“短等待后孵化”体验           |
| Hubchi/social               | 本地 mock adapter，默认 feature flag 关闭                                             | 不接真实后端                            | 合规/隐私        | 可接受     | 后续可替换真实 API               |
| Mods                        | 本地 JSON mod sandbox，默认 feature flag 关闭                                         | 只接受安全的目标 schema，不执行脚本     | 安全             | 可接受     | 后续扩展审核/资源策略            |
| S0-S8 clean-room execution  | 现有 React/TS/Pixi 架构内补齐 v3 状态、菜单、活动、任务、花园、导入导出、PWA 回归入口 | 目录没有大规模迁移到文档示例树          | 降低既有项目风险 | 可接受     | 继续在现有 `src/game` 边界内扩展 |
| IndexedDB save              | IndexedDB 主存档 + localStorage fallback                                              | 旧 localStorage v1/v2 自动迁移为目标 v3 | 工程升级         | 可接受     | 非法导入拒绝并保留当前状态       |

## 3. 完整规格但延后实现

| 功能                           | 原仓库                      | 目标状态           | 原因                          |
| ------------------------------ | --------------------------- | ------------------ | ----------------------------- |
| Hubchi 在线                    | Google Apps Script 在线宠物 | 本地 mock，可替换  | endpoint 不复用，需后端和审核 |
| Social media                   | 本地/朋友互动式社交         | 本地 mock          | 产品风险和内容审核            |
| Mods                           | JSON mod 导入               | 本地 sandbox       | 禁止脚本、URL、外部资源       |
| 运营提示                       | rating/Discord/update       | P3 或不复刻        | 原品牌链接不可用              |
| Blog/creator/growth-chart 页面 | 附属页面                    | 默认不进入游戏 MVP | 非核心闭环                    |

## 4. 必须保持一致的行为

| 行为             | 验收                           |
| ---------------- | ------------------------------ |
| 首次无存档先 egg | 不能直接进入 baby              |
| Egg 独立渲染     | egg stage 显示 egg object      |
| Hatch 后才 baby  | 过渡幂等                       |
| Activity lock    | 活动中不被主菜单打断           |
| 离线推进         | 回访后 needs 有合理变化        |
| 存档恢复         | 刷新后 pet/world/settings 保持 |
| New egg          | death/move out 后回到 egg      |

## 6. S0-S8 执行记录

| 阶段  | 状态   | 说明                                                                                                                                                                     |
| ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S0-S2 | 已实现 | Vite/React/Pixi 基线保留；首次进入 egg；hatch 幂等；egg 阶段锁 controls                                                                                                  |
| S3    | 已实现 | `schemaVersion: 3`、v1/v2 migration、IndexedDB repository、localStorage fallback、JSON import/export；Vitest 覆盖 v3 round-trip、v2 defaults、v1 migration、非法导入拒绝 |
| S4    | 已实现 | 主菜单/子菜单、feed/sleep/bath/toilet/clean/medicine/play command                                                                                                        |
| S5    | 已实现 | 自动成长、手动 birthday、deathSafety、revive once、new egg                                                                                                               |
| S6    | 已实现 | missions、stats/settings 面板、任务领取、设置内导入导出                                                                                                                  |
| S7    | 已实现 | activity lock、shop seed purchase、school reward、garden plant/water/harvest、基础 stuff 使用                                                                            |
| S8    | 已实现 | Vite PWA 使用手动更新提示入口；Playwright 覆盖 manifest/icons、service worker blocked fallback、egg locked、legacy localStorage restore、canvas pixel sampling           |
| S9    | 已实现 | social/online/Hub 使用本地 mock；mods 使用本地 JSON sandbox；Settings 可切换 mock flags 和主题；不接真实后端                                                             |

## 7. 当前 evidence

| 项目               | 状态     | 证据                                                                                                                       |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Domain 模块化      | verified | `src/game/domain/rules.ts` 为兼容导出；实现拆到 `rules/lifecycle.ts`、`rules/interactions.ts` 和 focused re-export modules |
| UI 菜单组件        | verified | `src/app/components/MenuPanel.tsx` 承载主菜单/子菜单，`GameScreen.tsx` 保留状态装配                                        |
| 本地 mod sandbox   | verified | `src/game/domain/mods/modSandbox.ts` 校验 schema、id、label、数量，拒绝 URL/script，Vitest 覆盖导入/拒绝                   |
| PWA 手动更新入口   | verified | `GameBootstrap` 监听 waiting service worker，Settings/MenuPanel 显示 `Update Now`                                          |
| 主题/外壳切换      | verified | Settings 写入 `settings.theme`，`app-shell--classic/mint/contrast` 应用 CSS token                                          |
| Canvas 视觉抽样    | verified | Playwright 对 WebGL canvas 执行 `readPixels` 非空检查                                                                      |
| E2E 核心路径       | verified | 6 个 Playwright 测试覆盖 egg、hatch、care loop、shop/school/garden、mod、social/online、legacy restore                     |
| format 纳入 verify | verified | `pnpm verify` 现在先执行 `pnpm format:check`                                                                               |

## 5. 待确认产品差异

| 问题             | 默认建议                                                |
| ---------------- | ------------------------------------------------------- |
| 是否需要在线 Hub | 首发不做，保留接口                                      |
| 是否需要 mod     | 首发不做                                                |
| 是否需要社交媒体 | 首发不做或纯本地 mock                                   |
| Hatch 等待多久   | 测试环境快速，正式使用由产品确认的短等待窗口            |
| 是否商业发布     | 若商业发布，必须确认 CC BY-NC-SA 风险和 clean-room 记录 |
