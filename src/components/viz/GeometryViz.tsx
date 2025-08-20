import React, { lazy, Suspense } from 'react'

const Viz2D = lazy(() => import('./Viz2D'))
const Viz3D = lazy(() => import('./Viz3D'))

export default function GeometryViz({ meta }: { meta?: any }) {
  if (!meta) return null
  return (
    <div className="mt-4 rounded-2xl border bg-white shadow-sm p-3">
      <Suspense fallback={<div className="h-[240px] animate-pulse bg-slate-100 rounded-xl" />}>
        {meta.dimension === '3D' ? <Viz3D meta={meta} /> : <Viz2D meta={meta} />}
      </Suspense>
    </div>
  )
}