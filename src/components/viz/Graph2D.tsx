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
      data = [{ x: [0, p.base, 0], y: [0, 0, p.h], mode: 'lines+markers' }]
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
      style={{ width: '100%', height: '360px' }}
      config={{ displayModeBar: false, scrollZoom: true }}
    />
  )
}