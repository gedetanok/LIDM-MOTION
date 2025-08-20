import React from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'

const Plot = createPlotlyComponent(Plotly)
const BLUE = '#2563eb'

type Meta = { shape: 'cube' | 'rect_prism'; params?: Record<string, number> }

function edgesForRect(L: number, W: number, H: number) {
  const v = [
    [0, 0, 0],
    [L, 0, 0],
    [L, W, 0],
    [0, W, 0],
    [0, 0, H],
    [L, 0, H],
    [L, W, H],
    [0, W, H],
  ]
  const e = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]
  return e.map(([i, j]) => ({
    type: 'scatter3d',
    mode: 'lines',
    x: [v[i][0], v[j][0]],
    y: [v[i][1], v[j][1]],
    z: [v[i][2], v[j][2]],
    line: { color: BLUE, width: 3 },
    hoverinfo: 'skip',
    showlegend: false,
  }) as any)
}

export default function Graph3DWire({ meta }: { meta: Meta }) {
  const p = meta.params || {}
  const L = meta.shape === 'cube' ? p.s || 1 : p.l || 1
  const W = meta.shape === 'cube' ? p.s || 1 : p.w || 1
  const H = meta.shape === 'cube' ? p.s || 1 : p.h || 1
  const data = edgesForRect(L, W, H)

  return (
    <Plot
      data={data}
      layout={{
        height: 360,
        margin: { l: 0, r: 0, t: 0, b: 0 },
        scene: {
          aspectmode: 'cube',
          xaxis: { title: 'x', showgrid: true, zeroline: true },
          yaxis: { title: 'y', showgrid: true, zeroline: true },
          zaxis: { title: 'z', showgrid: true, zeroline: true },
        },
        showlegend: false,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 360 }}
    />
  )
}