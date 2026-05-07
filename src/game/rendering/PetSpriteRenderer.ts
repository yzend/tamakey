// 渲染模块：绘制图片优先宠物精灵、配饰和待机动作。
import {
  AnimatedSprite,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Texture,
  type FrameObject,
} from 'pixi.js'

import {
  chooseAnimation,
  type PetRendererAnimationName,
} from './AnimationController'
import {
  assetManifest,
  type PetAnimationAsset,
  type PetSpriteManifest,
} from './assetManifest'
import {
  PET_BASELINE,
  PET_FRAME_SIZE,
  RENDER_SCALE,
} from './renderingConstants'
import type { PetStage, PetViewModel } from './viewModels'

export class PetSpriteRenderer {
  readonly container = new Container()
  private readonly petContainer = new Container()
  private currentAnimation: PetRendererAnimationName | null = null
  private elapsedMs = 0
  private currentStage: PetStage | null = null
  private currentAccessoryKey = ''
  private isOneShot = false
  private currentViewModel: PetViewModel | null = null
  private manifest: PetSpriteManifest | null = null
  private readonly manifestPromise: Promise<PetSpriteManifest | null>
  private readonly texturePromises = new Map<string, Promise<Texture>>()
  private readonly frameCache = new Map<string, FrameObject[]>()
  private spriteBaseX = PET_BASELINE.centerX
  private spriteBaseY = PET_BASELINE.defaultY

  constructor() {
    this.container.addChild(this.petContainer)
    this.petContainer.x = Math.round(68 * RENDER_SCALE)
    this.petContainer.y = Math.round(76 * RENDER_SCALE)
    this.manifestPromise = loadPetManifest(assetManifest.petManifests.monkey)
    void this.manifestPromise.then((manifest) => {
      this.manifest = manifest
      if (this.currentViewModel) this.drawPet(this.currentViewModel)
    })
  }

  setPetState(viewModel: PetViewModel) {
    const animation = chooseAnimation(viewModel)
    const accessoryKey = viewModel.accessories?.join(',') ?? ''
    this.currentViewModel = viewModel
    if (
      !this.isOneShot &&
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

  playOnce(animation: PetRendererAnimationName) {
    this.currentAnimation = animation
    this.elapsedMs = 0
    this.isOneShot = true
    if (this.currentViewModel) {
      this.drawPet(this.currentViewModel)
    }
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs

    const wave = Math.sin(this.elapsedMs / 150)
    const isSleeping = this.currentAnimation === 'pet_sleep'
    const isSick = this.currentAnimation === 'pet_sick'
    const isDead = this.currentAnimation === 'pet_dead'

    if (isDead) {
      if (!this.hasSprite()) {
        this.petContainer.y = Math.round(84 * RENDER_SCALE)
        this.petContainer.x = Math.round(68 * RENDER_SCALE)
      }
      return
    }

    if (isSick) {
      this.petContainer.x = this.getBaseX() + (wave > 0 ? 1 : -1)
      if (!this.hasSprite()) this.petContainer.y = 77
      return
    }

    if (isSleeping) {
      this.petContainer.x = this.getBaseX()
      if (!this.hasSprite()) this.petContainer.y = 78 + (wave > 0 ? 1 : 0)
      return
    }

    this.petContainer.x = this.getBaseX()
    if (!this.hasSprite())
      this.petContainer.y = this.getBaseY() + (wave > 0.65 ? -2 : 0)

    if (this.isOneShot && this.elapsedMs > 680) {
      this.isOneShot = false
      if (this.currentViewModel) {
        this.setPetState(this.currentViewModel)
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }

  private drawPet(viewModel: PetViewModel) {
    this.petContainer.removeChildren()
    const animation = this.currentAnimation ?? chooseAnimation(viewModel)
    const asset = this.resolveAnimationAsset(animation)

    if (asset) {
      const sprite = this.createAnimatedSprite(asset, animation)
      if (sprite) {
        this.placeSprite(asset)
        this.petContainer.addChild(sprite)
        const accessory = createAccessoryOverlay(viewModel.accessories ?? [])
        if (accessory) {
          accessory.x = -16
          accessory.y = -58
          this.petContainer.addChild(accessory)
        }
        return
      }
    }

    this.placeFallback(viewModel.stage)
    this.petContainer.addChild(createFallbackPet(viewModel.stage, animation))

    const accessory = createAccessoryOverlay(viewModel.accessories ?? [])
    if (accessory) this.petContainer.addChild(accessory)
  }

  private getBaseX() {
    if (this.hasSprite()) return this.spriteBaseX
    return Math.round((this.currentStage === 'egg' ? 62 : 68) * RENDER_SCALE)
  }

  private getBaseY() {
    return Math.round((this.currentStage === 'egg' ? 62 : 76) * RENDER_SCALE)
  }

  private resolveAnimationAsset(animation: PetRendererAnimationName) {
    const animations = this.manifest?.animations
    return (
      animations?.[animation] ??
      animations?.[this.getFallbackAnimation(animation)] ??
      animations?.baby_idle ??
      null
    )
  }

  private getFallbackAnimation(animation: PetRendererAnimationName) {
    if (animation.includes('_happy')) return 'baby_happy'
    if (animation.includes('_sad')) return 'baby_sad'
    if (animation === 'pet_clean' || animation === 'pet_play')
      return 'baby_happy'
    return 'baby_idle'
  }

  private createAnimatedSprite(
    asset: PetAnimationAsset,
    animation: PetRendererAnimationName
  ) {
    const frames = this.getCachedFrames(asset)
    if (!frames) {
      void this.loadFrames(asset)
        .then(() => {
          if (this.currentAnimation === animation && this.currentViewModel) {
            this.drawPet(this.currentViewModel)
          }
        })
        .catch(() => undefined)
      return null
    }

    const sprite = new AnimatedSprite({
      textures: frames,
      autoPlay: true,
      loop: asset.loop,
    })
    sprite.anchor.set(asset.anchor.x, asset.anchor.y)
    sprite.roundPixels = true
    sprite.onComplete = () => {
      if (!this.isOneShot) return

      this.isOneShot = false
      if (this.currentViewModel) {
        this.setPetState(this.currentViewModel)
      }
    }
    return sprite
  }

  private getCachedFrames(asset: PetAnimationAsset) {
    return this.frameCache.get(getAssetCacheKey(asset)) ?? null
  }

  private async loadFrames(asset: PetAnimationAsset) {
    const cacheKey = getAssetCacheKey(asset)
    if (this.frameCache.has(cacheKey)) return

    const texture = await this.loadTexture(asset.image)
    const frameMs = 1000 / Math.max(1, asset.fps)
    const frames = Array.from({ length: asset.frames }, (_, index) => ({
      texture: new Texture({
        source: texture.source,
        frame: new Rectangle(
          index * asset.frameWidth,
          0,
          asset.frameWidth,
          asset.frameHeight
        ),
      }),
      time: frameMs,
    }))
    this.frameCache.set(cacheKey, frames)
  }

  private loadTexture(image: string) {
    const existing = this.texturePromises.get(image)
    if (existing) return existing

    const promise = Assets.load<Texture>({
      src: image,
      data: { scaleMode: 'linear' },
    }).then((texture) => {
      texture.source.scaleMode = 'linear'
      return texture
    })
    this.texturePromises.set(image, promise)
    return promise
  }

  private placeSprite(asset: PetAnimationAsset) {
    const baselineY =
      this.currentAnimation === 'egg_idle' ||
      this.currentAnimation === 'egg_hatch'
        ? PET_BASELINE.eggY
        : asset.frameHeight > PET_FRAME_SIZE
          ? PET_BASELINE.lowY
          : this.currentAnimation === 'pet_dead'
            ? PET_BASELINE.lowY
            : PET_BASELINE.defaultY
    this.spriteBaseX = Math.round(PET_BASELINE.centerX + asset.offset.x)
    this.spriteBaseY = Math.round(baselineY + asset.offset.y)
    this.petContainer.scale.set(1)
    this.petContainer.x = this.spriteBaseX
    this.petContainer.y = this.spriteBaseY
  }

  private placeFallback(stage: PetStage) {
    this.petContainer.x = Math.round((stage === 'egg' ? 62 : 68) * RENDER_SCALE)
    this.petContainer.y = Math.round(
      (stage === 'egg' ? 62 : stage === 'dead' ? 84 : 76) * RENDER_SCALE
    )
    this.petContainer.scale.set(RENDER_SCALE)
  }

  private hasSprite() {
    return this.petContainer.children[0] instanceof AnimatedSprite
  }
}

async function loadPetManifest(
  path: string
): Promise<PetSpriteManifest | null> {
  try {
    const response = await fetch(path)
    if (!response.ok) return null
    return (await response.json()) as PetSpriteManifest
  } catch {
    return null
  }
}

function getAssetCacheKey(asset: PetAnimationAsset) {
  return [
    asset.image,
    asset.frameWidth,
    asset.frameHeight,
    asset.frames,
    asset.fps,
  ].join(':')
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

export function createFallbackPet(
  stage: PetStage,
  animation: PetRendererAnimationName
) {
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
