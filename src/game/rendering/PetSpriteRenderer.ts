// 渲染模块：绘制备用宠物精灵、配饰和待机动作。
import { Container, Graphics } from 'pixi.js'

import { chooseAnimation, type AnimationName } from './AnimationController'
import type { PetStage, PetViewModel } from './viewModels'

export class PetSpriteRenderer {
  readonly container = new Container()
  private readonly petContainer = new Container()
  private currentAnimation: AnimationName | null = null
  private elapsedMs = 0
  private currentStage: PetStage | null = null
  private currentAccessoryKey = ''
  private isOneShot = false

  constructor() {
    this.container.addChild(this.petContainer)
    this.petContainer.x = 68
    this.petContainer.y = 76
  }

  setPetState(viewModel: PetViewModel) {
    const animation = chooseAnimation(viewModel)
    const accessoryKey = viewModel.accessories?.join(',') ?? ''
    if (
      animation === this.currentAnimation &&
      viewModel.stage === this.currentStage &&
      accessoryKey === this.currentAccessoryKey
    ) {
      return
    }

    this.currentAnimation = animation
    this.currentStage = viewModel.stage
    this.currentAccessoryKey = accessoryKey
    this.elapsedMs = 0
    this.isOneShot = false
    this.drawPet(viewModel)
  }

  playOnce(animation: AnimationName) {
    this.currentAnimation = animation
    this.elapsedMs = 0
    this.isOneShot = true
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs

    const wave = Math.sin(this.elapsedMs / 150)
    const isSleeping = this.currentAnimation === 'pet_sleep'
    const isSick = this.currentAnimation === 'pet_sick'
    const isDead = this.currentAnimation === 'pet_dead'

    if (isDead) {
      this.petContainer.y = 84
      this.petContainer.x = 68
      return
    }

    if (isSick) {
      this.petContainer.x = this.getBaseX() + (wave > 0 ? 1 : -1)
      this.petContainer.y = 77
      return
    }

    if (isSleeping) {
      this.petContainer.x = this.getBaseX()
      this.petContainer.y = 78 + (wave > 0 ? 1 : 0)
      return
    }

    this.petContainer.x = this.getBaseX()
    this.petContainer.y = this.getBaseY() + (wave > 0.65 ? -2 : 0)

    if (this.isOneShot && this.elapsedMs > 680) {
      this.isOneShot = false
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }

  private drawPet(viewModel: PetViewModel) {
    this.petContainer.removeChildren()
    this.petContainer.addChild(
      createFallbackPet(viewModel.stage, this.currentAnimation ?? 'baby_idle')
    )

    const accessory = createAccessoryOverlay(viewModel.accessories ?? [])
    if (accessory) this.petContainer.addChild(accessory)
  }

  private getBaseX() {
    return this.currentStage === 'egg' ? 62 : 68
  }

  private getBaseY() {
    return this.currentStage === 'egg' ? 62 : 76
  }
}

function createAccessoryOverlay(accessories: string[]) {
  const accessoryId = accessories[0]
  if (!accessoryId) return null

  const graphic = new Graphics()

  if (accessoryId.includes('bow')) {
    graphic.rect(6, 0, 6, 5).fill('#ef6f6c')
    graphic.rect(14, 0, 6, 5).fill('#ef6f6c')
    graphic.rect(12, 2, 4, 4).fill('#24311f')
    return graphic
  }

  if (accessoryId.includes('glasses')) {
    graphic.rect(6, 12, 8, 5).fill('#24311f')
    graphic.rect(18, 12, 8, 5).fill('#24311f')
    graphic.rect(14, 14, 4, 1).fill('#24311f')
    graphic.rect(8, 13, 4, 2).fill('#7ec8d8')
    graphic.rect(20, 13, 4, 2).fill('#7ec8d8')
    return graphic
  }

  graphic.rect(8, -2, 18, 5).fill('#24311f')
  graphic.rect(10, -8, 14, 8).fill('#a58cff')
  graphic.rect(12, -10, 10, 2).fill('#f4ffd5')
  return graphic
}

export function createFallbackPet(stage: PetStage, animation: AnimationName) {
  const container = new Container()
  const body = new Graphics()
  const face = new Graphics()
  const color = getFallbackPetColor(stage)
  const muted = animation === 'pet_dead'

  if (stage === 'egg') {
    body.rect(8, 0, 20, 4).fill('#24311f')
    body.rect(4, 4, 28, 4).fill('#24311f')
    body.rect(0, 8, 36, 28).fill('#24311f')
    body.rect(4, 36, 28, 4).fill('#24311f')
    body.rect(8, 40, 20, 4).fill('#24311f')

    body.rect(8, 4, 20, 4).fill(muted ? '#7d8490' : '#f4ffd5')
    body.rect(4, 8, 28, 12).fill(muted ? '#7d8490' : '#eaf8c8')
    body.rect(4, 20, 28, 16).fill(muted ? '#7d8490' : color)
    body.rect(8, 36, 20, 4).fill(muted ? '#7d8490' : color)

    body.rect(10, 12, 6, 4).fill('#ffffff')
    body.rect(18, 18, 4, 4).fill('#24311f')
    body.rect(22, 22, 4, 4).fill('#24311f')
    body.rect(14, 26, 4, 4).fill('#24311f')
    body.rect(18, 30, 8, 4).fill('#24311f')
    body.rect(8, 44, 20, 4).fill({ color: '#24311f', alpha: 0.24 })
  } else {
    body.rect(5, 5, 22, 3).fill('#24311f')
    body.rect(2, 8, 28, 18).fill('#24311f')
    body.rect(5, 8, 22, 18).fill(muted ? '#7d8490' : color)
    body.rect(9, 2, 4, 6).fill(muted ? '#7d8490' : color)
    body.rect(19, 2, 4, 6).fill(muted ? '#7d8490' : color)
  }

  if (animation === 'pet_sleep') {
    face.rect(8, 15, 6, 2).fill('#24311f')
    face.rect(18, 15, 6, 2).fill('#24311f')
    face.rect(25, -4, 6, 2).fill('#24311f')
    face.rect(29, -8, 6, 2).fill('#24311f')
  } else if (animation === 'pet_dead') {
    face.rect(8, 13, 6, 2).fill('#24311f')
    face.rect(10, 11, 2, 6).fill('#24311f')
    face.rect(18, 13, 6, 2).fill('#24311f')
    face.rect(20, 11, 2, 6).fill('#24311f')
  } else if (animation === 'pet_sick') {
    face.rect(8, 13, 4, 3).fill('#24311f')
    face.rect(20, 13, 4, 3).fill('#24311f')
    face.rect(14, 20, 5, 2).fill('#24311f')
  } else {
    face.rect(8, 13, 4, 4).fill('#24311f')
    face.rect(20, 13, 4, 4).fill('#24311f')
    face.rect(14, 20, 6, 2).fill('#24311f')
  }

  container.addChild(body, face)
  return container
}

function getFallbackPetColor(stage: PetStage) {
  if (stage === 'baby') return '#7ec8d8'
  if (stage === 'child' || stage === 'teen') return '#8bdc7d'
  if (stage === 'adult' || stage === 'elder') return '#f2b84b'
  if (stage === 'dead') return '#7d8490'
  return '#a58cff'
}
