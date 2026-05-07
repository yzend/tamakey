import { PixelIcon } from './PixelIcon'

type ResetControlProps = {
  disabled?: boolean
  onReset: () => void
}

export function ResetControl({ disabled = false, onReset }: ResetControlProps) {
  return (
    <button
      className='reset-control'
      disabled={disabled}
      type='button'
      onClick={onReset}
    >
      <span className='reset-control__icon' aria-hidden='true'>
        <PixelIcon name='reset' />
      </span>
      <span>重来</span>
    </button>
  )
}
