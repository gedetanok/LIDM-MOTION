import React from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
// @ts-ignore - plotly.js-dist-min has no type exports in ESM
import Plotly from 'plotly.js-dist-min'

const Plot = createPlotlyComponent(Plotly)

type Meta = { shape: string; params?: Record<string, number> }

function linspace(a: number, b: number, n: number) {
  const step = (b - a) / (n - 1)
  return Array.from({ length: n }, (_, i) => a + i * step)
}

export default function Graph3DPlotly({ meta }: { meta: Meta }) {
  if (!meta) return null
  const p = meta.params || {}
  const isSmall = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches
  const layout: any = {
    autosize: true,
    margin: { l: 8, r: 8, t: 8, b: 12 },
    scene: {
      aspectmode: 'cube',
      xaxis: { title: 'x', showgrid: true, zeroline: true, tickfont: { size: isSmall ? 10 : 12 } },
      yaxis: { title: 'y', showgrid: true, zeroline: true, tickfont: { size: isSmall ? 10 : 12 } },
      zaxis: { title: 'z', showgrid: true, zeroline: true, tickfont: { size: isSmall ? 10 : 12 } },
    },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  }

  let data: any[] = []

  switch (meta.shape) {
    case 'sphere': {
      const r = p.r || 1
      const u = linspace(0, Math.PI, 40)
      const v = linspace(0, 2 * Math.PI, 40)
      const x = u.map((ui) => v.map((vj) => r * Math.sin(ui) * Math.cos(vj)))
      const y = u.map((ui) => v.map((vj) => r * Math.sin(ui) * Math.sin(vj)))
      const z = u.map((ui) => v.map((vj) => r * Math.cos(ui)))
      data = [{ type: 'surface', x, y, z, showscale: false, contours: { z: { show: false } } }]
      break
    }
    case 'cylinder': {
      const r = p.r || 1
      const h = p.h || 2
      const t = linspace(0, 2 * Math.PI, 60)
      const zv = linspace(0, h, 30)
      const x = zv.map((zz) => t.map((tt) => r * Math.cos(tt)))
      const y = zv.map((zz) => t.map((tt) => r * Math.sin(tt)))
      const z = zv.map((zz) => t.map(() => zz))
      data = [{ type: 'surface', x, y, z, showscale: false }]
      break
    }
    case 'cone': {
      const r = p.r || 1
      const h = p.h || 2
      const t = linspace(0, 2 * Math.PI, 60)
      const zf = linspace(0, h, 30)
      const x = zf.map((zz) => t.map((tt) => (r * (1 - zz / h)) * Math.cos(tt)))
      const y = zf.map((zz) => t.map((tt) => (r * (1 - zz / h)) * Math.sin(tt)))
      const z = zf.map((zz) => t.map(() => zz))
      data = [{ type: 'surface', x, y, z, showscale: false }]
      break
    }
    case 'cube':
    case 'rect_prism': {
      const L = meta.shape === 'cube' ? p.s || 1 : p.l || 1
      const W = meta.shape === 'cube' ? p.s || 1 : p.w || 1
      const H = meta.shape === 'cube' ? p.s || 1 : p.h || 1
      const x = [0, L, L, 0, 0, L, L, 0]
      const y = [0, 0, W, W, 0, 0, W, W]
      const z = [0, 0, 0, 0, H, H, H, H]
      const i = [0, 0, 0, 1, 2, 4, 5, 6, 3, 7, 1, 2]
      const j = [1, 2, 3, 5, 3, 5, 6, 7, 7, 6, 4, 6]
      const k = [5, 3, 4, 6, 0, 1, 2, 3, 4, 2, 5, 7]
      data = [{ type: 'mesh3d', x, y, z, i, j, k, opacity: 1, flatshading: true }]
      break
    }
    default:
      data = []
  }

  return <Plot data={data} layout={layout} config={{ displayModeBar: false, responsive: true }} style={{ width: '100%', height: '100%' }} useResizeHandler />
}