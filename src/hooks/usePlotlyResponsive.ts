import { useEffect } from 'react'

export function usePlotlyResponsive(containerRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const ro = new ResizeObserver(() => {
      // @ts-ignore
      if (typeof window !== 'undefined' && (window as any).Plotly && el) {
        // @ts-ignore
        ;(window as any).Plotly.Plots.resize(el)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])
}

