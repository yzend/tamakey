import type { GameState } from '../domain/gameTypes'
import type { SaveRepository } from '../persistence/SaveRepository'
import { createSaveData } from '../persistence/saveSchema'

const DEFAULT_THROTTLE_MS = 15_000

type SaveCoordinatorOptions = {
  throttleMs?: number
  now?: () => number
}

export class SaveCoordinator {
  private readonly throttleMs: number
  private readonly now: () => number
  private pendingState: GameState | null = null
  private lastSavedAt = 0
  private timerId: number | null = null

  constructor(
    private readonly repository: SaveRepository,
    options: SaveCoordinatorOptions = {}
  ) {
    this.throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS
    this.now = options.now ?? Date.now
  }

  saveNow(state: GameState) {
    this.clearTimer()
    this.pendingState = null
    this.write(state)
  }

  saveThrottled(state: GameState) {
    this.pendingState = state

    const elapsedMs = this.now() - this.lastSavedAt
    if (elapsedMs >= this.throttleMs) {
      this.flush()
      return
    }

    if (this.timerId !== null) return

    this.timerId = window.setTimeout(() => {
      this.timerId = null
      this.flush()
    }, this.throttleMs - elapsedMs)
  }

  flush() {
    if (!this.pendingState) return

    const state = this.pendingState
    this.pendingState = null
    this.write(state)
  }

  dispose() {
    this.flush()
    this.clearTimer()
  }

  private write(state: GameState) {
    const savedAt = this.now()
    const data = createSaveData(state, savedAt)

    void this.repository.save(data)
    this.lastSavedAt = savedAt
  }

  private clearTimer() {
    if (this.timerId === null) return

    window.clearTimeout(this.timerId)
    this.timerId = null
  }
}
