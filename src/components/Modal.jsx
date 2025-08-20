export default function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        {title && <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  )
}