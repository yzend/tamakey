import { PixelIcon, type PixelIconName } from './PixelIcon'

export type FlipPanelTab = 'actions' | 'stats' | 'system'

type FlipPanelTabsProps = {
  activeTab: FlipPanelTab
  onTabChange: (tab: FlipPanelTab) => void
}

const tabs: Array<{ id: FlipPanelTab; icon: PixelIconName; label: string }> = [
  { id: 'actions', icon: 'spark', label: '动作' },
  { id: 'stats', icon: 'stats', label: '状态' },
  { id: 'system', icon: 'settings', label: '系统' },
]

export function FlipPanelTabs({ activeTab, onTabChange }: FlipPanelTabsProps) {
  return (
    <div className='flip-panel-tabs' role='tablist' aria-label='玩具翻页面板'>
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          className='flip-panel-tab'
          key={tab.id}
          role='tab'
          type='button'
          onClick={() => onTabChange(tab.id)}
        >
          <PixelIcon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
