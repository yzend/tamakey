import type { Reminder, ReminderPlan } from '../application/createReminderPlan'

export class NotificationService {
  private readonly timerIds = new Map<string, number>()

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    try {
      return await Notification.requestPermission()
    } catch {
      return 'denied'
    }
  }

  schedule(plan: ReminderPlan): void {
    this.cancelAll()

    if (!this.canShowNotifications()) {
      return
    }

    for (const reminder of plan.reminders) {
      const delay = Math.max(0, reminder.at - Date.now())
      const timerId = window.setTimeout(() => {
        this.show(reminder)
      }, delay)

      this.timerIds.set(reminder.id, timerId)
    }
  }

  cancelAll(): void {
    for (const timerId of this.timerIds.values()) {
      window.clearTimeout(timerId)
    }

    this.timerIds.clear()
  }

  show(reminder: Reminder): void {
    if (!this.canShowNotifications()) {
      return
    }

    try {
      new Notification(reminder.title, {
        body: reminder.body,
        tag: reminder.id,
      })
    } catch {
      return
    }
  }

  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }

    return Notification.permission
  }

  isSupported(): boolean {
    return 'Notification' in window
  }

  private canShowNotifications(): boolean {
    return this.isSupported() && Notification.permission === 'granted'
  }
}
