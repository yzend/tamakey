// 渲染模块：绘制便便、家具、活动物件和花园元素等场景对象。
import { Container, Graphics } from 'pixi.js'

import type { PetViewModel } from './viewModels'

export class ObjectRenderer {
  readonly container = new Container()
  private currentKey = ''

  setObjects(viewModel: PetViewModel) {
    const safeCount = Math.max(0, Math.min(5, Math.floor(viewModel.poopCount)))
    const key = [
      safeCount,
      viewModel.sceneId,
      viewModel.activityId,
      viewModel.weather,
      viewModel.socialState,
      viewModel.gardenReadyCount,
      viewModel.furniture.join(','),
      viewModel.accessories?.join(',') ?? '',
    ].join(':')
    if (key === this.currentKey) return

    this.currentKey = key
    this.container.removeChildren()

    for (let index = 0; index < safeCount; index += 1) {
      const poop = createPoopGraphic()
      poop.x = 18 + index * 14
      poop.y = index % 2 === 0 ? 116 : 122
      this.container.addChild(poop)
    }

    for (let index = 0; index < viewModel.furniture.length; index += 1) {
      const furniture = createFurnitureGraphic(
        viewModel.furniture[index],
        index
      )
      furniture.x = 96 + index * 18
      furniture.y = 96
      this.container.addChild(furniture)
    }

    if (viewModel.activityId) {
      const activity = createActivityGraphic(viewModel.activityId)
      activity.x = 18
      activity.y = 62
      this.container.addChild(activity)
    }

    if (viewModel.socialState === 'available') {
      const social = createSocialGraphic()
      social.x = 124
      social.y = 48
      this.container.addChild(social)
    }

    if (viewModel.sceneId === 'garden') {
      for (let index = 0; index < 3; index += 1) {
        const plot = createPlotGraphic(index < viewModel.gardenReadyCount)
        plot.x = 22 + index * 46
        plot.y = 96
        this.container.addChild(plot)
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}

function createFurnitureGraphic(id: string | undefined, index: number) {
  const graphic = new Graphics()
  const color = getFurnitureColor(id, index)

  if (id?.includes('lamp')) {
    graphic.rect(6, 0, 8, 8).fill('#f4ffd5')
    graphic.rect(4, 8, 12, 4).fill(color)
    graphic.rect(9, 12, 2, 14).fill('#24311f')
    graphic.rect(4, 24, 12, 3).fill('#24311f')
    return graphic
  }

  if (id?.includes('plant')) {
    graphic.rect(6, 16, 12, 10).fill(color)
    graphic.rect(10, 4, 4, 12).fill('#5e7047')
    graphic.rect(4, 6, 8, 5).fill('#8bdc7d')
    graphic.rect(12, 8, 8, 5).fill('#8bdc7d')
    return graphic
  }

  if (id?.includes('rug')) {
    graphic.rect(0, 16, 24, 8).fill('#24311f')
    graphic.rect(2, 17, 20, 6).fill(color)
    return graphic
  }

  graphic.rect(0, 8, 18, 12).fill('#24311f')
  graphic.rect(2, 2, 14, 16).fill(color)
  graphic.rect(4, 20, 3, 6).fill('#24311f')
  graphic.rect(12, 20, 3, 6).fill('#24311f')
  return graphic
}

function getFurnitureColor(id: string | undefined, index: number) {
  if (id?.includes('blue')) return '#7ec8d8'
  if (id?.includes('green')) return '#8bdc7d'
  if (id?.includes('purple')) return '#a58cff'
  if (id?.includes('red')) return '#ef6f6c'
  return index % 2 === 0 ? '#f2b84b' : '#7ec8d8'
}

function createActivityGraphic(
  activityId: NonNullable<PetViewModel['activityId']>
) {
  const graphic = new Graphics()
  const color =
    activityId === 'school'
      ? '#a58cff'
      : activityId === 'shop'
        ? '#f2b84b'
        : '#7ec8d8'

  if (activityId === 'school') {
    graphic.rect(0, 0, 34, 22).fill('#24311f')
    graphic.rect(3, 3, 28, 16).fill('#5e7047')
    graphic.rect(8, 8, 12, 2).fill('#f4ffd5')
    graphic.rect(8, 13, 18, 2).fill('#f4ffd5')
    return graphic
  }

  if (activityId === 'cooking') {
    graphic.rect(4, 12, 28, 14).fill('#24311f')
    graphic.rect(8, 8, 20, 10).fill(color)
    graphic.rect(12, 0, 3, 8).fill('#f4ffd5')
    graphic.rect(19, 2, 3, 6).fill('#f4ffd5')
    return graphic
  }

  if (activityId === 'bath' || activityId === 'toilet') {
    graphic.rect(0, 12, 34, 14).fill('#f4ffd5')
    graphic.rect(4, 15, 26, 8).fill(color)
    graphic.rect(24, 6, 8, 6).fill('#24311f')
    return graphic
  }

  graphic.rect(0, 10, 34, 16).fill('#24311f')
  graphic.rect(4, 4, 26, 18).fill(color)
  graphic.rect(8, 8, 18, 3).fill('#f4ffd5')
  graphic.rect(8, 14, 12, 3).fill('#f4ffd5')
  return graphic
}

function createSocialGraphic() {
  const graphic = new Graphics()
  graphic.rect(0, 6, 24, 14).fill('#24311f')
  graphic.rect(2, 2, 20, 14).fill('#f4ffd5')
  graphic.rect(6, 7, 3, 3).fill('#8bdc7d')
  graphic.rect(14, 7, 3, 3).fill('#8bdc7d')
  graphic.rect(10, 16, 5, 5).fill('#f4ffd5')
  return graphic
}

function createPlotGraphic(ready: boolean) {
  const graphic = new Graphics()
  graphic.rect(0, 10, 30, 10).fill('#24311f')
  graphic.rect(2, 12, 26, 6).fill('#5e7047')
  const sproutColor = ready ? '#f2b84b' : '#8bdc7d'
  graphic.rect(13, 3, 4, 9).fill(sproutColor)
  graphic.rect(8, 5, 7, 4).fill(sproutColor)
  graphic.rect(15, 5, 7, 4).fill(sproutColor)
  return graphic
}

function createPoopGraphic() {
  const graphic = new Graphics()
  graphic.rect(3, 0, 4, 2).fill('#24311f')
  graphic.rect(1, 2, 8, 3).fill('#5e7047')
  graphic.rect(0, 5, 10, 4).fill('#24311f')
  graphic.rect(2, 6, 2, 1).fill('#d8e7b5')
  return graphic
}
