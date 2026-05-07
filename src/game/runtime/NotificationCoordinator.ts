import {
  createReminderPlan,
  type ReminderPlan,
} from '../application/createReminderPlan'
import type { GameState } from '../domain/gameTypes'
import type { NotificationService } from '../notifications/NotificationService'

type NotificationCoordinatorOptions = {
  now?: () => number
}

export class NotificationCoordinator {
  private readonly now: () => number
  private previousPlan: ReminderPlan | null = null

  constructor(
    private readonly notificationService: NotificationService,
    options: NotificationCoordinatorOptions = {}
  ) {
    this.now = options.now ?? Date.now
  }

  sync(state: GameState, permission: NotificationPermission) {
    if (!state.settings.notificationsEnabled || permission !== 'granted') {
      this.previousPlan = null
      this.notificationService.cancelAll()
      return
    }

    const plan = createReminderPlan(state, this.now(), this.previousPlan)
    this.previousPlan = plan
    this.notificationService.schedule(plan)
  }

  cancelAll() {
    this.previousPlan = null
    this.notificationService.cancelAll()
  }

  dispose() {
    this.cancelAll()
  }
}
