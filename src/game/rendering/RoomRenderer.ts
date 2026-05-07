// 渲染模块：绘制房间背景、场景道具和天气视觉效果。
import { Container, Graphics } from 'pixi.js'

import type { PetViewModel } from './viewModels'

export class RoomRenderer {
  readonly container = new Container()
  private readonly backdrop = new Graphics()
  private currentKey = ''

  constructor() {
    this.container.addChild(this.backdrop)
  }

  setRoom(viewModel: PetViewModel) {
    const key = `${viewModel.roomId}:${viewModel.sceneId}:${viewModel.weather}`
    if (key === this.currentKey) return

    this.currentKey = key
    this.backdrop.clear()
    const palette = getScenePalette(viewModel.sceneId)
    this.backdrop.rect(0, 0, 160, 144).fill(palette.wall)
    this.backdrop.rect(0, 108, 160, 36).fill(palette.floor)
    this.backdrop.rect(0, 107, 160, 2).fill('#5e7047')
    drawSceneProps(this.backdrop, viewModel.sceneId)
    drawWeather(this.backdrop, viewModel.weather)
    this.backdrop.rect(118, 94, 18, 4).fill('#8fa36f')
    this.backdrop.rect(122, 82, 10, 12).fill('#5e7047')
    this.backdrop.rect(124, 78, 6, 6).fill('#24311f')
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}

function getScenePalette(sceneId: PetViewModel['sceneId']) {
  if (sceneId === 'bathroom') return { wall: '#d7edf2', floor: '#9cc4cf' }
  if (sceneId === 'shop') return { wall: '#f3d69a', floor: '#c79454' }
  if (sceneId === 'school') return { wall: '#d7dcf2', floor: '#9ba8d8' }
  if (sceneId === 'garden') return { wall: '#cfe8b8', floor: '#7db45f' }
  if (sceneId === 'bedroom') return { wall: '#d9d0ee', floor: '#9a88b8' }
  return { wall: '#d8e7b5', floor: '#c6d89b' }
}

function drawSceneProps(backdrop: Graphics, sceneId: PetViewModel['sceneId']) {
  if (sceneId === 'garden') {
    backdrop.rect(12, 92, 34, 14).fill('#5e7047')
    backdrop.rect(58, 90, 34, 16).fill('#5e7047')
    backdrop.rect(104, 92, 34, 14).fill('#5e7047')
    return
  }

  if (sceneId === 'bathroom') {
    backdrop.rect(16, 76, 30, 28).fill('#f4ffd5')
    backdrop.rect(20, 80, 22, 18).fill('#9cc4cf')
    return
  }

  if (sceneId === 'shop') {
    backdrop.rect(12, 20, 42, 18).fill('#f4ffd5')
    backdrop.rect(16, 24, 34, 4).fill('#c79454')
    backdrop.rect(16, 32, 34, 4).fill('#c79454')
    return
  }

  if (sceneId === 'school') {
    backdrop.rect(14, 18, 44, 24).fill('#24311f')
    backdrop.rect(18, 22, 36, 16).fill('#5e7047')
    return
  }

  backdrop.rect(14, 18, 30, 22).fill('#f4ffd5')
  backdrop.rect(16, 20, 26, 18).fill('#a8bc82')
  backdrop.rect(28, 20, 2, 18).fill('#5e7047')
  backdrop.rect(16, 28, 26, 2).fill('#5e7047')
}

function drawWeather(
  backdrop: Graphics,
  weather: PetViewModel['weather'] = 'clear'
) {
  if (weather === 'night') {
    backdrop.rect(0, 0, 160, 108).fill({ color: '#1c2235', alpha: 0.22 })
    backdrop.rect(136, 14, 8, 8).fill('#f4ffd5')
    backdrop.rect(132, 14, 8, 8).fill('#d9d0ee')
    return
  }

  if (weather === 'rain') {
    for (let index = 0; index < 9; index += 1) {
      const x = 8 + index * 17
      backdrop.rect(x, 16 + (index % 3) * 8, 2, 7).fill('#7ec8d8')
    }
    return
  }

  if (weather === 'wind') {
    backdrop.rect(104, 20, 24, 2).fill('#f4ffd5')
    backdrop.rect(118, 28, 28, 2).fill('#f4ffd5')
    return
  }

  backdrop.rect(132, 14, 12, 12).fill('#f2b84b')
  backdrop.rect(136, 10, 4, 4).fill('#f2b84b')
  backdrop.rect(136, 28, 4, 4).fill('#f2b84b')
  backdrop.rect(126, 20, 4, 4).fill('#f2b84b')
  backdrop.rect(146, 20, 4, 4).fill('#f2b84b')
}
