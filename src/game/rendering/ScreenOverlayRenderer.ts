import { Container, Graphics } from 'pixi.js'

export class ScreenOverlayRenderer {
  readonly container = new Container()
  private readonly overlay = new Graphics()

  constructor() {
    this.container.addChild(this.overlay)
    this.draw()
  }

  destroy() {
    this.container.destroy({ children: true })
  }

  private draw() {
    this.overlay.clear()
    for (let x = 0; x < 160; x += 4) {
      this.overlay.rect(x, 0, 1, 144).fill({ color: '#24311f', alpha: 0.04 })
    }
    for (let y = 0; y < 144; y += 4) {
      this.overlay.rect(0, y, 160, 1).fill({ color: '#24311f', alpha: 0.04 })
    }
    this.overlay.rect(0, 0, 160, 2).fill({ color: '#f4ffd5', alpha: 0.12 })
    this.overlay.rect(0, 142, 160, 2).fill({ color: '#24311f', alpha: 0.16 })
  }
}
