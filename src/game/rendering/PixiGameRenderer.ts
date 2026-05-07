// 渲染模块：协调房间、对象、宠物、特效和遮罩等 Pixi 图层。
import { Container, type Application, type Ticker } from 'pixi.js'

import { EffectRenderer } from './EffectRenderer'
import { ObjectRenderer } from './ObjectRenderer'
import { PetSpriteRenderer } from './PetSpriteRenderer'
import { RoomRenderer } from './RoomRenderer'
import { ScreenOverlayRenderer } from './ScreenOverlayRenderer'
import type { GameEvent, PetViewModel } from './viewModels'

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

    this.roomRenderer.setRoom(viewModel)
    this.objectRenderer.setObjects(viewModel)
    this.petRenderer.setPetState(viewModel)

    if (previous && previous.mood !== viewModel.mood) {
      this.effectRenderer.playMoodTransition(viewModel.mood)
    }
  }

  update(deltaMs: number) {
    this.petRenderer.update(deltaMs)
    this.effectRenderer.update(deltaMs)
  }

  handleGameEvent(event: GameEvent) {
    if (event.type === 'invalidInteraction') {
      this.effectRenderer.playInvalidInteraction()
    }

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
