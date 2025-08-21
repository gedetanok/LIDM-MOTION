import React, { lazy, Suspense } from 'react'

const Graph2D = lazy(() => import('./Graph2D'))
const Graph3DPlotly = lazy(() => import('./Graph3DPlotly'))
const Graph3DWire = lazy(() => import('./Graph3DWire'))

export default function GeometryGraph({ meta }: { meta?: any }) {
  if (!meta) return null
  const is3DRect = meta.dimension === '3D' && (meta.shape === 'cube' || meta.shape === 'rect_prism')
  return (
    <div className="mt-4 rounded-2xl border bg-white shadow-sm p-3 overflow-hidden">
      <div className="w-full aspect-[4/3] sm:aspect-[16/9]">
        <Suspense fallback={<div className="h-full rounded-xl bg-slate-100 animate-pulse" />}>
          {meta.dimension === '3D'
            ? is3DRect
              ? <Graph3DWire meta={meta} />
              : <Graph3DPlotly meta={meta} />
            : <Graph2D meta={meta} />}
        </Suspense>
      </div>
    </div>
  )
}