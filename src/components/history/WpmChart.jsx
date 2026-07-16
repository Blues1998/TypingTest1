import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function WpmChart({ data }) {
  const chartData = useMemo(() => data.map((s, i) => ({
    label: fmtDate(s.timestamp),
    wpm: s.wpm,
    index: i + 1,
  })), [data])

  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 20, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          stroke="var(--color-sub)"
          tick={{ fill: 'var(--color-sub)', fontSize: 10, fontFamily: 'monospace' }}
          angle={-35}
          textAnchor="end"
          interval="preserveStartEnd"
        />
        <YAxis stroke="var(--color-sub)" tick={{ fill: 'var(--color-sub)', fontSize: 11, fontFamily: 'monospace' }} />
        <Tooltip
          contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: 12 }}
          labelStyle={{ color: 'var(--color-sub)' }}
          formatter={v => [`${v} wpm`]}
        />
        <Line type="monotone" dataKey="wpm" stroke="var(--color-main)" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
