import type {
  GameCommand,
  GameEvent,
  GameState,
  InteractionType,
} from '../domain/gameTypes'

export type GameWorkerRequest =
  | { type: 'INIT'; state: GameState; now: number }
  | { type: 'TICK'; now: number }
  | {
      type: 'INTERACT'
      interaction: InteractionType
      command?: GameCommand
      now: number
    }
  | { type: 'IMPORT_STATE'; state: GameState; now: number }
  | { type: 'RESET'; now: number }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; enabled: boolean; now: number }

export type GameWorkerResponse =
  | { type: 'READY'; state: GameState }
  | { type: 'SYNC'; state: GameState; events: GameEvent[] }
  | { type: 'ERROR'; message: string; recoverable: boolean }
