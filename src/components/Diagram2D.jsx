export default function Diagram2D({ diagram }) {
  if (!diagram || !diagram.shapes || !Array.isArray(diagram.shapes)) return null
  const { width = 320, height = 200, shapes } = diagram
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto border border-gray-200 rounded-xl bg-white">
      {shapes.map((s, idx) => {
        if (s.type === 'line') {
          return <line key={idx} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#4B5563" strokeWidth={2} />
        }
        if (s.type === 'circle') {
          return <circle key={idx} cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke="#6366F1" strokeWidth={2} />
        }
        if (s.type === 'polygon' && Array.isArray(s.points)) {
          const pts = s.points.map((p) => p.join(',')).join(' ')
          return <polygon key={idx} points={pts} fill="none" stroke="#10B981" strokeWidth={2} />
        }
        if (s.type === 'label') {
          return <text key={idx} x={s.x} y={s.y} fontSize={12} fill="#111827">{s.text}</text>
        }
        return null
      })}
    </svg>
  )
}