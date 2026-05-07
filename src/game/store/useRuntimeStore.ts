import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import type { GameWorkerClient } from '../worker/workerClient'

type RuntimeStore = {
  workerClient: GameWorkerClient | null
  workerReady: boolean
  focused: boolean
  notificationPermission: NotificationPermission
  lastWorkerError: string | null
  startupNotice: string | null
  pwaUpdateAvailable: boolean
  pwaOfflineReady: boolean
  applyPwaUpdate: (() => void) | null
  setWorkerClient: (client: GameWorkerClient | null) => void
  setWorkerReady: (ready: boolean) => void
  setFocused: (focused: boolean) => void
  setNotificationPermission: (permission: NotificationPermission) => void
  setLastWorkerError: (message: string | null) => void
  setStartupNotice: (message: string | null) => void
  setPwaUpdateAvailable: (available: boolean) => void
  setPwaOfflineReady: (ready: boolean) => void
  setApplyPwaUpdate: (apply: (() => void) | null) => void
}

export const useRuntimeStore = create<RuntimeStore>()(
  subscribeWithSelector((set) => ({
    workerClient: null,
    workerReady: false,
    focused: typeof document === 'undefined' ? true : !document.hidden,
    notificationPermission:
      typeof Notification === 'undefined' ? 'default' : Notification.permission,
    lastWorkerError: null,
    startupNotice: null,
    pwaUpdateAvailable: false,
    pwaOfflineReady: false,
    applyPwaUpdate: null,
    setWorkerClient: (workerClient) => set({ workerClient }),
    setWorkerReady: (workerReady) => set({ workerReady }),
    setFocused: (focused) => set({ focused }),
    setNotificationPermission: (notificationPermission) =>
      set({ notificationPermission }),
    setLastWorkerError: (lastWorkerError) => set({ lastWorkerError }),
    setStartupNotice: (startupNotice) => set({ startupNotice }),
    setPwaUpdateAvailable: (pwaUpdateAvailable) => set({ pwaUpdateAvailable }),
    setPwaOfflineReady: (pwaOfflineReady) => set({ pwaOfflineReady }),
    setApplyPwaUpdate: (applyPwaUpdate) => set({ applyPwaUpdate }),
  }))
)
