# 05. PixiJS 渲染方案

本文档定义 PixiJS 渲染的技术边界。视觉风格、React UI 样式、原创资产和 PWA icon 规则以 `09-visual-style-and-assets.md` 为准。

## 1. 渲染目标

主画面要像一个低分辨率虚拟宠物屏幕。

推荐：

```txt
逻辑分辨率：160 x 144
CSS 放大：最多 480px 宽
纹理过滤：nearest
抗锯齿：关闭
```

## 2. React 与 PixiJS 分工

React：

- 状态栏。
- 操作按钮。
- 菜单。
- 弹窗。
- 设置。

PixiJS：

- 房间背景。
- 宠物 sprite。
- 排泄物、食物、玩具等对象。
- 心情、睡觉、生病等效果。
- 像素屏 overlay。

硬边界：

- `PixiStage` 只负责 React 生命周期和挂载 canvas。
- `PixiGameRenderer` 只负责创建、组合、更新、销毁各 renderer。
- `PetSpriteRenderer` 只负责宠物 sprite、宠物动画和宠物位置。
- `RoomRenderer` 只负责房间背景和地面。
- `ObjectRenderer` 只负责排泄物、食物、玩具等非宠物对象。
- `EffectRenderer` 只负责一次性事件特效。
- `ScreenOverlayRenderer` 只负责 LCD 网格、屏幕暗角或边框效果。

所有 renderer 只能消费 `PetViewModel` 和 `GameEvent`。任何 renderer 都不能读取完整 `GameState`，不能调用 Worker，不能写 Zustand，不能改 localStorage。

## 3. 层级

```txt
Stage
  RoomLayer
  ObjectLayer
  PetLayer
  EffectLayer
  ScreenOverlayLayer
```

PixiJS 层级：

```ts
roomLayer.zIndex = 0
objectLayer.zIndex = 10
petLayer.zIndex = 20
effectLayer.zIndex = 30
overlayLayer.zIndex = 40
app.stage.sortableChildren = true
```

## 4. Pixi 初始化

```ts
const app = new Application()

await app.init({
  width: 160,
  height: 144,
  background: '#d8e7b5',
  antialias: false,
  resolution: 1,
  autoDensity: false,
})

TextureStyle.defaultOptions.scaleMode = 'nearest'
```

CSS：

```css
.pet-screen canvas {
  width: min(90vw, 480px);
  aspect-ratio: 160 / 144;
  image-rendering: pixelated;
}
```

## 5. ViewModel

Renderer 不接完整 `GameState`。

```ts
export type PetViewModel = {
  stage: PetStage
  mood: PetMood
  sleepState: SleepState
  sickness: SicknessState
  poopCount: number
  roomId: string
}
```

selector：

```ts
export function selectPetViewModel(state: GameState): PetViewModel {
  return {
    stage: state.pet.stage,
    mood: state.pet.mood,
    sleepState: state.pet.sleepState,
    sickness: state.pet.sickness,
    poopCount: state.world.poopCount,
    roomId: state.world.roomId,
  }
}
```

## 6. assetManifest

```ts
export const assetManifest = {
  room: {
    default: '/assets/rooms/default-room.png',
  },
  pet: {
    egg: '/assets/pets/egg.png',
    baby: '/assets/pets/baby.png',
    child: '/assets/pets/child.png',
    adult: '/assets/pets/adult.png',
    dead: '/assets/pets/dead.png',
  },
  effects: {
    heart: '/assets/effects/heart.png',
    sick: '/assets/effects/sick.png',
    sleep: '/assets/effects/sleep.png',
    poop: '/assets/objects/poop.png',
  },
} as const
```

MVP 可以先用纯色方块或临时原创像素图，避免阻塞逻辑实现。

## 7. PixiStage

```tsx
export function PixiStage() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<PixiGameRenderer | null>(null)
  const snapshot = useGameStore((state) => state.snapshot)

  useEffect(() => {
    if (!hostRef.current) return

    let disposed = false
    let app: Application | null = null

    async function start() {
      app = new Application()
      await app.init({
        width: 160,
        height: 144,
        background: '#d8e7b5',
        antialias: false,
        resolution: 1,
      })

      if (disposed || !hostRef.current) {
        app.destroy(true)
        return
      }

      hostRef.current.appendChild(app.canvas)
      rendererRef.current = new PixiGameRenderer(app)
    }

    start()

    return () => {
      disposed = true
      rendererRef.current?.destroy()
      rendererRef.current = null
      app = null
    }
  }, [])

  useEffect(() => {
    if (!snapshot || !rendererRef.current) return
    rendererRef.current.setViewModel(selectPetViewModel(snapshot))
  }, [snapshot])

  return <div className='pet-screen' ref={hostRef} />
}
```

## 8. PixiGameRenderer

`PixiGameRenderer` 是渲染编排器，不写业务判断。它把 `PetViewModel` 分发给具体 renderer，把 `GameEvent` 分发给特效 renderer。

```ts
import { Application, Container, Ticker } from 'pixi.js'

export class PixiGameRenderer {
  private readonly roomLayer = new Container()
  private readonly objectLayer = new Container()
  private readonly petLayer = new Container()
  private readonly effectLayer = new Container()
  private readonly overlayLayer = new Container()

  private readonly roomRenderer = new RoomRenderer()
  private readonly objectRenderer = new ObjectRenderer()
  private readonly petRenderer = new PetSpriteRenderer()
  private readonly effectRenderer = new EffectRenderer()
  private readonly overlayRenderer = new ScreenOverlayRenderer()

  private currentViewModel: PetViewModel | null = null
  private readonly onTick = (ticker: Ticker) => {
    this.update(ticker.deltaMS)
  }

  constructor(private readonly app: Application) {
    this.roomLayer.zIndex = 0
    this.objectLayer.zIndex = 10
    this.petLayer.zIndex = 20
    this.effectLayer.zIndex = 30
    this.overlayLayer.zIndex = 40

    this.roomLayer.addChild(this.roomRenderer.container)
    this.objectLayer.addChild(this.objectRenderer.container)
    this.petLayer.addChild(this.petRenderer.container)
    this.effectLayer.addChild(this.effectRenderer.container)
    this.overlayLayer.addChild(this.overlayRenderer.container)

    this.app.stage.sortableChildren = true
    this.app.stage.addChild(
      this.roomLayer,
      this.objectLayer,
      this.petLayer,
      this.effectLayer,
      this.overlayLayer
    )
    this.app.ticker.add(this.onTick)
  }

  setViewModel(viewModel: PetViewModel) {
    const previous = this.currentViewModel
    this.currentViewModel = viewModel

    this.roomRenderer.setRoom(viewModel.roomId)
    this.objectRenderer.setPoopCount(viewModel.poopCount)
    this.petRenderer.setPetState(viewModel)

    if (previous?.mood !== viewModel.mood) {
      this.effectRenderer.playMoodTransition(viewModel.mood)
    }
  }

  update(deltaMs: number) {
    this.petRenderer.update(deltaMs)
    this.effectRenderer.update(deltaMs)
  }

  handleGameEvent(event: GameEvent) {
    if (event.type === 'interactionApplied') {
      this.effectRenderer.playInteraction(event.interaction)
    }

    if (event.type === 'hatched') {
      this.effectRenderer.playHatch()
    }

    if (event.type === 'evolved') {
      this.effectRenderer.playEvolution()
    }

    if (event.type === 'becameSick') {
      this.effectRenderer.playSick()
    }

    if (event.type === 'died') {
      this.effectRenderer.playDeath()
    }
  }

  destroy() {
    this.app.ticker.remove(this.onTick)
    this.roomRenderer.destroy()
    this.objectRenderer.destroy()
    this.petRenderer.destroy()
    this.effectRenderer.destroy()
    this.overlayRenderer.destroy()
    this.app.stage.removeChild(
      this.roomLayer,
      this.objectLayer,
      this.petLayer,
      this.effectLayer,
      this.overlayLayer
    )
    this.roomLayer.destroy({ children: true })
    this.objectLayer.destroy({ children: true })
    this.petLayer.destroy({ children: true })
    this.effectLayer.destroy({ children: true })
    this.overlayLayer.destroy({ children: true })
  }
}
```

每个子 renderer 必须暴露 `container: Container` 和 `destroy(): void`。`PixiGameRenderer` 拥有 layer、ticker subscription 和子 renderer 生命周期；`PixiStage` 拥有 Pixi `Application` 生命周期。

## 9. 具体 renderer 职责

### PetSpriteRenderer

```ts
export class PetSpriteRenderer {
  readonly container = new Container()

  setPetState(viewModel: PetViewModel) {
    const animation = chooseAnimation(viewModel)
    this.playLoop(animation)
  }

  playOnce(animation: AnimationName, onComplete?: () => void) {
    // 只播放视觉动画，不修改 GameState。
  }

  update(deltaMs: number) {
    // 推进当前动画帧。
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

### RoomRenderer

```ts
export class RoomRenderer {
  readonly container = new Container()

  setRoom(roomId: string) {
    // 切换房间背景。MVP 只有 default。
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

### ObjectRenderer

```ts
export class ObjectRenderer {
  readonly container = new Container()

  setPoopCount(poopCount: number) {
    // 根据 poopCount 显示 0-5 个排泄物对象。
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

### EffectRenderer

```ts
export class EffectRenderer {
  readonly container = new Container()

  playInteraction(interaction: InteractionType) {}
  playHatch() {}
  playEvolution() {}
  playSick() {}
  playDeath() {}
  playMoodTransition(mood: PetMood) {}

  update(deltaMs: number) {}

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

资源加载失败时必须有 fallback，避免 canvas 空白：

```ts
function createFallbackPetGraphic() {
  const graphic = new Graphics()
  graphic.rect(64, 72, 32, 24)
  graphic.fill('#2f3a1f')
  return graphic
}
```

## 10. 动画选择

```ts
type AnimationName =
  | 'egg_idle'
  | 'egg_hatch'
  | 'baby_idle'
  | 'baby_happy'
  | 'baby_sad'
  | 'child_idle'
  | 'child_happy'
  | 'child_sad'
  | 'adult_idle'
  | 'adult_happy'
  | 'adult_sad'
  | 'pet_eat'
  | 'pet_play'
  | 'pet_sleep'
  | 'pet_sick'
  | 'pet_dead'
```

```ts
function chooseAnimation(viewModel: PetViewModel): AnimationName {
  if (viewModel.stage === 'dead') return 'pet_dead'
  if (viewModel.stage === 'egg') return 'egg_idle'
  if (viewModel.sleepState === 'sleeping') return 'pet_sleep'
  if (viewModel.sickness !== 'none') return 'pet_sick'

  if (viewModel.mood === 'happy')
    return resolveStageAnimation(viewModel.stage, 'happy')
  if (viewModel.mood === 'sad')
    return resolveStageAnimation(viewModel.stage, 'sad')
  if (viewModel.mood === 'angry')
    return resolveStageAnimation(viewModel.stage, 'sad')
  if (viewModel.mood === 'sleepy')
    return resolveStageAnimation(viewModel.stage, 'sad')
  if (viewModel.mood === 'sick') return 'pet_sick'
  if (viewModel.mood === 'sleeping') return 'pet_sleep'

  return resolveStageAnimation(viewModel.stage, 'idle')
}

function resolveStageAnimation(
  stage: PetStage,
  suffix: 'idle' | 'happy' | 'sad'
): AnimationName {
  if (stage === 'child' || stage === 'teen')
    return `child_${suffix}` as AnimationName
  if (stage === 'adult' || stage === 'elder')
    return `adult_${suffix}` as AnimationName
  return `baby_${suffix}` as AnimationName
}
```

## 11. 事件动画

状态动画是循环的，互动动画是一次性的。

```txt
state animation:
  idle
  happy
  sad
  sick
  sleep

event animation:
  eat
  play
  clean
  medicine
  evolve
  hatch
```

处理方式：

```ts
renderer.handleGameEvent(event)
```

## 12. 事件消费接入

`PixiStage` 需要同时消费 `snapshot` 和 `events`。消费完事件后按 `queueId` ack，避免同一动画重复播放，也避免清掉刚入队的新事件。

```tsx
export function PixiStage() {
  const snapshot = useGameStore((state) => state.snapshot)
  const events = useGameStore((state) => state.events)
  const ackEvents = useGameStore((state) => state.ackEvents)

  useEffect(() => {
    if (!snapshot || !rendererRef.current) return
    rendererRef.current.setViewModel(selectPetViewModel(snapshot))
  }, [snapshot])

  useEffect(() => {
    if (!rendererRef.current || events.length === 0) return

    for (const event of events) {
      rendererRef.current.handleGameEvent(event)
    }

    const lastProcessedId = Math.max(...events.map((event) => event.queueId))
    ackEvents(lastProcessedId)
  }, [events, ackEvents])
}
```

## 13. 渲染验收

必须满足：

- canvas 挂载成功。
- 抗锯齿关闭。
- 宠物居中。
- 移动端不变形。
- mood 改变会切动画。
- poopCount 改变会显示/隐藏排泄物。
- 组件卸载会销毁 Pixi app。
- 事件队列被消费后只 ack 已处理事件。
- 资源加载失败时有 fallback 图形。
- 宠物、房间、对象和 fallback 图形符合 `09-visual-style-and-assets.md`。
- 不使用 Tamagotchi、Tamaweb、Ping Island 或无 LICENSE 素材。
