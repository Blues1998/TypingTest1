import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function barColor(wpm, mean) {
  const r = wpm / Math.max(mean, 1)
  if (r >= 1.15) return 'var(--color-correct)'
  if (r >= 0.85) return 'var(--color-main)'
  if (r >= 0.6)  return '#ff8844'
  return 'var(--color-wrong)'
}

export function WordChart({ wordWpms }) {
  if (!wordWpms || wordWpms.length < 3) return null
  const data = wordWpms.slice(0, 40)
  const mean = data.reduce((s, w) => s + w.wpm, 0) / data.length

  return (
    <div className="mt-6">
      <div className="text-sub text-xs mb-2 tracking-wide">wpm per word</div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -28 }} barCategoryGap="10%">
          <XAxis dataKey="word" hide />
          <YAxis tick={{ fill: 'var(--color-sub)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}
            itemStyle={{ color: 'var(--color-text)' }}
            labelStyle={{ color: 'var(--color-sub)' }}
            formatter={(v, _, props) => [`${v} wpm`, `"${props.payload.word}"`]}
            labelFormatter={() => ''}
          />
          <Bar dataKey="wpm" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.wpm, mean)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
