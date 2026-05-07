import type { GameCommand } from '@/game/rendering/viewModels'

import { NotificationControl } from './NotificationControl'
import { PixelIcon } from './PixelIcon'
import { ResetControl } from './ResetControl'

type SystemPanelProps = {
  disabled: boolean
  notificationsEnabled: boolean
  notificationPermission: NotificationPermission
  notificationsSupported: boolean
  showSettingsEntry?: boolean
  onCommand: (command: GameCommand) => void
  onDisableNotifications: () => void
  onEnableNotifications: () => void
  onReset: () => void
}

export function SystemPanel({
  disabled,
  notificationsEnabled,
  notificationPermission,
  notificationsSupported,
  showSettingsEntry = false,
  onCommand,
  onDisableNotifications,
  onEnableNotifications,
  onReset,
}: SystemPanelProps) {
  return (
    <div className='system-controls'>
      <NotificationControl
        disabled={disabled}
        enabled={notificationsEnabled}
        permission={notificationPermission}
        supported={notificationsSupported}
        onEnable={onEnableNotifications}
        onDisable={onDisableNotifications}
      />
      {showSettingsEntry ? (
        <button
          className='reset-control'
          disabled={disabled}
          type='button'
          onClick={() => onCommand({ type: 'openMenu', targetId: 'settings' })}
        >
          <span className='reset-control__icon' aria-hidden='true'>
            <PixelIcon name='settings' />
          </span>
          <span>设置</span>
        </button>
      ) : null}
      <ResetControl disabled={disabled} onReset={onReset} />
    </div>
  )
}
