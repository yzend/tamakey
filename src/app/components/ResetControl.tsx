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
        R
      </span>
      <span>重置</span>
    </button>
  )
}
