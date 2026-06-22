import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { getGhostRuns } from '../services/ghostService.js'

function formatDate(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function DifficultyBadge({ difficulty }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full border shrink-0"
      style={{ borderColor: 'var(--color-main)', color: 'var(--color-main)' }}
    >
      {difficulty}
    </span>
  )
}

function GhostRunCard({ run, isExpanded, onToggle, onStart }) {
  const snippet = run.text.length > 72 ? run.text.slice(0, 72) + '…' : run.text

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onToggle}
      className="p-5 bg-surface border rounded-xl cursor-pointer hover:border-main transition-colors duration-150"
      style={{ borderColor: isExpanded ? 'var(--color-main)' : 'var(--color-border)' }}
    >
      {/* Always-visible header row */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-text text-sm font-mono leading-snug flex-1 min-w-0">
          {snippet}
        </p>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <DifficultyBadge difficulty={run.difficulty} />
          <span className="text-sub text-[10px]">{formatDate(run.timestamp)}</span>
        </div>
      </div>

      {/* Collapsed stats */}
      {!isExpanded && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="text-main font-semibold">{run.wpm} wpm</span>
          <span className="text-sub">{run.accuracy}% accuracy</span>
          <span className="text-sub">{run.timeTaken.toFixed(1)}s</span>
          <span className="text-sub">{run.mistakes} mistakes</span>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Full text */}
          <div className="mt-4 p-3 rounded-lg max-h-40 overflow-y-auto" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <p className="text-text text-xs font-mono leading-relaxed whitespace-pre-wrap">{run.text}</p>
          </div>

          {/* Full stats */}
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <div className="text-sub text-[10px] uppercase tracking-wider mb-0.5">wpm</div>
              <div className="text-main font-bold text-xl tabular-nums">{run.wpm}</div>
            </div>
            <div>
              <div className="text-sub text-[10px] uppercase tracking-wider mb-0.5">accuracy</div>
              <div className="text-text font-semibold text-xl tabular-nums">{run.accuracy}%</div>
            </div>
            <div>
              <div className="text-sub text-[10px] uppercase tracking-wider mb-0.5">time</div>
              <div className="text-text font-semibold text-xl tabular-nums">{run.timeTaken.toFixed(1)}s</div>
            </div>
            <div>
              <div className="text-sub text-[10px] uppercase tracking-wider mb-0.5">mistakes</div>
              <div className="font-semibold text-xl tabular-nums" style={{ color: run.mistakes === 0 ? 'var(--color-correct)' : 'var(--color-wrong)' }}>
                {run.mistakes}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={e => { e.stopPropagation(); onStart() }}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-main)', color: 'var(--color-bg)' }}
            >
              start race
            </button>
            <button
              onClick={e => { e.stopPropagation(); onToggle() }}
              className="px-6 py-2 rounded-lg text-sm text-sub hover:text-text transition-colors"
              style={{ background: 'var(--color-border)' }}
            >
              close
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function GhostLobbyPage() {
  const navigate = useNavigate()
  const [runs] = useState(() => getGhostRuns())
  const [selectedKey, setSelectedKey] = useState(null)

  function toggle(key) {
    setSelectedKey(prev => prev === key ? null : key)
  }

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-start justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-text text-2xl font-bold">ghost race</h1>
            <p className="text-sub text-xs mt-1">race against your previous best runs</p>
          </div>
          <button
            onClick={() => navigate('/type/stopwatch')}
            className="px-4 py-2 rounded-lg text-sm text-sub hover:text-text transition-colors shrink-0"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            new text →
          </button>
        </motion.div>

        {/* Empty state */}
        {runs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-5xl mb-5 opacity-25">👻</div>
            <p className="text-sub text-sm mb-1">no ghost runs recorded yet</p>
            <p className="text-sub text-xs mb-8">complete a stopwatch test to save your first ghost</p>
            <button
              onClick={() => navigate('/type/stopwatch')}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--color-main)', color: 'var(--color-bg)' }}
            >
              start a run
            </button>
          </motion.div>
        )}

        {/* Run cards */}
        {runs.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {runs.map(run => (
                <GhostRunCard
                  key={run.key}
                  run={run}
                  isExpanded={selectedKey === run.key}
                  onToggle={() => toggle(run.key)}
                  onStart={() => navigate(`/type/stopwatch?text=${encodeURIComponent(run.text)}&difficulty=${encodeURIComponent(run.difficulty || 'standard')}`)}
                />
              ))}
            </div>
            <p className="text-center text-sub text-xs mt-8">
              runs are saved automatically after each stopwatch test
            </p>
          </>
        )}
      </div>
    </PageWrapper>
  )
}
