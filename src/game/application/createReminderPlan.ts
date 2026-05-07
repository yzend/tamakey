import type { GameState, Reminder, ReminderPlan } from '../domain/gameTypes'

export type { Reminder, ReminderPlan } from '../domain/gameTypes'

export function createReminderPlan(
  state: GameState,
  now: number,
  previousPlan: ReminderPlan | null = null
): ReminderPlan {
  const reminders: Reminder[] = []

  if (state.pet.stage === 'dead') return { reminders }

  if (state.pet.hunger > 70) {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'hungry-soon',
        delayMs: 5 * 60 * 1000,
        now,
        title: 'Tamakey 饿了',
        body: '回来喂一份正餐吧。',
        reason: 'hungry',
      })
    )
  }

  if (state.world.poopCount >= 2 || state.pet.cleanliness < 30) {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'dirty-room',
        delayMs: 10 * 60 * 1000,
        now,
        title: '房间需要打扫',
        body: '脏乱的房间可能会让 Tamakey 生病。',
        reason: 'dirty',
      })
    )
  }

  if (state.pet.sickness !== 'none') {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'sick-care',
        delayMs: 5 * 60 * 1000,
        now,
        title: 'Tamakey 需要药品',
        body: '在健康下降前照顾好病情。',
        reason: 'sick',
      })
    )
  }

  if (state.pet.energy >= 95 && state.pet.sleepState === 'sleeping') {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'energy-full',
        delayMs: 2 * 60 * 1000,
        now,
        title: 'Tamakey 已经休息好了',
        body: '回来时叫醒 Tamakey 吧。',
        reason: 'energyFull',
      })
    )
  }

  if (state.pet.happiness < 30 && state.pet.sleepState === 'awake') {
    reminders.push(
      createStableReminder(previousPlan, {
        id: 'lonely-soon',
        delayMs: 15 * 60 * 1000,
        now,
        title: 'Tamakey 有点孤单',
        body: '陪它玩一会儿会有帮助。',
        reason: 'lonely',
      })
    )
  }

  return { reminders }
}

function createStableReminder(
  previousPlan: ReminderPlan | null,
  input: Omit<Reminder, 'at'> & { delayMs: number; now: number }
): Reminder {
  const previous = previousPlan?.reminders.find(
    (reminder) => reminder.id === input.id && reminder.reason === input.reason
  )

  return {
    id: input.id,
    at: previous?.at ?? input.now + input.delayMs,
    title: input.title,
    body: input.body,
    reason: input.reason,
  }
}
