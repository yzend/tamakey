import { describe, expect, it } from 'vitest'

import { chooseAnimation, chooseOneShotAnimation } from './AnimationController'
import type { PetViewModel } from './viewModels'

const baseViewModel: PetViewModel = {
  stage: 'baby',
  mood: 'idle',
  sleepState: 'awake',
  sickness: 'none',
  poopCount: 0,
  roomId: 'default',
  sceneId: 'home',
  activityId: null,
  furniture: [],
  accessories: [],
  weather: 'clear',
  socialState: 'offline',
  gardenReadyCount: 0,
}

describe('AnimationController', () => {
  it('prioritizes lifecycle and blocking states before mood', () => {
    expect(
      chooseAnimation({ ...baseViewModel, stage: 'dead', mood: 'happy' })
    ).toBe('pet_dead')
    expect(
      chooseAnimation({ ...baseViewModel, stage: 'egg', mood: 'happy' })
    ).toBe('egg_idle')
    expect(
      chooseAnimation({
        ...baseViewModel,
        sleepState: 'sleeping',
        sickness: 'mild',
        mood: 'happy',
      })
    ).toBe('pet_sleep')
    expect(
      chooseAnimation({ ...baseViewModel, sickness: 'mild', mood: 'happy' })
    ).toBe('pet_sick')
  })

  it('maps stage and mood to stable animation names', () => {
    expect(chooseAnimation({ ...baseViewModel, stage: 'teen' })).toBe(
      'child_idle'
    )
    expect(chooseAnimation({ ...baseViewModel, stage: 'elder' })).toBe(
      'adult_idle'
    )
    expect(
      chooseAnimation({ ...baseViewModel, stage: 'adult', mood: 'happy' })
    ).toBe('adult_happy')
    expect(
      chooseAnimation({ ...baseViewModel, stage: 'child', mood: 'angry' })
    ).toBe('child_sad')
  })

  it('maps visual interactions to one-shot animations only when useful', () => {
    expect(chooseOneShotAnimation('feedMeal')).toBe('pet_eat')
    expect(chooseOneShotAnimation('feedSnack')).toBe('pet_eat')
    expect(chooseOneShotAnimation('play')).toBe('pet_play')
    expect(chooseOneShotAnimation('startMinigame')).toBe('pet_play')
    expect(chooseOneShotAnimation('clean')).toBe('pet_clean')
    expect(chooseOneShotAnimation('bath')).toBe('pet_clean')
    expect(chooseOneShotAnimation('praise', 'adult')).toBe('adult_happy')
    expect(chooseOneShotAnimation('scold', 'teen')).toBe('child_sad')
    expect(chooseOneShotAnimation('toggleSetting')).toBeNull()
  })
})
