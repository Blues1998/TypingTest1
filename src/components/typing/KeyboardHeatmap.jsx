import { useMemo } from 'react'

const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
]
const OFFSETS = [0, 0.4, 0.85]

function keyBg(acc) {
  if (acc === undefined) return 'var(--color-key-none)'
  if (acc >= 97) return 'var(--color-key-perfect)'
  if (acc >= 90) return 'var(--color-key-good)'
  if (acc >= 75) return 'var(--color-key-medium)'
  if (acc >= 50) return 'var(--color-key-poor)'
  return 'var(--color-key-bad)'
}

function keyFg(acc) {
  if (acc === undefined) return 'var(--color-sub)'
  if (acc >= 90) return 'var(--color-correct)'
  if (acc >= 75) return 'var(--color-main)'
  if (acc >= 50) return '#ff8844'
  return 'var(--color-wrong)'
}

export function KeyboardHeatmap({ keyStats }) {
  if (!keyStats || keyStats.length === 0) return null

  const { map, hasData, worst } = useMemo(() => {
    const m = {}
    for (const s of keyStats) m[s.key] = s
    const hd = ROWS.flat().some(k => m[k])
    const w = keyStats
      .filter(s => s.errors > 0 && s.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 6)
    return { map: m, hasData: hd, worst: w }
  }, [keyStats])

  if (!hasData) return null

  return (
    <div className="mt-6">
      <div className="text-sub text-xs mb-3 tracking-wide">key accuracy</div>
      <div className="space-y-1">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1" style={{ paddingLeft: `${OFFSETS[ri] * 1.75}rem` }}>
            {row.map(k => {
              const s = map[k]
              return (
                <div
                  key={k}
                  title={s ? `${k}: ${s.accuracy}% (${s.errors} error${s.errors !== 1 ? 's' : ''} / ${s.total} typed)` : k}
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono font-semibold border border-border select-none"
                  style={{ background: keyBg(s?.accuracy), color: keyFg(s?.accuracy) }}
                >
                  {k}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {worst.length > 0 && (
        <div className="mt-2 text-xs text-sub">
          most errors:{' '}
          {worst.map(s => (
            <span key={s.key} className="font-mono mr-2" style={{ color: 'var(--color-wrong)' }}>
              {s.key} ({s.errors}x)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
