import { describe, expect, it } from 'vitest'

import { advanceGameTime } from '../../game/application/advanceGameTime'
import { createInitialGame } from '../../game/application/createInitialGame'
import type { GameState } from '../../game/domain/gameTypes'

import { applyTestPatch } from './patchers'
import { createTestScenarioState, TEST_SCENARIOS } from './scenarios'

describe('dev TestKit', () => {
  it('creates complete game states for every scenario', () => {
    const now = Date.UTC(2026, 0, 1)

    for (const scenario of TEST_SCENARIOS) {
      const state = scenario.create(now)

      expectCompleteState(state)
      expect(state.catalogs.shop.length).toBeGreaterThan(0)
      expect(state.catalogs.activities.length).toBeGreaterThan(0)
    }
  })

  it('preserves runtime catalogs and profile fields when loading scenarios', () => {
    const now = Date.UTC(2026, 0, 1)
    const current = {
      ...createInitialGame(now),
      profile: {
        ...createInitialGame(now).profile,
        username: 'local-tester',
        friendCode: 'LOCAL-CODE',
      },
    }

    const state = createTestScenarioState('garden-ready', now, current)

    expect(state.catalogs).toBe(current.catalogs)
    expect(state.profile.username).toBe('local-tester')
    expect(state.profile.friendCode).toBe('LOCAL-CODE')
    expect(state.schemaVersion).toBe(current.schemaVersion)
  })

  it('patches only whitelisted state without changing schema, catalogs, or tick time', () => {
    const now = Date.UTC(2026, 0, 1)
    const state = createInitialGame(now)
    const patched = applyTestPatch(state, {
      type: 'pet-stat',
      key: 'hunger',
      value: 91,
    })

    expect(patched.pet.hunger).toBe(91)
    expect(patched.pet.happiness).toBe(state.pet.happiness)
    expect(patched.catalogs).toBe(state.catalogs)
    expect(patched.schemaVersion).toBe(state.schemaVersion)
    expect(patched.lastTickAt).toBe(state.lastTickAt)
  })

  it('uses normal time rules after a scenario is imported', () => {
    const now = Date.UTC(2026, 0, 1)
    const egg = createTestScenarioState('egg', now)
    const hatched = advanceGameTime(egg, now + 4 * 60_000)
    const activity = createTestScenarioState('activity-running', now)
    const completed = advanceGameTime(
      activity,
      (activity.world.activity?.endsAt ?? now) + 1
    )

    expect(hatched.state.pet.stage).toBe('baby')
    expect(hatched.events.some((event) => event.type === 'hatched')).toBe(true)
    expect(completed.state.world.activity).toBeNull()
    expect(
      completed.events.some((event) => event.type === 'activityEnded')
    ).toBe(true)
  })
})

function expectCompleteState(state: GameState) {
  expect(state.version).toBeTypeOf('number')
  expect(state.schemaVersion).toBe(3)
  expect(state.pet.id).toBeTruthy()
  expect(state.resources).toBeTruthy()
  expect(state.world.sceneId).toBeTruthy()
  expect(state.missions.list.length).toBeGreaterThan(0)
  expect(state.garden.plots.length).toBeGreaterThan(0)
  expect(state.records).toBeTruthy()
  expect(state.settings.theme).toBeTruthy()
}
