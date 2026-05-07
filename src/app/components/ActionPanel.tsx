import type { GameCommand } from '@/game/rendering/viewModels'

import type { CareActionItem } from '../gameScreenUi'
import { PixelIcon } from './PixelIcon'

type ActionPanelProps = {
  actions: CareActionItem[]
  ariaLabel: string
  className?: string
  onCommand: (command: GameCommand) => void
}

export function ActionPanel({
  actions,
  ariaLabel,
  className = 'action-dock',
  onCommand,
}: ActionPanelProps) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      {actions.map((action) => (
        <button
          className='action-button'
          disabled={Boolean(action.disabledReason)}
          key={action.id}
          title={action.disabledReason ?? undefined}
          type='button'
          onClick={() => onCommand(action.command)}
        >
          <span className='action-button__icon' aria-hidden='true'>
            <PixelIcon name={action.icon} />
          </span>
          <span className='action-button__label'>{action.label}</span>
          {action.disabledReason ? (
            <span className='action-button__reason'>
              {action.disabledReason}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  )
}
