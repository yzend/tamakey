import type { GameState } from '../domain/gameTypes'
import type { QueuedGameEvent } from './useGameStore'

export const selectGameSnapshot = (state: { snapshot: GameState | null }) =>
  state.snapshot

export const selectQueuedEvents = (state: { events: QueuedGameEvent[] }) =>
  state.events

export const selectPet = (state: { snapshot: GameState | null }) =>
  state.snapshot?.pet ?? null

export const selectResources = (state: { snapshot: GameState | null }) =>
  state.snapshot?.resources ?? null

export const selectWorld = (state: { snapshot: GameState | null }) =>
  state.snapshot?.world ?? null

export const selectSettings = (state: { snapshot: GameState | null }) =>
  state.snapshot?.settings ?? null

export const selectNotificationsEnabled = (state: {
  snapshot: GameState | null
}) => state.snapshot?.settings.notificationsEnabled ?? false

export const selectWorkerClient = <T extends { workerClient: unknown }>(
  state: T
) => state.workerClient

export const selectWorkerReady = (state: { workerReady: boolean }) =>
  state.workerReady

export const selectFocused = (state: { focused: boolean }) => state.focused

export const selectNotificationPermission = (state: {
  notificationPermission: NotificationPermission
}) => state.notificationPermission
