import { useEffect, useRef } from 'react'

export default function ResponsivePlotlyBox({ figure }: { figure: { data: any[]; layout?: any; config?: any } }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wrapRef.current || !plotRef.current) return

    const render = async () => {
      const el = plotRef.current!
      const rect = wrapRef.current!.getBoundingClientRect()
      const width = Math.max(280, rect.width)
      const height = Math.max(200, rect.height)
      // @ts-ignore
      await (window as any).Plotly.react(
        el,
        figure.data,
        {
          autosize: false,
          width,
          height,
          margin: { l: 8, r: 8, t: 8, b: 12 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          scene: {
            xaxis: { title: 'x', tickfont: { size: 10 } },
            yaxis: { title: 'y', tickfont: { size: 10 } },
            zaxis: { title: 'z', tickfont: { size: 10 } },
          },
          ...(figure.layout || {}),
        },
        { displayModeBar: false, responsive: true, ...(figure.config || {}) },
      )
    }

    const ro = new ResizeObserver(render)
    ro.observe(wrapRef.current)
    render()

    return () => {
      ro.disconnect()
      // @ts-ignore
      if (plotRef.current && (window as any).Plotly) (window as any).Plotly.purge(plotRef.current)
    }
  }, [figure])

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <div ref={wrapRef} className="aspect-[4/3] sm:aspect-[16/9] w-full relative">
        <div ref={plotRef} className="absolute inset-0" />
      </div>
    </div>
  )
}

