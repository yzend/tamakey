import type { GameWorkerRequest, GameWorkerResponse } from './protocol'

export type GameWorkerClient = {
  post: (message: GameWorkerRequest) => void
  subscribe: (onMessage: (message: GameWorkerResponse) => void) => () => void
  dispose: () => void
}

export function createGameWorkerClient(): GameWorkerClient {
  const worker = new Worker(new URL('./game.worker.ts', import.meta.url), {
    type: 'module',
  })

  return {
    post(message) {
      worker.postMessage(message)
    },

    subscribe(onMessage) {
      const handler = (event: MessageEvent<GameWorkerResponse>) => {
        onMessage(event.data)
      }
      const errorHandler = (event: ErrorEvent) => {
        onMessage({
          type: 'ERROR',
          message: event.message || '工作线程运行错误',
          recoverable: false,
        })
      }
      const messageErrorHandler = () => {
        onMessage({
          type: 'ERROR',
          message: '工作线程消息序列化失败',
          recoverable: true,
        })
      }

      worker.addEventListener('message', handler)
      worker.addEventListener('error', errorHandler)
      worker.addEventListener('messageerror', messageErrorHandler)

      return () => {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', errorHandler)
        worker.removeEventListener('messageerror', messageErrorHandler)
      }
    },

    dispose() {
      worker.terminate()
    },
  }
}
