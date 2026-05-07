# 09. 视觉样式与资产规范

本文档定义 Tamakey 的原创视觉方向、React UI 样式、PixiJS 像素画面、资产边界和验收标准。

实现时必须把本文档当作样式 source of truth。若本文档与参考项目截图、README 或旧总方案冲突，以本文档为准。

## 1. 参考边界

可参考 [Ping Island](https://github.com/erha19/ping-island)、[Ping Island 官网](https://erha19.github.io/ping-island/) 和 [Pixelium Design](https://github.com/shika-works/pixelium-design) 的设计方向。

Ping Island 可参考：

- 紧凑优先：平时保持安静，状态变化时再突出提示。
- 胶囊式信息面：核心状态集中在顶部或主画面附近，而不是铺满营销式卡片。
- 深色极简底色：让主画面和状态信号更聚焦。
- 角色身份系统：用原创宠物和状态动画承载情绪，而不是大段说明文案。
- 小型状态信号：用颜色点、短标签、轻量动效表达 hunger、mood、sleep、sickness。

Pixelium Design 可参考：

- 硬边像素 UI：边框、按钮、meter 和图标保持清晰像素边缘。
- 复古调色：用有限色板和明确状态色，而不是柔和模糊渐变。
- 可定制像素尺寸：用 token 控制像素屏、边框、间距和按钮尺寸。
- 暗/亮主题能力：MVP 默认暗色，但 token 命名要能扩展亮色主题。
- OKlab 思路：如需渐变，只用于小面积状态过渡，并保持亮度对比一致。
- 响应式组件：用 grid/flex 和断点适配，不依赖 viewport 字号缩放。

禁止：

- 复制 Ping Island 的代码、布局源码、图标、mascot、官网图片、文案或配色数值。
- 复制 Pixelium Design 的 Vue 组件源码、主题源码、文档示例、图标、字体或配色数值。
- 复制 Tamagotchi、Tamaweb、tamagotchi-p1-web、ROM、设备外观、角色、图标、声音、字体或 UI 表达。
- 使用无 LICENSE 或版权不清的像素宠物素材、PWA icon、声音、字体。

Tamakey 的设计必须是原创的 web 虚拟宠物界面。参考项目只提供抽象设计原则，不提供可复用资产。

## 2. 视觉定位

Tamakey 的 MVP 视觉定位：

```txt
原创像素宠物 + 暗色桌面控制面 + 小型发光宠物屏幕
```

关键词：

- compact
- pixel
- cozy
- status-first
- low-noise
- hard-edge
- playful but controlled

不要做：

- 营销落地页首屏。
- 大面积渐变 hero。
- 拟真 Tamagotchi 设备外壳。
- 过度卡片化 dashboard。
- 复制掌机按钮、蛋形设备、原版 LCD 角色轮廓。
- 直接套用 Pixelium 的组件外观或 CSS 类名。

## 3. 页面结构

第一屏就是可玩的游戏，不做 landing page。

```txt
AppShell
  StatusIsland
  GameViewport
    PixelScreen
  ActionDock
  SecondaryPanel
```

桌面布局：

```txt
max-width: 760px
top: StatusIsland
center: PixelScreen
bottom: ActionDock
right/below: SecondaryPanel
```

移动布局：

```txt
width: 100%
top: StatusIsland
center: PixelScreen, width <= 92vw
bottom: ActionDock, two rows if needed
secondary controls collapse below
```

硬规则：

- `PixelScreen` 是视觉主角。
- `ActionDock` 永远在首屏可见。
- 状态数值可以压缩显示，但不能藏到二级页面。
- 页面文案只服务当前操作，不解释功能卖点。
- 不允许嵌套卡片。需要分组时使用 unframed section 或轻量分隔线。

## 4. 设计 Tokens

实现文件：

```txt
src/styles/tokens.css
src/styles/app.css
```

CSS variables：

```css
:root {
  color-scheme: dark;

  --color-bg: #0e1117;
  --color-surface: #171b22;
  --color-surface-raised: #202630;
  --color-screen: #d8e7b5;
  --color-screen-dark: #8fa36f;
  --color-text: #f4f7f2;
  --color-text-muted: #a8b0a8;
  --color-border: #323a45;

  --color-hunger: #f2b84b;
  --color-happy: #8bdc7d;
  --color-clean: #7ec8d8;
  --color-sick: #ef6f6c;
  --color-sleep: #a58cff;
  --color-dead: #7d8490;

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-pill: 999px;

  --pixel-border: 2px;
  --pixel-unit: 4px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  --font-ui:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
  --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  --shadow-panel: 0 18px 60px rgb(0 0 0 / 32%);
  --shadow-screen:
    0 0 0 1px rgb(255 255 255 / 8%), 0 24px 80px rgb(216 231 181 / 12%);
}
```

说明：

- 主 UI 是暗色，但不能只用深蓝/灰蓝。必须使用 screen green、amber、mint、cyan、coral、violet 形成状态区分。
- `--color-screen` 只用于 Pixi 屏幕和屏幕相关元素，不铺满整个页面。
- 字体使用系统字体，MVP 不引入外部字体文件。
- 字号不要用 `vw` 缩放。
- letter-spacing 保持 `0`。
- UI 边框、分隔线、meter 轨道和 icon 容器应优先使用硬边像素风格，避免 blur、glassmorphism 和大面积半透明磨砂。
- MVP 只实现暗色主题；token 命名必须支持后续新增亮色主题，不把颜色硬编码到组件内。

## 5. Pixel UI 细节

React 控件采用“现代布局 + 像素边缘”的混合风格：

```txt
layout: modern responsive grid/flex
edges: hard pixel borders
motion: short and restrained
surface: dark compact panels
screen: retro pixel LCD
```

边框：

```css
.pixel-edge {
  border: var(--pixel-border) solid var(--color-border);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 6%),
    0 2px 0 rgb(0 0 0 / 45%);
}
```

按钮：

```css
.action-button {
  min-block-size: 48px;
  border-radius: var(--radius-xs);
  border: var(--pixel-border) solid var(--color-border);
  background: var(--color-surface-raised);
}

.action-button:active {
  transform: translateY(1px);
  box-shadow: none;
}
```

硬规则：

- 控件可以有 4px 或 8px 圆角，但主要轮廓必须清晰。
- 不使用模糊发光作为主要边界。
- 状态色不只靠颜色表达，meter 还要有 label 和 `aria-label`。
- icon 可以先用 lucide 图标或文字 fallback；最终像素 icon 必须原创或许可清楚。

## 6. React UI 组件规范

建议文件：

```txt
src/app/components/StatusIsland.tsx
src/app/components/ActionDock.tsx
src/app/components/StatMeter.tsx
src/app/components/NotificationControl.tsx
src/app/components/ResetControl.tsx
```

### StatusIsland

目标：

- 参考 Dynamic Island 的“紧凑状态面”原则。
- 展示宠物当前最重要状态。
- 不做 Ping Island 的 notch 复制品。

内容：

```txt
left: pet stage + mood
center: current status label
right: age / alive time / sleep marker
```

样式：

```css
.status-island {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: var(--radius-pill);
  background: rgb(23 27 34 / 86%);
  box-shadow: var(--shadow-panel);
}
```

验收：

- 最长 stage/mood 文案不能撑破。
- 宠物死亡时状态面变为 muted，不闪烁。
- 离线恢复事件可以短暂显示一次，不常驻。

### StatMeter

每个核心状态用短 label + meter：

```txt
Hunger
Happy
Clean
Energy
Health
```

实现规则：

- 使用原生 `meter` 或自定义 div 都可以。
- 颜色来自 token，不按单一 hue 生成。
- 数值 0 到 100 clamp。
- `aria-label` 必须包含状态名和当前值。

伪代码：

```tsx
type StatMeterProps = {
  label: string
  value: number
  tone: 'hunger' | 'happy' | 'clean' | 'sleep' | 'sick'
}

export function StatMeter({ label, value, tone }: StatMeterProps) {
  const safeValue = clampInteger(value, 0, 100)

  return (
    <div className={`stat-meter stat-meter--${tone}`}>
      <span>{label}</span>
      <div
        role='meter'
        aria-label={`${label} ${safeValue}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <span style={{ inlineSize: `${safeValue}%` }} />
      </div>
    </div>
  )
}
```

### ActionDock

操作入口固定为六个照顾 action 加 reset/settings 辅助入口：

```txt
feedMeal
feedSnack
play
clean
medicine
sleep/wake
```

样式原则：

- 使用 icon + 短 label。
- 每个按钮固定尺寸，hover/focus 不改变布局。
- disabled 状态保留位置。
- `sleep/wake` 共用一个槽位，按 `sleepState` 切换文案。

验收：

- 移动端两行内显示完整。
- 每个按钮都通过 Worker `INTERACT` 或 `RESET`。
- React UI 不直接写 `GameState`。

## 7. PixelScreen 视觉规范

PixiJS 主画面是一个原创像素屏，不是 Tamagotchi 设备复刻。

逻辑分辨率：

```txt
160 x 144
```

CSS：

```css
.pixel-screen {
  inline-size: min(92vw, 480px);
  aspect-ratio: 160 / 144;
  padding: 10px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, #202630, #12161c);
  box-shadow: var(--shadow-screen);
}

.pixel-screen canvas {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  image-rendering: pixelated;
}
```

屏幕内部颜色：

```txt
background: #d8e7b5
foreground dark pixel: #24311f
mid pixel: #5e7047
highlight pixel: #f4ffd5
```

PixiJS 设置：

```ts
await app.init({
  width: 160,
  height: 144,
  background: '#d8e7b5',
  antialias: false,
  resolution: 1,
  autoDensity: false,
})
```

## 8. 宠物像素资产规范

MVP 阶段：

```txt
stage: egg, baby, child, adult, dead
frame size: 24 x 24 or 32 x 32
animation: idle 2 frames, happy 2 frames, sleep 2 frames, sick 2 frames
outline: 1px or 2px dark pixel
palette per pet: 4 to 7 colors
```

禁止：

- 临摹 Tamagotchi 原角色。
- 使用蛋形掌机外观作为宠物屏幕主视觉。
- 使用 Ping Island mascots 或其动物身份。
- 使用下载来的版权不清像素包。

推荐原创方向：

- `egg`：小型发光种子或钥匙蛋，不做 Tamagotchi 蛋复刻。
- `baby`：圆润小点状生物，轮廓简单。
- `child`：带耳朵或小角的抽象宠物。
- `adult`：更明确的 Tamakey 原创形态，可以有钥匙、星点、叶片等品牌元素。
- `dead`：灰化睡眠/离线形态，不使用墓碑或原版死亡符号。

文件：

```txt
public/assets/pets/egg.png
public/assets/pets/baby.png
public/assets/pets/child.png
public/assets/pets/adult.png
public/assets/pets/dead.png
```

如果没有最终素材，必须用 PixiJS `Graphics` 生成 fallback：

```ts
export function createFallbackPet(stage: PetStage): Container {
  const container = new Container()
  const body = new Graphics()

  body.rect(0, 0, 24, 24)
  body.fill(getFallbackPetColor(stage))

  const eye = new Graphics()
  eye.rect(7, 8, 3, 3)
  eye.rect(15, 8, 3, 3)
  eye.fill('#24311f')

  container.addChild(body, eye)
  return container
}
```

## 9. 房间和对象资产规范

MVP 房间只做一个 `default-room`。

房间画面：

- 地面线不超过 2px。
- 背景保留足够留白，让宠物可读。
- 不做复杂室内装饰。
- 可用原创几何小窗、植物、像素地毯，但不能像 Tamagotchi 原设备屏幕。

对象：

```txt
poop: 8 x 8 or 12 x 12
food/toy: MVP 不常驻显示；只作为 event effect 出现
```

如果 `PetViewModel` 没有 food/toy 状态，`ObjectRenderer` 在 MVP 只渲染 `poopCount`。

## 10. 动效规范

React UI：

- hover/focus transition <= 120ms。
- 弹出提示 <= 180ms。
- 不做大面积背景动画。

PixiJS：

```txt
idle: 700-900ms loop
happy: 160-240ms bounce, max 2 loops
eat: 500-700ms one-shot
clean: 400-600ms sparkle one-shot
medicine: 500-700ms one-shot
sleep: 900-1200ms breathing loop
sick: 700-900ms weak shake loop
death: no bounce, muted still frame
```

优先级：

```txt
dead > sleeping > sick > event animation > mood animation > idle
```

实现时 `chooseAnimation` 必须覆盖：

```txt
idle, happy, sad, angry, sleepy, sick, sleeping
```

`sick` 和 `sleeping` 既可能来自 mood，也可能来自独立状态字段。独立状态字段优先。

## 11. PWA Icon 和声音规范

PWA icon：

```txt
public/pwa-192.png
public/pwa-512.png
public/favicon.svg
```

规则：

- 必须原创。
- 不使用 Tamagotchi、Ping Island、Pixelium Design、AI assistant、GitHub、Apple 或系统图标。
- MVP 可以使用简单 Tamakey 字母标识或原创钥匙种子图形。
- icon 必须在 192、512 尺寸下可读。

声音：

- MVP 默认不需要声音素材。
- 如果实现声音，只允许原创、项目内生成或有明确许可证的短音效。
- 不使用 Tamagotchi、Tamaweb、Ping Island、Pixelium Design 或系统受限声音。

## 12. 实施顺序

视觉相关任务插入到实现流程：

```txt
1. 先实现 domain/worker/store/persistence。
2. 实现 rendering fallback，保证无素材也不空白。
3. 实现 React UI tokens 和组件。
4. 接入最终原创 assets。
5. 最后做 PWA icon 和可选声音。
```

不要因为等待最终美术素材阻塞 MVP。无素材时使用原创 fallback 图形。

## 13. 验收标准

视觉验收：

- 第一屏是可玩的宠物界面，不是 landing page。
- 页面整体是暗色紧凑控制面，主视觉集中在像素屏。
- `PixelScreen` 在桌面和移动端比例稳定，不挤压、不拉伸。
- canvas 非空，资源失败时显示 fallback。
- UI 控件不重叠，最长按钮文案不溢出。
- 状态颜色能区分 hunger、happy、clean、sick、sleep。
- React 控件有硬边像素风格，但布局仍然响应式、清晰、可访问。
- 宠物和 PWA icon 为原创或 fallback 生成，不来自参考项目。
- 没有 Tamagotchi/Tamaweb/Ping Island/Pixelium Design 的图标、角色、mascot、声音、设备外观或文案复制。

实现检查：

```bash
rg -n "Tamagotchi|Tamaweb|Ping Island|Pixelium|Vibe Island|ROM|TamaLIB|WASM|notch|Dynamic Island" src public
pnpm typecheck
pnpm lint
pnpm build
```

允许在文档中出现参考项目名；实现代码、样式类名、资源名和 UI 文案中不要出现这些参考品牌。
