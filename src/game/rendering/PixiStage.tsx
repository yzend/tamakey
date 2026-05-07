// 渲染模块：挂载并管理 Pixi 游戏舞台的 React 桥接层。
import { useEffect, useRef, useState } from 'react'
import { Application } from 'pixi.js'

import { PixiGameRenderer } from './PixiGameRenderer'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './renderingConstants'
import type { PetViewModel, QueuedGameEvent } from './viewModels'

type PixiStageProps = {
  viewModel: PetViewModel
  events?: QueuedGameEvent[]
  ackEvents?: (queueId: number) => void
}

export function PixiStage({
  viewModel,
  events = [],
  ackEvents,
}: PixiStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<PixiGameRenderer | null>(null)
  const latestViewModelRef = useRef(viewModel)
  const [rendererReady, setRendererReady] = useState(false)

  useEffect(() => {
    latestViewModelRef.current = viewModel
    rendererRef.current?.setViewModel(viewModel)
  }, [viewModel])

  useEffect(() => {
    if (!hostRef.current) return

    let disposed = false
    let initialized = false
    let destroyed = false
    const app = new Application()

    const destroyApp = () => {
      if (!initialized || destroyed) return

      destroyed = true
      app.destroy(true)
    }

    async function start() {
      await app.init({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        background: '#d8e7b5',
        antialias: true,
        resolution: 1,
        autoDensity: false,
      })
      initialized = true

      if (disposed || !hostRef.current) {
        destroyApp()
        return
      }

      app.canvas.setAttribute('aria-label', 'Tamakey pixel pet screen')
      hostRef.current.appendChild(app.canvas)
      rendererRef.current = new PixiGameRenderer(app)
      rendererRef.current.setViewModel(latestViewModelRef.current)
      setRendererReady(true)
    }

    void start()

    return () => {
      disposed = true
      setRendererReady(false)
      rendererRef.current?.destroy()
      rendererRef.current = null
      destroyApp()
    }
  }, [])

  useEffect(() => {
    if (!rendererReady || !rendererRef.current || events.length === 0) return

    for (const event of events) {
      rendererRef.current.handleGameEvent(event)
    }

    const lastProcessedId = Math.max(...events.map((event) => event.queueId))
    ackEvents?.(lastProcessedId)
  }, [events, ackEvents, rendererReady])

  return <div className='pixel-screen__stage' ref={hostRef} />
}
