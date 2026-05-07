import type { ReactNode } from 'react'

import type { GameCommand } from '@/game/rendering/viewModels'

import type { CareActionItem, ResourceItem, StatItem } from '../gameScreenUi'
import { ActionPanel } from './ActionPanel'
import { type FlipPanelTab, FlipPanelTabs } from './FlipPanelTabs'
import { StatsPanel } from './StatsPanel'

type MobileFlipPanelProps = {
  actions: CareActionItem[]
  activeTab: FlipPanelTab
  menuPanel: ReactNode
  resources: ResourceItem[]
  stats: StatItem[]
  systemPanel: ReactNode
  hasMenuContent: boolean
  onCommand: (command: GameCommand) => void
  onTabChange: (tab: FlipPanelTab) => void
}

export function MobileFlipPanel({
  actions,
  activeTab,
  menuPanel,
  resources,
  stats,
  systemPanel,
  hasMenuContent,
  onCommand,
  onTabChange,
}: MobileFlipPanelProps) {
  return (
    <section className='mobile-flip-panel' aria-label='翻页面板'>
      <FlipPanelTabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className='mobile-flip-panel__body'>
        {hasMenuContent ? (
          <div className='mobile-flip-panel__menu'>{menuPanel}</div>
        ) : (
          <>
            <div
              className='mobile-flip-panel__page'
              hidden={activeTab !== 'actions'}
              role='tabpanel'
            >
              <ActionPanel
                actions={actions}
                ariaLabel='手机照护操作'
                className='action-dock action-dock--mobile'
                onCommand={onCommand}
              />
            </div>
            <div
              className='mobile-flip-panel__page'
              hidden={activeTab !== 'stats'}
              role='tabpanel'
            >
              <StatsPanel resources={resources} stats={stats} />
            </div>
            <div
              className='mobile-flip-panel__page'
              hidden={activeTab !== 'system'}
              role='tabpanel'
            >
              {systemPanel}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
