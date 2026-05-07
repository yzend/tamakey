import type {
  GameState,
  PetStage,
  SicknessState,
  SleepState,
} from '../../game/domain/gameTypes'

export type TestPetStatKey =
  | 'hunger'
  | 'happiness'
  | 'cleanliness'
  | 'energy'
  | 'health'
  | 'bladder'

export type TestResourceKey = 'coins' | 'medicine' | 'food' | 'seeds'

export type TestPatch =
  | { type: 'pet-stage'; stage: PetStage; now: number }
  | { type: 'pet-stat'; key: TestPetStatKey; value: number }
  | { type: 'sickness'; value: SicknessState }
  | { type: 'sleep'; value: SleepState }
  | { type: 'poop'; value: number }
  | { type: 'resource'; key: TestResourceKey; value: number }
  | { type: 'feature'; key: keyof GameState['featureFlags']; value: boolean }

export const TEST_PET_STAT_LABELS: Record<TestPetStatKey, string> = {
  bladder: '如厕',
  cleanliness: '清洁',
  energy: '精力',
  happiness: '开心',
  health: '健康',
  hunger: '饥饿',
}

export const TEST_RESOURCE_LABELS: Record<TestResourceKey, string> = {
  coins: '金币',
  food: '食物',
  medicine: '药品',
  seeds: '种子',
}

export function applyTestPatch(state: GameState, patch: TestPatch): GameState {
  if (patch.type === 'pet-stage') {
    return applyStagePatch(state, patch.stage, patch.now)
  }

  if (patch.type === 'pet-stat') {
    return {
      ...state,
      pet: {
        ...state.pet,
        [patch.key]: clampPercent(patch.value),
      },
    }
  }

  if (patch.type === 'sickness') {
    return {
      ...state,
      pet: {
        ...state.pet,
        sickness: patch.value,
        mood: patch.value === 'none' ? state.pet.mood : 'sick',
      },
      carePressure: {
        ...state.carePressure,
        sickSeconds:
          patch.value === 'none' ? 0 : state.carePressure.sickSeconds,
      },
    }
  }

  if (patch.type === 'sleep') {
    return {
      ...state,
      pet: {
        ...state.pet,
        sleepState: patch.value,
        mood: patch.value === 'sleeping' ? 'sleeping' : state.pet.mood,
      },
      world: {
        ...state.world,
        sceneId: patch.value === 'sleeping' ? 'bedroom' : state.world.sceneId,
      },
    }
  }

  if (patch.type === 'poop') {
    return {
      ...state,
      world: {
        ...state.world,
        poopCount: clampInteger(patch.value, 0, 5),
      },
    }
  }

  if (patch.type === 'resource') {
    return applyResourcePatch(state, patch.key, patch.value)
  }

  return {
    ...state,
    featureFlags: {
      ...state.featureFlags,
      [patch.key]: patch.value,
    },
  }
}

function applyStagePatch(
  state: GameState,
  stage: PetStage,
  now: number
): GameState {
  if (stage === 'egg') {
    return {
      ...state,
      pet: {
        ...state.pet,
        stage,
        mood: 'idle',
        ageSeconds: 0,
        health: Math.max(1, state.pet.health),
        deathSafety: Math.max(1, state.pet.deathSafety),
        sleepState: 'awake',
        hatchedAt: null,
        lastBirthdayAt: null,
      },
      world: {
        ...state.world,
        activity: null,
        sceneId: 'home',
      },
      ui: {
        ...state.ui,
        displayStack: [],
      },
    }
  }

  if (stage === 'dead') {
    return {
      ...state,
      pet: {
        ...state.pet,
        stage,
        mood: 'idle',
        ageSeconds: Math.max(state.pet.ageSeconds, getStageAgeSeconds('child')),
        health: 0,
        deathSafety: 0,
        sleepState: 'awake',
      },
      world: {
        ...state.world,
        activity: null,
        sceneId: 'home',
      },
      ui: {
        ...state.ui,
        displayStack: [],
      },
    }
  }

  const ageSeconds = getStageAgeSeconds(stage)
  return {
    ...state,
    pet: {
      ...state.pet,
      stage,
      ageSeconds,
      health: Math.max(1, state.pet.health),
      deathSafety: Math.max(1, state.pet.deathSafety),
      sleepState: 'awake',
      hatchedAt: now - ageSeconds * 1000,
      lastBirthdayAt: stage === 'baby' ? null : now - ageSeconds * 1000,
    },
  }
}

function applyResourcePatch(
  state: GameState,
  key: TestResourceKey,
  value: number
): GameState {
  const quantity = clampInteger(value, 0, 999)

  if (key === 'coins' || key === 'medicine') {
    return {
      ...state,
      resources: {
        ...state.resources,
        [key]: quantity,
      },
    }
  }

  if (key === 'food') {
    return {
      ...state,
      resources: {
        ...state.resources,
        food: setInventoryQuantity(
          state.resources.food,
          'basic-meal',
          quantity
        ),
      },
    }
  }

  return {
    ...state,
    resources: {
      ...state.resources,
      seeds: setInventoryQuantity(
        state.resources.seeds,
        'sprout-seed',
        quantity
      ),
    },
  }
}

function setInventoryQuantity(
  items: GameState['resources']['food'],
  id: string,
  quantity: number
) {
  const existing = items.some((item) => item.id === id)
  const next = existing
    ? items.map((item) => (item.id === id ? { ...item, quantity } : item))
    : [...items, { id, quantity }]

  return next.filter((item) => item.quantity > 0)
}

function getStageAgeSeconds(stage: Exclude<PetStage, 'egg' | 'dead'>) {
  const ages: Record<Exclude<PetStage, 'egg' | 'dead'>, number> = {
    baby: 4 * 60,
    child: 31 * 60,
    teen: 25 * 60 * 60,
    adult: 4 * 24 * 60 * 60,
    elder: 8 * 24 * 60 * 60,
  }

  return ages[stage]
}

function clampPercent(value: number) {
  return clampInteger(value, 0, 100)
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}
