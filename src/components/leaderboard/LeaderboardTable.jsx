const rankStyle = ['text-main', 'text-[#9ca3af]', 'text-[#b45309]']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function LeaderboardTable({ data, loading, fetchError, username }) {
  if (loading) {
    return (
      <div className="text-center py-16 text-sub text-sm">loading...</div>
    )
  }
  if (fetchError) {
    return (
      <div className="text-center py-16 text-sub text-sm">
        couldn't load scores — check your connection
      </div>
    )
  }
  if (!data.length) {
    return (
      <div className="text-center py-16 text-sub text-sm">no scores yet — be the first!</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-sub border-b border-border">
            <th className="text-left py-3 pr-4 font-normal w-8">#</th>
            <th className="text-left py-3 pr-4 font-normal">name</th>
            <th className="text-right py-3 pr-4 font-normal">wpm</th>
            <th className="text-right py-3 pr-4 font-normal">acc</th>
            <th className="text-right py-3 font-normal hidden sm:table-cell">date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isMe = username && row.username === username
            return (
              <tr
                key={i}
                className={`border-b border-[#1e1e1e] transition-colors ${isMe ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
              >
                <td className={`py-3 pr-4 tabular-nums font-mono ${rankStyle[i] || 'text-sub'}`}>
                  {i + 1}
                </td>
                <td className={`py-3 pr-4 ${isMe ? 'text-main' : 'text-text'}`}>
                  {row.username}{isMe && ' (you)'}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-text font-semibold">{row.wpm}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-sub">{row.accuracy ?? '—'}%</td>
                <td className="py-3 text-right text-sub hidden sm:table-cell">{formatDate(row.created_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
