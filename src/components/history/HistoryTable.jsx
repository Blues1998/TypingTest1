function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function HistoryTable({ data }) {
  if (!data.length) {
    return <div className="text-center py-8 text-sub text-sm">no results yet</div>
  }

  const sorted = [...data].reverse()
  const maxWpm = Math.max(...data.map(s => s.wpm))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-sub border-b border-border">
            <th className="text-left py-3 pr-4 font-normal">date</th>
            <th className="text-left py-3 pr-4 font-normal hidden sm:table-cell">mode</th>
            <th className="text-left py-3 pr-4 font-normal hidden md:table-cell">diff</th>
            <th className="text-right py-3 pr-4 font-normal">wpm</th>
            <th className="text-right py-3 pr-4 font-normal">acc</th>
            <th className="text-right py-3 font-normal hidden sm:table-cell">time</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const isBest = row.wpm === maxWpm
            return (
              <tr key={i} className="border-b border-[#1e1e1e] hover:bg-surface-hover transition-colors">
                <td className="py-3 pr-4 text-sub">{formatDate(row.timestamp)}</td>
                <td className="py-3 pr-4 text-sub hidden sm:table-cell">{row.mode}</td>
                <td className="py-3 pr-4 text-sub hidden md:table-cell">{row.difficulty ?? '—'}</td>
                <td className="py-3 pr-4 text-right tabular-nums font-semibold" style={{ color: isBest ? 'var(--color-main)' : 'var(--color-text)' }}>
                  {isBest && <span className="mr-1 text-[10px]">★</span>}{row.wpm}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-sub">{row.accuracy}%</td>
                <td className="py-3 text-right tabular-nums text-sub hidden sm:table-cell">{row.timeTaken?.toFixed(1) ?? '—'}s</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
