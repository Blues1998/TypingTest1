import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { WpmChart } from '../components/history/WpmChart.jsx'
import { HistoryTable } from '../components/history/HistoryTable.jsx'
import { getPersonalScores, clearPersonalScores, getStatsOverview } from '../services/scoreService.js'
import { getDailyStreak } from '../utils/streakUtils.js'

const MODES = [
  { key: null,        label: 'all' },
  { key: 'stopwatch', label: 'stopwatch' },
  { key: 'countdown', label: 'countdown' },
  { key: 'words',     label: 'words' },
  { key: 'quotes',    label: 'quotes' },
  { key: 'bubble',    label: 'bubbles' },
  { key: 'survival',  label: 'survival' },
  { key: 'code',      label: 'code' },
  { key: 'daily',     label: 'daily' },
]

const MODE_LABELS = {
  stopwatch: 'stopwatch', countdown: 'countdown', words: 'words',
  quotes: 'quotes', bubble: 'bubbles', survival: 'survival',
  code: 'code', daily: 'daily',
}

function StatCard({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-2xl font-bold text-text tabular-nums">{value ?? '-'}</div>
      <div className="text-xs text-sub">{label}</div>
      {sub && <div className="text-[10px] text-sub opacity-60">{sub}</div>}
    </div>
  )
}

function StatsOverview({ overview, streak }) {
  if (!overview) return null

  const modeEntries = Object.entries(overview.bestPerMode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="mb-6 p-5 bg-surface rounded-xl border border-border">
      <div className="text-sub text-xs tracking-widest uppercase mb-4">overview</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <StatCard label="total tests" value={overview.totalTests} />
        <StatCard label="days played" value={overview.totalDays} />
        <StatCard
          label="7-day avg"
          value={overview.avgWpm7d !== null ? `${overview.avgWpm7d} wpm` : '-'}
          sub={overview.avgAccuracy7d !== null ? `${overview.avgAccuracy7d}% acc` : null}
        />
        <StatCard
          label="daily streak"
          value={streak > 0 ? `${streak} 🔥` : '0'}
        />
      </div>

      {modeEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sub text-[10px] tracking-widest uppercase mb-2">best wpm per mode</div>
          <div className="flex flex-wrap gap-4">
            {modeEntries.map(([m, wpm]) => (
              <div key={m} className="text-xs">
                <span className="text-sub">{MODE_LABELS[m] || m}</span>
                <span className="text-main font-semibold ml-1.5">{wpm}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


export function HistoryPage() {
  const [activeMode, setActiveMode] = useState(null)
  const [tick, setTick] = useState(0)

  const data = getPersonalScores(activeMode)
  const overview = getStatsOverview()
  const streak = getDailyStreak()

  function handleClear() {
    if (window.confirm('Clear all personal history?')) {
      clearPersonalScores()
      setTick(t => t + 1)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-text text-2xl font-semibold">history</h1>
          {data.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-sub hover:text-wrong transition-colors"
            >
              clear all
            </button>
          )}
        </div>

        <StatsOverview overview={overview} streak={streak} />

        {/* Mode tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-surface p-1 rounded-lg w-fit border border-border">
          {MODES.map(m => (
            <button
              key={String(m.key)}
              onClick={() => setActiveMode(m.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeMode === m.key
                  ? 'bg-border text-text'
                  : 'text-sub hover:text-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {data.length > 1 && (
          <div className="mb-6 p-4 bg-surface rounded-xl border border-border">
            <WpmChart data={data} />
          </div>
        )}

        <HistoryTable data={data} key={tick} />
      </div>
    </PageWrapper>
  )
}
