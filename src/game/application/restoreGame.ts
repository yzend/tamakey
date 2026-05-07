import { MAX_OFFLINE_MS } from '../domain/constants'
import type {
  LoadSaveResult,
  RestoreResult,
  SaveData,
} from '../domain/gameTypes'
import { hydrateSavedGame } from '../persistence/saveSchema'
import { advanceGameTimeByDelta } from './advanceGameTime'
import { createInitialGame } from './createInitialGame'
import { summarizeOfflineProgress } from './summarizeOfflineProgress'

export function restoreGame(
  loadResult: LoadSaveResult,
  now: number
): RestoreResult {
  if (loadResult.status === 'empty') {
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: false,
    }
  }

  if (loadResult.status === 'corrupt') {
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: true,
    }
  }

  try {
    const migrated = migrateSave(loadResult.data)
    const gameState = hydrateSavedGame(migrated)
    const elapsedMs = Math.max(0, now - gameState.lastTickAt)
    const simulatedMs = Math.min(elapsedMs, MAX_OFFLINE_MS)
    const result = advanceGameTimeByDelta(gameState, simulatedMs / 1000, now)

    return {
      state: result.state,
      events: result.events,
      offlineSummary:
        elapsedMs > 0
          ? summarizeOfflineProgress(
              gameState,
              result.state,
              elapsedMs,
              simulatedMs
            )
          : null,
      recoveredFromCorruptSave: false,
    }
  } catch (error) {
    globalThis.console.warn('存档迁移或恢复失败', error)
    return {
      state: createInitialGame(now),
      events: [],
      offlineSummary: null,
      recoveredFromCorruptSave: true,
    }
  }
}

export function migrateSave(save: SaveData): SaveData {
  if (save.schemaVersion !== 3) {
    throw new Error('不支持的存档结构')
  }

  return save
}
