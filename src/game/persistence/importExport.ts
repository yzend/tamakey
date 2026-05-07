import type { GameState } from '../domain/gameTypes'
import {
  createSaveData,
  hydrateSavedGame,
  validateSaveData,
} from './saveSchema'

export type ImportSaveResult =
  | { status: 'ok'; state: GameState }
  | { status: 'rejected'; reason: string }

export function exportGameState(state: GameState, now = Date.now()): string {
  return JSON.stringify(createSaveData(state, now), null, 2)
}

export function importGameState(raw: string): ImportSaveResult {
  try {
    const parsed = JSON.parse(raw)
    const save = validateSaveData(parsed)
    return { status: 'ok', state: hydrateSavedGame(save) }
  } catch (error) {
    return {
      status: 'rejected',
      reason: error instanceof Error ? error.message : '存档数据无效',
    }
  }
}
