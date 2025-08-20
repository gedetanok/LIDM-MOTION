const EMOTIONS = [
  { key: 'happy', label: 'Happy', icon: '😊' },
  { key: 'anxious', label: 'Anxious', icon: '😟' },
  { key: 'neutral', label: 'Neutral', icon: '😐' },
  { key: 'frustrated', label: 'Frustrated', icon: '😤' },
  { key: 'excited', label: 'Excited', icon: '🤩' },
]

export default function EmotionPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {EMOTIONS.map((e) => (
        <button
          key={e.key}
          type="button"
          onClick={() => onChange(e.key)}
          className={`flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-gray-50 ${
            value === e.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
          }`}
        >
          <span>{e.icon}</span>
          <span className="text-sm text-gray-800">{e.label}</span>
        </button>
      ))}
    </div>
  )
}