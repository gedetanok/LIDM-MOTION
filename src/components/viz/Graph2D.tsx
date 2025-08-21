import React from 'react'
import Plot from 'react-plotly.js'

export default function Graph2D({ meta }: { meta: any }) {
  if (!meta) return null
  const p = meta.params || {}

  const layout: any = {
    dragmode: 'pan',
    margin: { l: 40, r: 10, t: 10, b: 40 },
    showlegend: false,
    xaxis: { zeroline: true, showgrid: true },
    yaxis: { zeroline: true, showgrid: true, scaleanchor: 'x' },
  }

  let data: any[] = []
  let shapes: any[] = []

  switch (meta.shape) {
    case 'rectangle':
      data = [{ x: [0, p.l, p.l, 0, 0], y: [0, 0, p.w, p.w, 0], mode: 'lines' }]
      break
    case 'triangle':
      if (meta.type === 'equilateral') {
        const s = Number(p.s || 1)
        const h = (Math.sqrt(3) / 2) * s
        // Coordinates of an equilateral triangle centered on y-axis base on x-axis
        const x = [0, s, s / 2, 0]
        const y = [0, 0, h, 0]
        data = [{ x, y, mode: 'lines+markers' }]
      } else if (meta.type === 'isosceles') {
        const a = Number(p.a || 4) // equal sides
        const b = Number(p.b || 3) // base
        const h = Math.sqrt(Math.max(a * a - (b * b) / 4, 0.0001))
        const x = [0, b, b / 2, 0]
        const y = [0, 0, h, 0]
        data = [{ x, y, mode: 'lines+markers' }]
      } else if (meta.type === 'right') {
        const base = Number(p.base || 4)
        const h = Number(p.h || 3)
        data = [{ x: [0, base, 0, 0], y: [0, 0, h, 0], mode: 'lines+markers' }]
      } else {
        const base = Number(p.base || 4)
        const h = Number(p.h || 3)
        data = [{ x: [0, base, 0, 0], y: [0, 0, h, 0], mode: 'lines+markers' }]
      }
      break
    case 'circle':
      shapes = [{ type: 'circle', xref: 'x', yref: 'y', x0: -p.r, y0: -p.r, x1: p.r, y1: p.r, line: { width: 2 } }]
      break
    case 'trapezoid':
      data = [{ x: [0, p.a, p.a - (p.a - p.b) / 2, (p.a - p.b) / 2, 0], y: [0, 0, p.h, p.h, 0], mode: 'lines' }]
      break
    default:
      data = []
  }

  return (
    <Plot
      data={data}
      layout={{ ...layout, shapes }}
      style={{ width: '100%', height: 'min(420px, max(260px, 56vw))' }}
      config={{ displayModeBar: false, scrollZoom: true, responsive: true }}
    />
  )
}