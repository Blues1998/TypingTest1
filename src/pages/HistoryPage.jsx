import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { WpmChart } from '../components/history/WpmChart.jsx'
import { HistoryTable } from '../components/history/HistoryTable.jsx'
import { KeyboardHeatmap } from '../components/typing/KeyboardHeatmap.jsx'
import { getPersonalScores, clearPersonalScores, getStatsOverview, getAggregateKeyStats } from '../services/scoreService.js'
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

const TIMEFRAMES = [
  { key: '7d',  label: '7d',   days: 7 },
  { key: '30d', label: '30d',  days: 30 },
  { key: '90d', label: '90d',  days: 90 },
  { key: 'all', label: 'all',  days: null },
]

const MODE_LABELS = {
  stopwatch: 'stopwatch', countdown: 'countdown', words: 'words',
  quotes: 'quotes', bubble: 'bubbles', survival: 'survival',
  code: 'code', daily: 'daily',
}

function filterByDays(scores, days) {
  if (!days) return scores
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return scores.filter(s => s.timestamp >= cutoff)
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

function StatsOverview({ overview, streak, periodLabel }) {
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
          label={`${periodLabel} avg`}
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
  const [activeMode,      setActiveMode]      = useState(null)
  const [activeTimeframe, setActiveTimeframe] = useState('all')
  const [tick,            setTick]            = useState(0)
  const [confirmClear,    setConfirmClear]    = useState(false)

  const activeDays = TIMEFRAMES.find(t => t.key === activeTimeframe)?.days ?? null
  const periodLabel = activeTimeframe === 'all' ? 'all-time' : activeTimeframe

  const allData = getPersonalScores(activeMode)
  const data    = filterByDays(allData, activeDays)

  const overview       = getStatsOverview(activeDays)
  const streak         = getDailyStreak()
  const aggregateKeys  = getAggregateKeyStats()

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearPersonalScores()
    setConfirmClear(false)
    setTick(t => t + 1)
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-text text-2xl font-semibold">history</h1>
          {allData.length > 0 && (
            <div className="flex items-center gap-2">
              {confirmClear && (
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-sub hover:text-text transition-colors"
                >
                  cancel
                </button>
              )}
              <button
                onClick={handleClear}
                className="text-xs transition-colors"
                style={{ color: confirmClear ? 'var(--color-wrong)' : 'var(--color-sub)' }}
                onMouseLeave={() => setConfirmClear(false)}
              >
                {confirmClear ? 'sure?' : 'clear all'}
              </button>
            </div>
          )}
        </div>

        <StatsOverview overview={overview} streak={streak} periodLabel={periodLabel} />

        {/* Timeframe + Mode filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Timeframe pills */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
            {TIMEFRAMES.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTimeframe(t.key)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  activeTimeframe === t.key ? 'bg-border text-text' : 'text-sub hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mode tabs */}
          <div className="flex flex-wrap gap-1 bg-surface p-1 rounded-lg border border-border">
            {MODES.map(m => (
              <button
                key={String(m.key)}
                onClick={() => setActiveMode(m.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeMode === m.key ? 'bg-border text-text' : 'text-sub hover:text-text'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {data.length > 1 && (
          <div className="mb-6 p-4 bg-surface rounded-xl border border-border">
            <WpmChart data={data} />
          </div>
        )}

        {data.length === 0 && allData.length > 0 && (
          <div className="text-center py-12 text-sub text-sm">
            no tests in this period
          </div>
        )}
        {allData.length === 0 && (
          <div className="text-center py-12 text-sub text-sm">
            no history yet — complete a test to see it here
          </div>
        )}
        <HistoryTable data={data} key={tick} />

        {/* All-time per-key accuracy heatmap */}
        {aggregateKeys.length > 0 && (
          <div className="mt-8 p-5 bg-surface rounded-xl border border-border">
            <div className="text-sub text-xs tracking-widest uppercase mb-1">all-time key accuracy</div>
            <div className="text-sub text-[10px] mb-3">aggregated across all your tests</div>
            <KeyboardHeatmap keyStats={aggregateKeys} />
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
