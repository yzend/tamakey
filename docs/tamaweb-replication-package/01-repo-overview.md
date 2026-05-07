# 01-repo-overview.md

## 1. 仓库基本信息

| 项目         | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| 仓库         | `autosam/Tamaweb`                                                          |
| URL          | https://github.com/autosam/Tamaweb                                         |
| 分析版本     | `3ff3b8d841fe3cf29fb2af6ed028c79bc0f34975`                                 |
| 提交时间     | 2026-04-26                                                                 |
| 仓库用途     | 虚拟宠物养成 Web/PWA 游戏                                                  |
| 原项目平台   | Browser、Windows、Android、PWA                                             |
| 目标复刻方式 | clean-room 功能复刻，不复制源码、素材、文案、数值表、endpoint              |
| 目标技术栈   | 推断：React + TypeScript + PixiJS + Vite + Zustand-style state + IndexedDB |
| 目标项目类型 | Web/PWA 虚拟宠物养成游戏                                                   |

## 2. 技术栈

原仓库是传统静态 Web 应用，没有 `package.json`，也没有现代 bundler 配置。运行时通过 `index.html` 顺序加载脚本。

| 层       | 原仓库技术                                     | 源文件                                                |
| -------- | ---------------------------------------------- | ----------------------------------------------------- |
| 页面入口 | HTML + CSS + 原生 JS                           | `index.html`, `styles.css`, `themes.css`              |
| 渲染     | HTML Canvas 2D，自研 `Drawer` / `Object2d`     | `src/Drawer.js`, `src/Object2d.js`                    |
| 业务入口 | 全局 `App` 对象                                | `src/App.js`                                          |
| 宠物模型 | `PetDefinition` + `Pet`                        | `src/PetDefinition.js`, `src/Pet.js`                  |
| 活动脚本 | 静态 `Activities` 类                           | `src/Activities.js`                                   |
| 配置表   | 全局 definitions 和资源定义                    | `src/Definitions.js`, `resources/data/*.js`           |
| 存档     | IndexedDB `idb-keyval` + localStorage fallback | `src/App.js`, `src/libs/idb-keyval.js`                |
| 时间     | `moment.js`                                    | `src/libs/moment.js`                                  |
| 文本安全 | `sanitize` + profanity cleaner                 | `src/Utils.js`, `src/libs/profanity-cleaner-0.0.3.js` |
| PWA      | Web Manifest + Service Worker                  | `manifest.webmanifest`, `service-worker.js`           |
| 部署     | GitHub Actions minify 后推分支                 | `.github/workflows/*.yml`                             |

## 3. 目录结构

```text
Tamaweb/
  index.html
  styles.css
  themes.css
  manifest.webmanifest
  service-worker.js
  README.md
  LICENSE
  TERMS_OF_USE.md
  src/
    Main.js
    App.js
    Pet.js
    PetDefinition.js
    Activities.js
    Definitions.js
    Missions.js
    Animal.js
    Plant.js
    Drawer.js
    Object2d.js
    Scene.js
    UiHelper.js
    Utils.js
    Version.js
    libs/
      idb-keyval.js
      moment.js
      jquery-3.7.1.min.js
      localforage.min.js
      profanity-cleaner-0.0.3.js
  resources/
    data/
      CharacterDefinitions.js
      GrowthChart.js
      SoundDefinitions.js
      SpriteDefinitions.js
    img/
    sounds/
    font/
  growth-chart/
  blog/
  creator/
  scripts/
  .github/workflows/
```

## 4. 入口文件

| 入口                   | 作用                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `index.html`           | DOM shell、canvas、loading/error UI、模板、脚本顺序、canvas click 入口    |
| `src/Main.js`          | 自定义 `<c-sprite>`、全局错误处理、service worker 注册、调用 `App.init()` |
| `src/App.js`           | 初始化、存档、场景、主菜单、设置、任务、随机事件、API service             |
| `src/Pet.js`           | 宠物实体、egg/dead/normal 行为、stats 推进、喂食、睡眠、纪律              |
| `src/PetDefinition.js` | 宠物定义、成长、life stage、want、traits、family/friends                  |
| `src/Activities.js`    | 外出、小游戏、洗澡、厕所、生日、revive、school、garden 等活动             |

## 5. 运行方式

原仓库没有安装依赖步骤。可通过任意静态服务器运行：

```bash
cd Tamaweb
python3 -m http.server 8080
```

然后打开 `http://localhost:8080/index.html`。

直接用 `file://` 可能因 service worker、fetch/cache 或浏览器安全策略出现差异，建议用 HTTP 静态服务。

## 6. 构建方式

原仓库没有常规 build 命令。GitHub Actions 在推送时安装全局 CLI：

- `terser`
- `csso-cli`
- `html-minifier`

然后直接压缩 `src/*.js`、`styles.css`、`index.html`，并强推到 `gh-pages` 或 `minified-develop`。

目标复刻项目建议不要沿用这种方式，应使用 Vite 构建。完整架构方案见 `05-target-architecture.md`，核心原则是 React 只负责 UI shell 和菜单，PixiJS 只负责游戏画布，领域状态通过 store/reducer 驱动两者。

```bash
npm run dev
npm run build
npm run preview
```

## 7. 测试方式

原仓库没有发现自动化测试目录或测试脚本。测试方式推断为人工浏览器测试。

目标复刻项目必须补齐：

- 单元测试：状态 reducer、成长、需求消耗、存档迁移、任务完成。
- 集成测试：初始化、离线推进、菜单行为、活动结束回 Home。
- E2E：首次进入 egg、孵化、喂食、睡眠、生日、存档恢复。
- 视觉/渲染测试：egg/baby/dead 等关键 sprite 是否可见。

详细测试矩阵见 `07-test-plan.md`。

## 8. 部署方式

原仓库部署方式：

- `main` push 后 GitHub Actions minify 并推 `gh-pages`。
- PWA 静态资源由 `service-worker.js` 缓存。
- `manifest.webmanifest` 提供安装配置。

目标复刻部署建议：

- 静态站点部署到 GitHub Pages、Cloudflare Pages、Vercel 或 Netlify。
- Service Worker 由 Vite PWA 插件或自研 Workbox 配置生成。
- 禁止使用原仓库 manifest 中的名称、图标、logo、品牌资产。

目标部署、PWA 和缓存策略见 `05-target-architecture.md` 与 `06-implementation-plan.md`。

## 9. 外部依赖

| 依赖                        | 用途                           | 原仓库位置                            | 目标建议                              |
| --------------------------- | ------------------------------ | ------------------------------------- | ------------------------------------- |
| `idb-keyval`                | IndexedDB 存档                 | `src/libs/idb-keyval.js`              | 可换成 `idb` 或自研 repository        |
| `moment.js`                 | 时间、人类可读时间、生日和刷新 | `src/libs/moment.js`                  | 建议换 `date-fns` 或原生 Date wrapper |
| profanity cleaner           | 在线用户/宠物名过滤            | `src/libs/profanity-cleaner-0.0.3.js` | 可换维护良好的过滤库                  |
| Font Awesome                | UI 图标                        | `index.html`/CSS 类                   | 目标用 lucide 或自有图标              |
| Google Apps Script endpoint | Hubchi 在线数据                | `src/App.js`                          | 不复用；目标重新设计 API              |
| Service Worker Cache API    | PWA 缓存                       | `service-worker.js`                   | 可用 Workbox 或 Vite PWA              |

## 10. 许可证和合规判断

原仓库声明 CC BY-NC-SA 4.0。`TERMS_OF_USE.md` 进一步声明：

- 代码和游戏内容按 CC BY-NC-SA 4.0。
- 名称、logo、品牌资产不在 CC 授权范围内。
- 视觉资产、图标、声音、logo 等未经授权不可用。
- 商业使用受限。

因此目标项目默认采用 clean-room：

- 可以分析行为、状态、输入输出、功能规格。
- 不复制源码表达。
- 不复制资源、图标、声音、字体、文案、名称、logo。
- 不复制存档 key、任务枚举、成长表、数值表。
- 不复用 Google Apps Script endpoint。

伪代码搬运记录见 `04-pseudocode-transfer.md`。本轮用户没有指定可搬取位置，因此默认不搬运任何原仓库伪代码，只输出行为规格和目标侧重新设计。

## 11. 高风险区域

| 区域                             | 风险                         | 处理方式                           |
| -------------------------------- | ---------------------------- | ---------------------------------- |
| 角色 sprite、背景、声音、字体    | 明确版权/品牌风险            | 全部重制                           |
| Tamaweb 名称、logo、官方链接     | 商标/品牌风险                | 不使用                             |
| Growth chart、食物/任务/物品定义 | 数值和表达可能构成可保护内容 | 仅抽象机制，重新设计表             |
| Google Apps Script endpoint      | 第三方服务和隐私风险         | 不调用，不记录 endpoint 到目标配置 |
| 大段源码算法                     | 版权表达风险                 | 只写行为规格和重写伪代码           |
| 存档 key 和 save code 格式       | 兼容性/表达风险              | 目标另设 schema                    |
| 社交/在线内容                    | 隐私、滥用、审核风险         | 目标需权限、审核和错误策略         |
