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
        <h2>小闹钟</h2>
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
  if (!supported) return '这个浏览器不能叫你。'
  if (permission === 'denied') return '提醒被浏览器挡住了。'
  if (enabled && permission === 'granted') return '会在需要时叫你。'
  return '离开时也能收到消息。'
}
