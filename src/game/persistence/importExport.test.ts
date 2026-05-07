import { describe, expect, it } from 'vitest'

import { createInitialGame } from '../application/createInitialGame'
import { exportGameState, importGameState } from './importExport'
import { hydrateSavedGame, validateSaveData } from './saveSchema'

describe('save import export', () => {
  it('round trips v3 saves without persisting ui', () => {
    const now = Date.UTC(2026, 0, 1)
    const state = {
      ...createInitialGame(now),
      ui: { displayStack: ['main' as const, 'stats' as const], lastToast: 'x' },
    }
    const exported = exportGameState(state, now + 1_000)
    const imported = importGameState(exported)
    const parsed = validateSaveData(JSON.parse(exported))

    expect(parsed.schemaVersion).toBe(3)
    expect('ui' in parsed.game).toBe(false)
    expect('settings' in parsed.game).toBe(false)
    expect('profile' in parsed.game).toBe(false)
    expect(parsed.profile.username).toBe('本地照护者')
    expect(imported.status).toBe('ok')
    if (imported.status === 'ok') {
      expect(imported.state.ui.displayStack).toEqual([])
      expect(imported.state.settings.soundEnabled).toBe(true)
      expect(imported.state.profile.friendCode).toMatch(/^LOCAL-/)
    }
  })

  it('migrates a v2 save into v3 shape', () => {
    const now = Date.UTC(2026, 0, 1)
    const baseline = createInitialGame(now)
    const legacy = {
      schemaVersion: 2,
      savedAt: now,
      game: {
        ...baseline,
        schemaVersion: 2,
        pet: {
          ...baseline.pet,
          id: 'v2-pet',
          name: 'V2 Pet',
          mood: 'curious',
        },
        resources: {
          coins: 7,
          food: [{ id: 'basic-meal', quantity: 1 }],
          items: [],
          seeds: [],
          furniture: [],
          accessories: [],
          medicine: 0,
        },
        world: {
          sceneId: 'home',
          activity: null,
          poopCount: 0,
          roomId: 'default',
          digestionSeconds: 0,
          furniture: [],
        },
        profile: {
          username: 'v2-caretaker',
          generation: 2,
          achievements: ['legacy'],
        },
        settings: undefined,
        ui: undefined,
      },
      settings: {
        notificationsEnabled: true,
        reducedMotion: true,
        soundEnabled: false,
        fastHatch: true,
      },
    }

    const migrated = validateSaveData(legacy)
    const hydrated = hydrateSavedGame(migrated)

    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.profile.username).toBe('v2-caretaker')
    expect(migrated.profile.friendCode).toMatch(/^TK-/)
    expect(migrated.game.resources.materials).toEqual([])
    expect(migrated.game.world.weather).toBe('clear')
    expect(migrated.settings.theme).toBe('classic')
    expect(hydrated.pet.id).toBe('v2-pet')
    expect(hydrated.settings.soundEnabled).toBe(false)
  })

  it('migrates a v1 local save into v3 shape', () => {
    const now = Date.UTC(2026, 0, 1)
    const legacy = {
      schemaVersion: 1,
      savedAt: now,
      gameState: {
        version: 1,
        pet: {
          id: 'legacy',
          name: 'Legacy',
          species: 'starter',
          stage: 'baby',
          mood: 'idle',
          ageSeconds: 300,
          hunger: 20,
          happiness: 70,
          cleanliness: 80,
          energy: 60,
          health: 90,
          sickness: 'none',
          sleepState: 'awake',
          careMistakes: 0,
          bornAt: now,
          lastInteractionAt: now,
        },
        resources: {
          coins: 3,
          food: [{ id: 'basic-meal', quantity: 1 }],
          medicine: 1,
        },
        world: {
          poopCount: 0,
          roomId: 'default',
          digestionSeconds: 0,
        },
        carePressure: {
          hungrySeconds: 0,
          dirtySeconds: 0,
          sickSeconds: 0,
        },
        settings: {
          notificationsEnabled: false,
          reducedMotion: false,
          soundEnabled: true,
        },
        createdAt: now,
        lastTickAt: now,
        lastSavedAt: now,
      },
    }

    const migrated = validateSaveData(legacy)
    const hydrated = hydrateSavedGame(migrated)

    expect(migrated.schemaVersion).toBe(3)
    expect(hydrated.pet.id).toBe('legacy')
    expect(hydrated.pet.bladder).toBe(0)
    expect(hydrated.garden.plots).toHaveLength(3)
    expect(hydrated.resources.materials).toEqual([])
    expect(hydrated.profile.friendCode).toMatch(/^TK-/)
    expect(hydrated.settings.theme).toBe('classic')
  })

  it('rejects invalid imports', () => {
    expect(importGameState('{bad json').status).toBe('rejected')
    expect(importGameState(JSON.stringify({ schemaVersion: 99 })).status).toBe(
      'rejected'
    )
    expect(
      importGameState(
        JSON.stringify({
          schemaVersion: 3,
          savedAt: 1,
          game: { schemaVersion: 3 },
          settings: {},
        })
      ).status
    ).toBe('rejected')
  })
})
