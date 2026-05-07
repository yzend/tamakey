import { PixelIcon, type PixelIconName } from './PixelIcon'

export type StatMeterTone = 'hunger' | 'happy' | 'clean' | 'sleep' | 'sick'

type StatMeterProps = {
  icon: PixelIconName
  label: string
  value: number
  tone: StatMeterTone
}

export function StatMeter({ icon, label, value, tone }: StatMeterProps) {
  const safeValue = clampInteger(value, 0, 100)

  return (
    <div className={`stat-meter stat-meter--${tone}`}>
      <span className='stat-meter__label'>
        <PixelIcon name={icon} />
        <span>{label}</span>
      </span>
      <div
        className='stat-meter__track'
        role='meter'
        aria-label={`${label} ${safeValue}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <span
          className='stat-meter__value'
          style={{ inlineSize: `${safeValue}%` }}
        />
      </div>
      <span className='stat-meter__number'>{safeValue}</span>
    </div>
  )
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}
