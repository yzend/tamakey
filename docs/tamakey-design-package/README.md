# Tamakey Design Package

这是 Tamakey Web 虚拟宠物项目的分拆版技术文档包。

原始总方案见：

- [../tamakey-technical-design.md](../tamakey-technical-design.md)

实现时以本目录文档为准。若本目录与原始总方案冲突，以 `00-agent-execution-guide.md`、`07-implementation-checklist.md` 和 `09-visual-style-and-assets.md` 为准。

本目录把方案拆成更适合实现和评审的多份文档：

0. [00-agent-execution-guide.md](00-agent-execution-guide.md)  
   Claude Code 或其他实现 agent 的执行入口、阅读顺序和验证命令。

1. [01-reference-projects-and-code.md](01-reference-projects-and-code.md)  
   参考开源项目调研、模式分析、可借鉴点和不可复用风险。

2. [02-architecture-solid.md](02-architecture-solid.md)  
   React + Vite + TypeScript + Zustand + PixiJS + Worker 的 SOLID 架构设计。

3. [03-domain-and-gameplay.md](03-domain-and-gameplay.md)  
   游戏玩法、核心状态、tick 规则、互动规则、成长和死亡规则。

4. [04-runtime-worker-zustand.md](04-runtime-worker-zustand.md)  
   Worker 协议、Zustand store、主线程与游戏逻辑的同步方式。

5. [05-rendering-pixijs.md](05-rendering-pixijs.md)  
   PixiJS 渲染、像素屏、层级、动画状态机和 React 挂载方式。

6. [06-persistence-pwa-notifications.md](06-persistence-pwa-notifications.md)  
   localStorage 存档、离线推进恢复、PWA、Notification API。

7. [07-implementation-checklist.md](07-implementation-checklist.md)  
   最小可运行实现清单、文件顺序、里程碑和验收标准。

8. [08-testing-and-acceptance.md](08-testing-and-acceptance.md)  
   单元测试、Worker 测试、存档测试、渲染 smoke test 和 E2E 验收。

9. [09-visual-style-and-assets.md](09-visual-style-and-assets.md)  
   原创视觉方向、React UI 样式、PixiJS 像素资产、PWA icon 和版权边界。

## 核心技术决策

```txt
React/Vite 负责应用壳和 UI
Zustand 负责主线程状态快照
Web Worker 负责游戏 tick 和互动计算
domain/application 负责纯游戏规则
PixiJS 负责宠物主画面渲染
localStorage 负责 MVP 单机存档
PWA + Notification API 负责安装和提醒
09-visual-style-and-assets.md 负责视觉样式和资产规则
```

## 版权与参考原则

参考项目只用于理解模式，不作为代码来源。

不能直接复用：

- Tamagotchi 名称、ROM、角色、设备外观、图标和声音。
- Tamaweb 的代码、素材、存档 key、字段名、配置、数值表、资源定义、声音、字体和 UI 表达。
- Ping Island 的代码、mascot、图标、官网图片、文案或配色数值。
- Pixelium Design 的 Vue 组件源码、主题源码、图标、字体、文档示例或配色数值。
- 无 LICENSE 仓库的代码和素材。

可以参考：

- 玩法模块划分。
- Worker 与 UI 的边界。
- 像素动画组织方式。
- 存档能力边界和离线恢复需求。
- Ping Island 的紧凑状态面、注意力优先和角色身份系统这些抽象设计原则。
- Pixelium Design 的硬边像素 UI、复古调色、主题 token 和响应式组件这些抽象设计原则。

## 当前仓库启动命令

```bash
pnpm install
pnpm add zustand pixi.js vite-plugin-pwa
pnpm dev
```

质量检查：

```bash
pnpm typecheck
pnpm lint
pnpm build
```
