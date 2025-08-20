import FlashcardOption from './FlashcardOption'

type Item = {
  label: string
}

type Props = {
  items: Item[]
  selectedIndex: number | null
  disabled?: boolean
  resultIndex?: number | null // index of correct option after submit
  onSelect: (index: number) => void
}

export default function FlashcardGrid({ items, selectedIndex, disabled, resultIndex, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((it, idx) => {
        const selected = selectedIndex === idx
        let state: 'default' | 'correct' | 'incorrect' = 'default'
        if (disabled && selectedIndex != null) {
          state = resultIndex === idx ? 'correct' : (selected ? 'incorrect' : 'default')
        }
        return (
          <FlashcardOption
            key={idx}
            label={it.label}
            selected={selected}
            disabled={!!disabled}
            state={state}
            onSelect={() => onSelect(idx)}
          />
        )
      })}
    </div>
  )}