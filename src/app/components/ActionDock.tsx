import type {
  GameCommand,
  InteractionType,
  MenuId,
  PetStage,
  SleepState,
} from '@/game/rendering/viewModels'

type ActionDockProps = {
  petStage: PetStage
  sleepState: SleepState
  disabled?: boolean
  disabledReason?: string | null
  onCommand: (command: GameCommand) => void
}

type ActionButton = {
  interaction: InteractionType
  icon: string
  label: string
}

export function ActionDock({
  petStage,
  sleepState,
  disabled = false,
  disabledReason = null,
  onCommand,
}: ActionDockProps) {
  const sleepAction: ActionButton =
    sleepState === 'sleeping'
      ? { interaction: 'wake', icon: '醒', label: '叫醒' }
      : { interaction: 'sleep', icon: '眠', label: '睡觉' }

  const menus: Array<{ menu: MenuId; icon: string; label: string }> = [
    { menu: 'feeding', icon: '食', label: '喂食' },
    { menu: 'bath', icon: '净', label: '清洁' },
    { menu: 'care', icon: '护', label: '照护' },
    { menu: 'stats', icon: '状', label: '状态' },
    { menu: 'activity', icon: '动', label: '活动' },
    { menu: 'stuff', icon: '物', label: '物品' },
    { menu: 'garden', icon: '园', label: '花园' },
    { menu: 'phone', icon: '话', label: '电话' },
  ]

  return (
    <nav className='action-dock' aria-label='照护操作'>
      {menus.map((action) => (
        <ActionDockButton
          disabledReason={getMenuDisabledReason(
            action.menu,
            petStage,
            disabled,
            disabledReason
          )}
          icon={action.icon}
          key={action.menu}
          label={action.label}
          onClick={() => onCommand({ type: 'openMenu', targetId: action.menu })}
        />
      ))}
      <ActionDockButton
        disabledReason={getCareDisabledReason(
          petStage,
          disabled,
          disabledReason
        )}
        icon={sleepAction.icon}
        label={sleepAction.label}
        onClick={() => onCommand({ type: sleepAction.interaction })}
      />
    </nav>
  )
}

function ActionDockButton({
  disabledReason,
  icon,
  label,
  onClick,
}: {
  disabledReason: string | null
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      className='action-button'
      disabled={Boolean(disabledReason)}
      title={disabledReason ?? undefined}
      type='button'
      onClick={onClick}
    >
      <span className='action-button__icon' aria-hidden='true'>
        {icon}
      </span>
      <span className='action-button__label'>{label}</span>
      {disabledReason ? (
        <span className='action-button__reason'>{disabledReason}</span>
      ) : null}
    </button>
  )
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
