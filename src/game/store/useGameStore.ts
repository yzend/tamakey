import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import type { GameEvent, GameState } from '../domain/gameTypes'

export type QueuedGameEvent = GameEvent & {
  queueId: number
}

type GameStore = {
  snapshot: GameState | null
  events: QueuedGameEvent[]
  setSnapshot: (snapshot: GameState) => void
  enqueueEvents: (events: GameEvent[]) => void
  ackEvents: (upToQueueId: number) => void
  resetEvents: () => void
}

let nextEventQueueId = 1

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    snapshot: null,
    events: [],
    setSnapshot: (snapshot) => set({ snapshot }),
    enqueueEvents: (events) => {
      if (events.length === 0) return

      set((state) => ({
        events: [
          ...state.events,
          ...events.map((event) => ({
            ...event,
            queueId: nextEventQueueId++,
          })),
        ],
      }))
    },
    ackEvents: (upToQueueId) =>
      set((state) => ({
        events: state.events.filter((event) => event.queueId > upToQueueId),
      })),
    resetEvents: () => set({ events: [] }),
  }))
)
