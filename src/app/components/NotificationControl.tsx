type NotificationControlProps = {
  enabled: boolean
  permission: NotificationPermission
  supported: boolean
  disabled?: boolean
  onEnable(): void
  onDisable(): void
}

export function NotificationControl({
  enabled,
  permission,
  supported,
  disabled = false,
  onEnable,
  onDisable,
}: NotificationControlProps) {
  const canToggle = supported && !disabled && permission !== 'denied'

  return (
    <section className='notification-control pixel-edge'>
      <div className='notification-control__copy'>
        <h2>提醒</h2>
        <p>{getStatusLabel(supported, permission, enabled)}</p>
      </div>
      <button
        type='button'
        className='notification-control__button action-button'
        onClick={enabled ? onDisable : onEnable}
        disabled={!canToggle}
        aria-pressed={enabled}
      >
        {enabled ? '关闭' : '开启'}
      </button>
    </section>
  )
}

function getStatusLabel(
  supported: boolean,
  permission: NotificationPermission,
  enabled: boolean
): string {
  if (!supported) return '当前浏览器不支持。'
  if (permission === 'denied') return '已被浏览器设置阻止。'
  if (enabled && permission === 'granted') return '照护提醒已开启。'
  return '在此设备开启浏览器提醒。'
}
