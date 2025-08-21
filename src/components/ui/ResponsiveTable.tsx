export function ResponsiveTable({
  columns,
  rows,
}: {
  columns: { key: string; header: string; render?: (v: any, row: any) => React.ReactNode }[]
  rows: any[]
}) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 text-left font-medium text-gray-600">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border p-3">
            {columns.map((c) => (
              <div key={c.key} className="flex justify-between gap-4 py-1">
                <span className="text-gray-500">{c.header}</span>
                <span className="text-right">{c.render ? c.render(r[c.key], r) : r[c.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

