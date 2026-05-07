import { Container, Graphics } from 'pixi.js'

import type { InteractionType, PetMood } from './viewModels'

type EffectParticle = {
  graphic: Graphics
  ageMs: number
  lifetimeMs: number
  velocityY: number
}

export class EffectRenderer {
  readonly container = new Container()
  private readonly particles: EffectParticle[] = []

  playInteraction(interaction: InteractionType) {
    if (interaction === 'feedMeal' || interaction === 'feedSnack') {
      this.spawnBurst('#f2b84b', 5, 78, 72)
      return
    }

    if (interaction === 'play') {
      this.spawnBurst('#8bdc7d', 6, 80, 66)
      return
    }

    if (interaction === 'clean') {
      this.spawnBurst('#7ec8d8', 7, 84, 92)
      return
    }

    if (interaction === 'medicine') {
      this.spawnBurst('#ef6f6c', 4, 80, 68)
      return
    }

    this.spawnBurst('#a58cff', 4, 106, 58)
  }

  playInvalidInteraction() {
    this.spawnBurst('#ef6f6c', 6, 80, 72)
    this.spawnCross(80, 56)
  }

  playHatch() {
    this.spawnBurst('#f4ffd5', 9, 80, 74)
  }

  playEvolution() {
    this.spawnBurst('#a58cff', 10, 80, 72)
  }

  playSick() {
    this.spawnBurst('#ef6f6c', 5, 82, 66)
  }

  playDeath() {
    this.spawnBurst('#7d8490', 4, 80, 78)
  }

  playMoodTransition(mood: PetMood) {
    const tone =
      mood === 'happy' ? '#8bdc7d' : mood === 'sad' ? '#7ec8d8' : '#a58cff'
    this.spawnBurst(tone, 3, 80, 70)
  }

  update(deltaMs: number) {
    for (const particle of this.particles) {
      particle.ageMs += deltaMs
      particle.graphic.y += particle.velocityY * (deltaMs / 16.67)
      particle.graphic.alpha = Math.max(
        0,
        1 - particle.ageMs / particle.lifetimeMs
      )
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      if (this.particles[index]?.ageMs >= this.particles[index].lifetimeMs) {
        const particle = this.particles[index]
        this.container.removeChild(particle.graphic)
        particle.graphic.destroy()
        this.particles.splice(index, 1)
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true })
    this.particles.length = 0
  }

  private spawnBurst(
    color: string,
    count: number,
    originX: number,
    originY: number
  ) {
    for (let index = 0; index < count; index += 1) {
      const particle = new Graphics()
      const offsetX = (index - Math.floor(count / 2)) * 5
      particle.rect(0, 0, 3, 3).fill(color)
      particle.x = originX + offsetX
      particle.y = originY + (index % 2) * 4
      this.container.addChild(particle)
      this.particles.push({
        graphic: particle,
        ageMs: 0,
        lifetimeMs: 520,
        velocityY: -0.42 - index * 0.02,
      })
    }
  }

  private spawnCross(originX: number, originY: number) {
    const cross = new Graphics()
    cross.rect(0, 0, 4, 4).fill('#24311f')
    cross.rect(8, 0, 4, 4).fill('#24311f')
    cross.rect(4, 4, 4, 4).fill('#24311f')
    cross.rect(0, 8, 4, 4).fill('#24311f')
    cross.rect(8, 8, 4, 4).fill('#24311f')
    cross.x = originX - 6
    cross.y = originY
    this.container.addChild(cross)
    this.particles.push({
      graphic: cross,
      ageMs: 0,
      lifetimeMs: 620,
      velocityY: -0.2,
    })
  }
}
