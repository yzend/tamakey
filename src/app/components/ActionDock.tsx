import type { GameCommand } from '@/game/rendering/viewModels'

import type { CareActionItem } from '../gameScreenUi'
import { ActionPanel } from './ActionPanel'

type ActionDockProps = {
  actions: CareActionItem[]
  onCommand: (command: GameCommand) => void
}

export function ActionDock({ actions, onCommand }: ActionDockProps) {
  return (
    <ActionPanel
      actions={actions}
      ariaLabel='照护操作'
      className='action-dock action-dock--desktop'
      onCommand={onCommand}
    />
  )
}
