import type {
  GameCommand,
  InteractionType,
  MenuId,
  PetScreenSnapshot,
  PetStage,
  SleepState,
} from '@/game/rendering/viewModels'

import type { PixelIconName } from './components/PixelIcon'
import type { StatMeterTone } from './components/StatMeter'

export type CareActionItem = {
  id: string
  icon: PixelIconName
  label: string
  command: GameCommand
  disabledReason: string | null
}

export type ResourceItem = {
  emoji: string
  icon: PixelIconName
  label: string
  value: number
}

export type StatItem = {
  icon: PixelIconName
  label: string
  tone: StatMeterTone
  value: number
}

type BuildCareActionsInput = {
  petStage: PetStage
  sleepState: SleepState
  disabled: boolean
  disabledReason: string | null
}

type ActionButton = {
  interaction: InteractionType
  icon: PixelIconName
  label: string
}

export function buildCareActions({
  petStage,
  sleepState,
  disabled,
  disabledReason,
}: BuildCareActionsInput): CareActionItem[] {
  const sleepAction: ActionButton =
    sleepState === 'sleeping'
      ? { interaction: 'wake', icon: 'sun', label: '叫醒' }
      : { interaction: 'sleep', icon: 'moon', label: '睡觉' }

  const menus: Array<{ menu: MenuId; icon: PixelIconName; label: string }> = [
    { menu: 'feeding', icon: 'feed', label: '喂食' },
    { menu: 'bath', icon: 'bath', label: '清洁' },
    { menu: 'care', icon: 'care', label: '照护' },
    { menu: 'stats', icon: 'stats', label: '状态' },
    { menu: 'activity', icon: 'arcade', label: '活动' },
    { menu: 'stuff', icon: 'stuff', label: '物品' },
    { menu: 'garden', icon: 'garden', label: '花园' },
    { menu: 'phone', icon: 'phone', label: '电话' },
  ]

  return [
    ...menus.map((action) => ({
      id: action.menu,
      icon: action.icon,
      label: action.label,
      command: {
        type: 'openMenu',
        targetId: action.menu,
      } satisfies GameCommand,
      disabledReason: getMenuDisabledReason(
        action.menu,
        petStage,
        disabled,
        disabledReason
      ),
    })),
    {
      id: sleepAction.interaction,
      icon: sleepAction.icon,
      label: sleepAction.label,
      command: { type: sleepAction.interaction },
      disabledReason: getCareDisabledReason(petStage, disabled, disabledReason),
    },
  ]
}

export function getResourceItems(snapshot: PetScreenSnapshot): ResourceItem[] {
  return [
    { emoji: '💰', icon: 'coin', label: '币', value: snapshot.coins },
    { emoji: '💊', icon: 'medicine', label: '药', value: snapshot.medicine },
    { emoji: '🍙', icon: 'feed', label: '饭', value: snapshot.foodCount },
  ]
}

export function getStatItems(snapshot: PetScreenSnapshot): StatItem[] {
  return [
    {
      icon: 'feed',
      label: '饥饿',
      tone: 'hunger',
      value: snapshot.stats.hunger,
    },
    {
      icon: 'heart',
      label: '开心',
      tone: 'happy',
      value: snapshot.stats.happiness,
    },
    {
      icon: 'clean',
      label: '清洁',
      tone: 'clean',
      value: snapshot.stats.cleanliness,
    },
    {
      icon: 'spark',
      label: '精力',
      tone: 'sleep',
      value: snapshot.stats.energy,
    },
    {
      icon: 'poop',
      label: '如厕',
      tone: 'sleep',
      value: snapshot.stats.bladder,
    },
    {
      icon: 'medicine',
      label: '健康',
      tone: 'sick',
      value: snapshot.stats.health,
    },
  ]
}

function getMenuDisabledReason(
  menu: MenuId,
  petStage: PetStage,
  disabled: boolean,
  disabledReason: string | null
) {
  if (disabled && disabledReason !== '活动进行中') {
    return disabledReason ?? '运行时不可用'
  }

  if (petStage === 'egg' && menu !== 'stats' && menu !== 'phone') {
    return '蛋阶段锁定'
  }

  if (petStage === 'dead' && menu !== 'phone' && menu !== 'stats') {
    return '仅可恢复'
  }

  if (disabled) return disabledReason ?? '运行时不可用'

  return null
}

function getCareDisabledReason(
  petStage: PetStage,
  disabled: boolean,
  disabledReason: string | null
) {
  if (disabled) return disabledReason ?? '运行时不可用'
  if (petStage === 'egg') return '等待孵化'
  if (petStage === 'dead') return '仅可恢复'
  return null
}
