export default function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-6 ${className}`}>
      {title && <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>}
      {children}
    </div>
  )
}