import { KeyboardEvent } from 'react'

type Props = {
  label: string
  selected: boolean
  disabled?: boolean
  state?: 'default' | 'correct' | 'incorrect'
  onSelect: () => void
}

export default function FlashcardOption({ label, selected, disabled, state = 'default', onSelect }: Props) {
  function handleKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) onSelect()
    }
  }

  const base = 'rounded-2xl border bg-white px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60'
  const hover = disabled ? '' : 'hover:border-slate-300'
  const borderDefault = 'border-slate-200'
  const selectedRing = selected && state === 'default' ? 'ring-2 ring-slate-400' : ''

  const stateClass = state === 'correct'
    ? 'border-green-500 ring-2 ring-green-500'
    : state === 'incorrect'
      ? 'border-red-500 ring-2 ring-red-500'
      : borderDefault

  return (
    <button
      type="button"
      role="button"
      tabIndex={0}
      className={`${base} ${hover} ${stateClass} ${selectedRing}`}
      onClick={() => !disabled && onSelect()}
      onKeyDown={handleKey}
      disabled={disabled}
    >
      {label}
    </button>
  )
}