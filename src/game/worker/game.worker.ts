import { advanceGameTime } from '../application/advanceGameTime'
import { applyInteraction } from '../application/applyInteraction'
import { createInitialGame } from '../application/createInitialGame'
import type { GameState } from '../domain/gameTypes'
import type { GameWorkerRequest, GameWorkerResponse } from './protocol'

let currentState: GameState | null = null

self.onmessage = (event: MessageEvent<GameWorkerRequest>) => {
  try {
    const message = event.data

    if (message.type === 'INIT') {
      currentState = message.state
      post({ type: 'READY', state: currentState })
      return
    }

    if (message.type === 'RESET') {
      currentState = createInitialGame(message.now)
      post({ type: 'SYNC', state: currentState, events: [] })
      return
    }

    if (message.type === 'IMPORT_STATE') {
      currentState = message.state
      post({
        type: 'SYNC',
        state: currentState,
        events: [{ type: 'saveImported', at: message.now }],
      })
      return
    }

    if (!currentState) {
      post({
        type: 'ERROR',
        message: '工作线程尚未初始化',
        recoverable: true,
      })
      return
    }

    if (message.type === 'TICK') {
      const result = advanceGameTime(currentState, message.now)
      currentState = result.state
      post({ type: 'SYNC', state: result.state, events: result.events })
      return
    }

    if (message.type === 'INTERACT') {
      const advanceResult = advanceGameTime(currentState, message.now)
      const interactionResult = applyInteraction(
        advanceResult.state,
        message.command ?? message.interaction,
        message.now
      )
      currentState = interactionResult.state
      post({
        type: 'SYNC',
        state: interactionResult.state,
        events: [...advanceResult.events, ...interactionResult.events],
      })
      return
    }

    if (message.type === 'SET_NOTIFICATIONS_ENABLED') {
      const advanceResult = advanceGameTime(currentState, message.now)
      currentState = {
        ...advanceResult.state,
        settings: {
          ...advanceResult.state.settings,
          notificationsEnabled: message.enabled,
        },
      }
      post({ type: 'SYNC', state: currentState, events: advanceResult.events })
    }
  } catch (error) {
    post({
      type: 'ERROR',
      message: error instanceof Error ? error.message : '未知工作线程错误',
      recoverable: false,
    })
  }
}

function post(message: GameWorkerResponse) {
  self.postMessage(message)
}
