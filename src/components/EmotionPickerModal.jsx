import * as Dialog from '@radix-ui/react-dialog'

const EMOTIONS = [
  { key: 'happy', label: 'Happy', icon: '😊' },
  { key: 'anxious', label: 'Anxious', icon: '😟' },
  { key: 'neutral', label: 'Neutral', icon: '😐' },
  { key: 'frustrated', label: 'Frustrated', icon: '😤' },
  { key: 'excited', label: 'Excited', icon: '🤩' },
]

export default function EmotionPickerModal({ open, onOpenChange, value, onChange, onSave, title = 'Pick your emotion' }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-gray-800 mb-3">{title}</Dialog.Title>
          <div className="grid grid-cols-3 gap-3">
            {EMOTIONS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => onChange?.(e.key)}
                className={`flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-gray-50 ${
                  value === e.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <span>{e.icon}</span>
                <span className="text-sm text-gray-800">{e.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
            </Dialog.Close>
            <button
              disabled={!value}
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}