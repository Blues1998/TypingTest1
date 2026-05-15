import { useState, useEffect } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable.jsx'
import { useUsername } from '../hooks/useUsername.js'
import { getLeaderboard } from '../services/scoreService.js'
import { supabase } from '../services/supabase.js'

const MODES = [
  { key: 'stopwatch', label: 'stopwatch' },
  { key: 'countdown', label: '60s' },
  { key: 'bubble',    label: 'bubbles' },
  { key: 'survival',  label: 'survival' },
  { key: 'code',      label: 'code' },
  { key: 'daily',     label: 'daily' },
]

export function LeaderboardPage() {
  const [activeMode, setActiveMode] = useState('stopwatch')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const { username } = useUsername()

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    getLeaderboard(activeMode)
      .then(rows => { setData(rows); setLoading(false) })
      .catch(() => { setFetchError(true); setData([]); setLoading(false) })
  }, [activeMode])

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-text text-2xl font-semibold mb-6">leaderboard</h1>

        {!supabase && (
          <p className="text-sub text-sm mb-6 p-4 bg-surface rounded-lg border border-border">
            Supabase not configured — add <code className="text-main">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-main">VITE_SUPABASE_ANON_KEY</code> to <code className="text-text">.env.local</code> to enable the global leaderboard.
          </p>
        )}

        {/* Mode tabs */}
        <div className="flex gap-1 mb-6 bg-surface p-1 rounded-lg w-fit border border-border">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveMode(m.key)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                activeMode === m.key
                  ? 'bg-border text-text'
                  : 'text-sub hover:text-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <LeaderboardTable data={data} loading={loading} fetchError={fetchError} username={username} />
      </div>
    </PageWrapper>
  )
}
