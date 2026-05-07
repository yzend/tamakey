import {
  applyCarePressure,
  applyActivityCompletion,
  applyDailyMissionReset,
  applyDeath,
  applyEvolution,
  applyGardenProgress,
  applyHealthPressure,
  applyMood,
  applyNaturalDecay,
  applyPoopGeneration,
  applySicknessPressure,
  applyWantAndMisbehavior,
  applySleep,
  incrementAge,
} from '../domain/rules'
import type { AdvanceResult, GameEvent, GameState } from '../domain/gameTypes'

export function advanceGameTime(state: GameState, now: number): AdvanceResult {
  if (state.pet.stage === 'dead') {
    return {
      state: {
        ...state,
        lastTickAt: now,
      },
      events: [],
    }
  }

  const deltaMs = Math.max(0, now - state.lastTickAt)
  return advanceGameTimeByDelta(state, deltaMs / 1000, now)
}

export function advanceGameTimeByDelta(
  state: GameState,
  deltaSeconds: number,
  now: number
): AdvanceResult {
  if (state.pet.stage === 'dead') {
    return {
      state: {
        ...state,
        lastTickAt: now,
      },
      events: [],
    }
  }

  const events: GameEvent[] = []

  let next = incrementAge(state, Math.max(0, deltaSeconds))
  next = applyDailyMissionReset(next, now)
  next = applyNaturalDecay(next, Math.max(0, deltaSeconds))
  next = applySleep(next, Math.max(0, deltaSeconds))
  next = applyPoopGeneration(next, Math.max(0, deltaSeconds), events, now)
  next = applyCarePressure(next, Math.max(0, deltaSeconds))
  next = applySicknessPressure(next, events, now)
  next = applyHealthPressure(next, Math.max(0, deltaSeconds))
  next = applyEvolution(next, events, now)
  next = applyGardenProgress(next, events, now)
  next = applyActivityCompletion(next, events, now)
  next = applyWantAndMisbehavior(next, events, now)
  next = applyMood(next)
  next = applyDeath(next, events, now)

  return {
    state: {
      ...next,
      lastTickAt: now,
    },
    events,
  }
}
