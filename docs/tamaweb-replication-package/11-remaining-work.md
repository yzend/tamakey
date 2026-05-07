# 11-remaining-work.md

## 当前结论

S0-S9 的本地可验收版本已经完成并通过 `pnpm verify`。以下内容不是当前本地 mock 版本的阻塞项，而是后续若要升级到生产在线版、复杂玩法版或更高工程质量版时仍需要继续做的工作。

## 未完成或刻意不实现

| 项目                    | 当前状态           | 未完成内容                                                       | 原因/备注                                              | 优先级 |
| ----------------------- | ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| 真实 Hubchi/online 后端 | 本地 mock          | 真实账号、鉴权、远程宠物列表、互动同步、错误重试、限流           | 当前计划明确只做 local mock，不复用外部 endpoint       | P3     |
| 真实 social 后端        | 本地 mock          | 内容发布、好友关系云同步、举报/审核、隐私设置、跨设备同步        | 需要后端、审核和合规策略                               | P3     |
| 生产级 mods 平台        | 本地 JSON sandbox  | mod 市场、签名、权限模型、资源包加载、版本兼容、审核             | 当前只允许安全 JSON schema，不执行脚本、不加载外部资源 | P3     |
| 复杂 minigame           | 可运行 adapter     | 独立 arcade 玩法、计分、失败状态、排行榜、输入细节               | 当前只实现活动式奖励闭环                               | P2     |
| 深度 garden 系统        | 可运行机制         | 更复杂天气、动物 AI、buff 叠加、虫害、长期枯萎策略               | 当前满足本地可验收，不是模拟经营深玩法                 | P2     |
| 深度 evolution chart    | 原创规则           | 更丰富分支、隐藏条件、图鉴页面、回溯说明                         | 不能复制原数值表，需要继续原创 balance                 | P2     |
| 生产 PWA 更新验收       | 手动 prompt 已实现 | 模拟版本升级的自动化 E2E、跨浏览器安装测试、iOS/Android 行为矩阵 | 当前覆盖 manifest、SW blocked fallback 和基础可用性    | P2     |
| Pixi 代码拆包           | 未做               | Pixi/Geometry 相关 chunk splitting，降低主包体积                 | 当前 build 只有 chunk size warning，不阻断验收         | P2     |
| Accessibility 深测      | 基础可用           | 键盘完整路径、焦点顺序、screen reader 文案、对比度矩阵           | 当前 UI 可操作，但未做完整 a11y 专项审计               | P2     |
| 多设备/多存档           | 单本地存档         | 多 slot、云同步冲突解决、跨设备恢复                              | 当前 schema 支持演进，但运行时只用一个本地存档         | P3     |
| 音效/动画 polish        | 设置入口存在       | 实际音效资源、音量控制、更多 reduced-motion 分支                 | 当前不引入外部素材，视觉以 procedural pixel 为主       | P3     |
| 生产观测                | 未做               | error reporting、性能指标、save corruption telemetry             | 本地离线游戏不接外部服务                               | P3     |

## 已完成但可继续加深

| 模块        | 已完成                                                                           | 可继续加深                                                                        |
| ----------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Domain 架构 | `rules.ts` 兼容导出，核心拆为 lifecycle/interactions/focused modules             | 进一步把 interaction handlers 拆成 care/inventory/social/activity registry 子模块 |
| UI 架构     | `MenuPanel` 独立，Settings/phone/shop/school/garden/social/online 可用           | 每个菜单继续拆成独立 panel component，减少单个组件长度                            |
| Persistence | v1/v2 -> v3 migration、IndexedDB + localStorage fallback、导入校验               | 多存档 slot、导入 diff preview、手动备份管理                                      |
| Testing     | `verify` 覆盖 format/typecheck/lint/unit/build/e2e，E2E 含 canvas pixel sampling | 增加更多 dead/revive/move-out/craft equipment 专项 E2E                            |
| Rendering   | egg/baby/sleep/activity/garden/furniture/accessory/social 状态可见               | 更多 pet stage 变体、更细 procedural sprite 组合                                  |

## 不应回头补的内容

以下内容不建议在当前 clean-room 项目中实现：

- 不导入 Tamaweb 源码、素材、文案、品牌名、图标、endpoint 或精确数值表。
- 不接受 Tamaweb 原始存档格式，只接受目标项目 schema。
- 不接未经设计的真实外部 API。
- 不执行 mod 中的 JavaScript 或远程资源 URL。

## 下一步建议

如果继续投入，建议按这个顺序：

1. 把 `rules/interactions.ts` 再拆为 care、inventory、activity、garden、social、settings registries。
2. 把 `MenuPanel.tsx` 再拆为 `menus/FeedingPanel.tsx`、`menus/GardenPanel.tsx`、`menus/SettingsPanel.tsx` 等。
3. 增加 dead/revive/move-out/craft/equipment 的 E2E 覆盖。
4. 对 Pixi 相关依赖做动态拆包，解决 build chunk warning。
5. 若产品确认要在线版，再设计后端 API、账号、审核和数据合规方案。
