import Plot from 'react-plotly.js'

type Props = { data: Partial<Plotly.Data>[]; layout?: Partial<Plotly.Layout> }

export default function ResponsivePlot3D({ data, layout }: Props) {
  const isSmall = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches
  return (
    <div className="w-full overflow-hidden rounded-xl">
      <div className="aspect-[4/3] sm:aspect-[16/9] w-full">
        <Plot
          data={data}
          layout={{
            autosize: true,
            margin: { l: 8, r: 8, t: 8, b: 12 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { size: isSmall ? 10 : 12 },
            scene: {
              xaxis: { title: 'x', tickfont: { size: isSmall ? 10 : 12 } },
              yaxis: { title: 'y', tickfont: { size: isSmall ? 10 : 12 } },
              zaxis: { title: 'z', tickfont: { size: isSmall ? 10 : 12 } },
            },
            ...layout,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}

