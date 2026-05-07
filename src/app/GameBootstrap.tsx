import { useCallback, useEffect, useRef, useState } from 'react'

import { OnboardingPage } from './AuthFlow'
import { GameScreen } from './GameScreen'
import { restoreGame } from '../game/application/restoreGame'
import { createInitialGame } from '../game/application/createInitialGame'
import type { GameEvent, GameState } from '../game/domain/gameTypes'
import { NotificationService } from '../game/notifications/NotificationService'
import { HybridSaveRepository } from '../game/persistence/HybridSaveRepository'
import { NotificationCoordinator } from '../game/runtime/NotificationCoordinator'
import { SaveCoordinator } from '../game/runtime/SaveCoordinator'
import { useGameStore } from '../game/store/useGameStore'
import { useRuntimeStore } from '../game/store/useRuntimeStore'
import type { GameWorkerResponse } from '../game/worker/protocol'
import {
  createGameWorkerClient,
  type GameWorkerClient,
} from '../game/worker/workerClient'
import type { LocalSession } from './session'

const TICK_INTERVAL_MS = 5_000

type PendingInitialGame = {
  state: GameState
  events: GameEvent[]
  startupNotice: string | null
}

type GameBootstrapProps = {
  session: LocalSession
  skipOnboarding?: boolean
}

export function GameBootstrap({
  session,
  skipOnboarding = false,
}: GameBootstrapProps) {
  const notificationServiceRef = useRef<NotificationService | null>(null)
  const workerClientRef = useRef<GameWorkerClient | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [pendingInitialGame, setPendingInitialGame] =
    useState<PendingInitialGame | null>(null)

  useEffect(() => {
    const runtimeStore = useRuntimeStore.getState()
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      runtimeStore.setStartupNotice('当前浏览器无法使用离线缓存。')
      return
    }

    let refreshing = false
    let shouldReloadAfterUpdate = false

    const applyWaitingWorker = async () => {
      shouldReloadAfterUpdate = true
      const registration = await navigator.serviceWorker.getRegistration()
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    }

    const markUpdateAvailable = () => {
      const store = useRuntimeStore.getState()
      store.setPwaUpdateAvailable(true)
      store.setApplyPwaUpdate(() => {
        void applyWaitingWorker()
      })
    }

    const inspectRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        markUpdateAvailable()
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return

        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            markUpdateAvailable()
          }
        })
      })
    }

    const handleControllerChange = () => {
      if (!shouldReloadAfterUpdate || refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    )
    navigator.serviceWorker.ready
      .then((registration) => {
        runtimeStore.setPwaOfflineReady(true)
        inspectRegistration(registration)
        return registration.update()
      })
      .catch(() => {
        useRuntimeStore
          .getState()
          .setStartupNotice('离线缓存设置失败，游戏仍可运行。')
      })

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (registration) inspectRegistration(registration)
      })
      .catch(() => undefined)

    runtimeStore.setApplyPwaUpdate(() => {
      void applyWaitingWorker()
    })

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      )
    }
  }, [])

  useEffect(() => {
    let disposed = false
    let cleanup: (() => void) | null = null

    const start = async () => {
      const repository = new HybridSaveRepository()
      const now = Date.now()
      const loadResult = pendingInitialGame ? null : await repository.load()

      if (
        !pendingInitialGame &&
        loadResult?.status === 'empty' &&
        !skipOnboarding
      ) {
        if (!disposed) setNeedsOnboarding(true)
        return
      }

      let restoredState: GameState
      let restoredEvents: GameEvent[]
      let startupNotice: string | null

      if (pendingInitialGame) {
        restoredState = pendingInitialGame.state
        restoredEvents = pendingInitialGame.events
        startupNotice = pendingInitialGame.startupNotice
      } else {
        const restored = restoreGame(
          loadResult ?? {
            status: 'empty',
            data: null,
          },
          now
        )
        restoredState = restored.state
        restoredEvents = restored.events
        startupNotice = createStartupNotice(restored)
      }

      const saveCoordinator = new SaveCoordinator(repository)
      const notificationService = new NotificationService()
      const notificationCoordinator = new NotificationCoordinator(
        notificationService
      )
      const workerClient = createGameWorkerClient()

      if (disposed) {
        saveCoordinator.dispose()
        notificationCoordinator.dispose()
        workerClient.dispose()
        return
      }

      notificationServiceRef.current = notificationService
      workerClientRef.current = workerClient
      setNeedsOnboarding(false)

      const gameStore = useGameStore.getState()
      const runtimeStore = useRuntimeStore.getState()

      gameStore.setSnapshot(restoredState)
      gameStore.enqueueEvents(restoredEvents)
      runtimeStore.setWorkerClient(workerClient)
      runtimeStore.setWorkerReady(false)
      runtimeStore.setLastWorkerError(null)
      runtimeStore.setNotificationPermission(getNotificationPermission())
      runtimeStore.setStartupNotice(startupNotice)

      const unsubscribeWorker = workerClient.subscribe((message) => {
        handleWorkerMessage(message, saveCoordinator, notificationCoordinator)
      })

      workerClient.post({
        type: 'INIT',
        state: restoredState,
        now,
      })

      const unsubscribeSnapshot = useGameStore.subscribe(
        (state) => state.snapshot,
        (snapshot) => {
          if (!snapshot) return

          notificationCoordinator.sync(
            snapshot,
            useRuntimeStore.getState().notificationPermission
          )
        }
      )

      const unsubscribePermission = useRuntimeStore.subscribe(
        (state) => state.notificationPermission,
        (permission) => {
          const snapshot = useGameStore.getState().snapshot
          if (!snapshot) return

          notificationCoordinator.sync(snapshot, permission)
        }
      )

      const tickIntervalId = window.setInterval(() => {
        workerClient.post({ type: 'TICK', now: Date.now() })
      }, TICK_INTERVAL_MS)

      const handleVisibilityChange = () => {
        const focused = !document.hidden
        useRuntimeStore.getState().setFocused(focused)

        const snapshot = useGameStore.getState().snapshot
        if (!focused && snapshot) {
          saveCoordinator.saveNow(snapshot)
        }
      }

      const handleBeforeUnload = () => {
        const snapshot = useGameStore.getState().snapshot
        if (snapshot) {
          saveCoordinator.saveNow(snapshot)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('beforeunload', handleBeforeUnload)

      cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.clearInterval(tickIntervalId)
        unsubscribePermission()
        unsubscribeSnapshot()
        unsubscribeWorker()
        notificationCoordinator.dispose()
        saveCoordinator.dispose()
        workerClient.dispose()
        useRuntimeStore.getState().setWorkerClient(null)
        useRuntimeStore.getState().setWorkerReady(false)
        notificationServiceRef.current = null
        workerClientRef.current = null
      }
    }

    void start()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [pendingInitialGame, session.caretakerName, skipOnboarding])

  const enableNotifications = useCallback(async () => {
    const service = notificationServiceRef.current
    const workerClient = workerClientRef.current
    if (!service || !workerClient) return

    const permission = await service.requestPermission()
    useRuntimeStore.getState().setNotificationPermission(permission)
    const enabled = permission === 'granted'

    workerClient.post({
      type: 'SET_NOTIFICATIONS_ENABLED',
      enabled,
      now: Date.now(),
    })

    if (enabled) {
      service.show({
        id: 'notifications-enabled',
        at: Date.now(),
        title: 'Tamakey 提醒已开启',
        body: '浏览器可运行时会尽力发送照护提醒。',
        reason: 'lonely',
      })
    }
  }, [])

  const disableNotifications = useCallback(() => {
    const workerClient = workerClientRef.current
    if (!workerClient) return

    workerClient.post({
      type: 'SET_NOTIFICATIONS_ENABLED',
      enabled: false,
      now: Date.now(),
    })
  }, [])

  const completeOnboarding = useCallback(
    (petName: string) => {
      const now = Date.now()
      setPendingInitialGame({
        state: createInitialGame(now, {
          caretakerName: session.caretakerName,
          petName,
        }),
        events: [],
        startupNotice: '欢迎加入，第一颗蛋已经准备好了。',
      })
    },
    [session.caretakerName]
  )

  if (needsOnboarding) {
    return (
      <OnboardingPage
        caretakerName={session.caretakerName}
        onComplete={completeOnboarding}
      />
    )
  }

  return (
    <GameScreen
      onEnableNotifications={enableNotifications}
      onDisableNotifications={disableNotifications}
    />
  )
}

function handleWorkerMessage(
  message: GameWorkerResponse,
  saveCoordinator: SaveCoordinator,
  notificationCoordinator: NotificationCoordinator
) {
  const gameStore = useGameStore.getState()
  const runtimeStore = useRuntimeStore.getState()

  if (message.type === 'ERROR') {
    runtimeStore.setLastWorkerError(message.message)
    if (!message.recoverable) {
      runtimeStore.setWorkerReady(false)
    }
    return
  }

  runtimeStore.setLastWorkerError(null)

  if (message.type === 'READY') {
    runtimeStore.setWorkerReady(true)
    gameStore.setSnapshot(message.state)
    saveCoordinator.saveThrottled(message.state)
    notificationCoordinator.sync(
      message.state,
      runtimeStore.notificationPermission
    )
    return
  }

  gameStore.setSnapshot(message.state)
  gameStore.enqueueEvents(message.events)
  notificationCoordinator.sync(
    message.state,
    runtimeStore.notificationPermission
  )

  if (message.events.some((event) => event.type === 'interactionApplied')) {
    saveCoordinator.saveNow(message.state)
    return
  }

  saveCoordinator.saveThrottled(message.state)
}

function getNotificationPermission(): NotificationPermission {
  return typeof Notification === 'undefined'
    ? 'default'
    : Notification.permission
}

function createStartupNotice(
  restored: ReturnType<typeof restoreGame>
): string | null {
  if (restored.recoveredFromCorruptSave) {
    return '存档无法恢复，已创建新的宠物。'
  }

  const messages = restored.offlineSummary?.messages ?? []
  if (messages.length === 0) return null

  return messages.join(' ')
}
