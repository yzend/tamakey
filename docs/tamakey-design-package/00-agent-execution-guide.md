# 00. Agent 执行指南

这份文档是 Claude Code 或其他实现 agent 的第一入口。实现时按本文档顺序执行，不要跳读。

## 1. 阅读顺序

1. `00-agent-execution-guide.md`
2. `01-reference-projects-and-code.md`
3. `02-architecture-solid.md`
4. `03-domain-and-gameplay.md`
5. `04-runtime-worker-zustand.md`
6. `05-rendering-pixijs.md`
7. `06-persistence-pwa-notifications.md`
8. `07-implementation-checklist.md`
9. `08-testing-and-acceptance.md`
10. `09-visual-style-and-assets.md`

## 2. 实现顺序

必须按顺序实现：

```txt
1. Domain 纯规则
2. Worker 协议和运行时
3. Zustand store
4. localStorage 存档和 restore
5. Runtime coordinators 和 GameBootstrap composition root
6. PixiJS rendering 模块
7. React GameScreen、ActionDock、视觉样式和原创 assets
9. PWA 配置
10. Notification 权限和调度
11. 测试和验收
```

禁止先做 PixiJS 或 UI。游戏规则必须先能在不启动 React 的情况下测试。

## 3. 每阶段允许修改的目录

```txt
阶段 1 Domain:
  src/game/domain
  src/game/application
  src/shared

阶段 2 Worker + Zustand:
  src/game/worker
  src/game/store

阶段 3 Persistence:
  src/game/persistence
  src/game/application/restoreGame.ts

阶段 4 Runtime:
  src/game/runtime
  src/app/GameBootstrap.tsx
  src/App.tsx

阶段 5 Rendering:
  src/game/rendering
  public/assets

阶段 6 UI + Visual:
  src/app
  src/App.tsx
  src/styles
  public/assets

阶段 7 PWA + Notification:
  src/game/notifications
  vite.config.ts
  public
```

不要在阶段 1 修改 React UI。不要在 rendering 模块写业务规则。

## 4. 参考代码规则

不要复制参考仓库代码。

允许：

- 借鉴 Worker/UI 分离这个架构模式。
- 借鉴虚拟宠物照顾闭环。
- 借鉴像素动画的抽象组织方式。

禁止：

- 使用 Tamagotchi 名称、ROM、角色、图标、声音、设备外观。
- 复制 Tamaweb 的代码、存档 key、任务表、数值表、素材、声音、字体、UI 表达。
- 复制 Ping Island 的代码、mascot、图标、官网图片、文案、配色数值或 Dynamic Island 具体外观。
- 复制 Pixelium Design 的 Vue 组件源码、主题源码、图标、字体、文档示例或配色数值。
- 复制无 LICENSE 仓库代码或素材。
- 引入 tamagotchi-p1-web 的 ROM、TamaLIB、WASM/HAL、ROM hash、仿真实现。

实现必须按 Tamakey 文档里的接口 clean-room 编写。

## 5. 验证命令

每个 milestone 结束后至少运行：

```bash
pnpm typecheck
pnpm lint
```

最终运行：

```bash
pnpm build
```

如果项目暂未安装测试框架，不要自行引入大型测试栈作为第一步。先实现可手动验证的纯函数，再按 `08-testing-and-acceptance.md` 补测试。

## 6. 完成定义

实现完成必须满足：

- `src/App.tsx` 渲染 `GameBootstrap`。
- 页面显示一个可交互宠物屏幕。
- 六个照顾入口可发 Worker interaction。
- 游戏每 5 秒 tick。
- 刷新后 localStorage 存档恢复。
- 修改 `lastTickAt` 到过去后能看到离线推进。
- PixiJS canvas 不空白，资源失败时显示 fallback。
- 视觉实现符合 `09-visual-style-and-assets.md`，所有宠物、icon、声音和 fallback 都是原创或许可清楚。
- Notification 只在用户授权后工作，并且只承诺 best-effort。
- `pnpm typecheck && pnpm lint && pnpm build` 通过。
