import React from 'react'

type Props = { meta: any }

export default function Viz2D({ meta }: Props) {
  const p = meta?.params || {}
  const width = 360
  const height = 240

  const stroke = '#334155'
  const fill = 'none'
  const strokeWidth = 2

  function Rectangle() {
    const l = p.l || 120
    const w = p.w || 80
    return <rect x={10} y={10} width={l} height={w} stroke={stroke} fill={fill} strokeWidth={strokeWidth} />
  }

  function Triangle() {
    const base = p.base || 120
    const h = p.h || 100
    const points = `10,${10 + h} ${10 + base},${10 + h} 10,10`
    return <polygon points={points} stroke={stroke} fill={fill} strokeWidth={strokeWidth} />
  }

  function Circle() {
    const r = p.r || 60
    return <circle cx={width / 2 - 60} cy={height / 2 - 20} r={r} stroke={stroke} fill={fill} strokeWidth={strokeWidth} />
  }

  function Trapezoid() {
    const a = p.a || 140
    const b = p.b || 80
    const h = p.h || 90
    const left = 10
    const top = 10
    const x1 = left
    const y1 = top + h
    const x2 = left + a
    const y2 = top + h
    const x3 = left + (a + b) / 2
    const y3 = top
    const x4 = left + (a - b) / 2
    const y4 = top
    const points = `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`
    return <polygon points={points} stroke={stroke} fill={fill} strokeWidth={strokeWidth} />
  }

  const content = (() => {
    switch (meta?.shape) {
      case 'rectangle':
        return <Rectangle />
      case 'triangle':
        return <Triangle />
      case 'circle':
        return <Circle />
      case 'trapezoid':
        return <Trapezoid />
      default:
        return null
    }
  })()

  if (!content) return null

  return (
    <div className="w-full overflow-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded-xl border border-slate-200 bg-white">
        {/* Axes */}
        <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="#e2e8f0" />
        <line x1={1} y1={0} x2={1} y2={height} stroke="#e2e8f0" />
        {content}
      </svg>
    </div>
  )
}