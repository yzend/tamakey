/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { assetManifest, type PetSpriteManifest } from './assetManifest'

const requiredAnimationKeys = [
  'egg_idle',
  'egg_hatch',
  'baby_idle',
  'baby_happy',
  'baby_sad',
  'child_idle',
  'child_happy',
  'child_sad',
  'adult_idle',
  'adult_happy',
  'adult_sad',
  'pet_eat',
  'pet_play',
  'pet_clean',
  'pet_sleep',
  'pet_sick',
  'pet_dead',
] as const

const requiredAssets = [
  ['pets/monkey/monkey-idle.png', 1256, 314],
  ['pets/monkey/monkey-happy.png', 1256, 314],
  ['pets/monkey/monkey-sad.png', 628, 314],
  ['pets/monkey/monkey-sick.png', 628, 314],
  ['pets/monkey/monkey-sleep-scene.png', 1256, 314],
  ['pets/monkey/monkey-eat.png', 1256, 314],
  ['pets/monkey/monkey-clean.png', 1256, 314],
  ['pets/monkey/monkey-play.png', 1256, 314],
  ['pets/monkey/monkey-dead.png', 314, 314],
  ['pets/egg/egg-idle.png', 128, 64],
  ['pets/egg/egg-crack.png', 384, 64],
  ['rooms/home.png', 160, 144],
  ['rooms/bedroom.png', 160, 144],
  ['rooms/garden.png', 160, 144],
  ['objects/poop.png', 24, 24],
  ['objects/garden-plot-empty.png', 32, 24],
  ['objects/garden-plot-seed.png', 32, 24],
  ['objects/garden-sprout.png', 64, 24],
  ['objects/garden-ready.png', 64, 24],
  ['effects/heart-burst.png', 192, 32],
  ['effects/clean-sparkle.png', 192, 32],
  ['effects/zzz.png', 128, 32],
] as const

describe('assetManifest', () => {
  it('points runtime pet manifest entries at local public assets', () => {
    expect(assetManifest.petManifests.monkey).toBe(
      '/assets/pets/monkey/monkey.json'
    )
    for (const path of Object.values(assetManifest.petManifests)) {
      expect(path).toMatch(/^\/assets\//)
    }
  })

  it('keeps the monkey animation manifest complete for P0 runtime keys', () => {
    const manifest = readJsonManifest('pets/monkey/monkey.json')

    for (const key of requiredAnimationKeys) {
      const animation = manifest.animations[key]
      expect(animation, key).toBeDefined()
      expect(animation.image, key).toMatch(/^\/assets\//)
      expect(animation.frameWidth, key).toBeGreaterThan(0)
      expect(animation.frameHeight, key).toBeGreaterThan(0)
      expect(animation.frames, key).toBeGreaterThan(0)
      expect(animation.fps, key).toBeGreaterThan(0)
    }
  })

  it('ships P0 PNG assets with expected dimensions', () => {
    for (const [name, width, height] of requiredAssets) {
      const file = join(process.cwd(), 'public/assets', name)
      expect(existsSync(file), name).toBe(true)
      expect(readPngSize(file), name).toEqual({ width, height })
    }
  })
})

function readJsonManifest(name: string) {
  const file = join(process.cwd(), 'public/assets', name)
  return JSON.parse(readFileSync(file, 'utf8')) as PetSpriteManifest
}

function readPngSize(file: string) {
  const buffer = readFileSync(file)
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}
