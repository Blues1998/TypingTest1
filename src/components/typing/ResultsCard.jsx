import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UsernameModal } from '../leaderboard/UsernameModal.jsx'
import { getPersonalScores } from '../../services/scoreService.js'
import { supabase } from '../../services/supabase.js'
import { useLeaderboardSubmit } from '../../hooks/useLeaderboardSubmit.js'
import { WordChart } from './WordChart.jsx'
import { KeyboardHeatmap } from './KeyboardHeatmap.jsx'
import { buildWeakKeyText } from '../../utils/weakKeyDrill.js'
import { getDailyStreak } from '../../utils/streakUtils.js'
import { useTheme } from '../../hooks/useTheme.js'
import { downloadResultsImage } from '../../utils/shareUtils.js'

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    setValue(0)
    const start = performance.now()
    let rafId
    function step(now) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])
  return value
}

function MistakeBreakdown({ chars, inputLength }) {
  if (!chars || inputLength === 0) return null
  const wrong = chars.slice(0, inputLength).filter(c => c.status === 'wrong').map(c => c.char)
  if (wrong.length === 0) return null

  const counts = wrong.reduce((acc, ch) => { acc[ch] = (acc[ch] || 0) + 1; return acc }, {})
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div className="text-xs text-sub mt-1 text-center">
      most missed:{' '}
      {sorted.map(([ch, n]) => (
        <span key={ch} className="font-mono mr-2" style={{ color: '#ff8844' }}>
          {ch === ' ' ? 'space' : ch} ({n}x)
        </span>
      ))}
    </div>
  )
}

export function ResultsCard({ results, chars = [], inputLength = 0, mode, difficulty = null, onRestart, onPracticeAgain, words = [] }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const mistakes = chars.slice(0, inputLength).filter(c => c.status === 'wrong').length
  const [shared, setShared] = useState(false)
  const [savedImg, setSavedImg] = useState(false)

  const { showModal, setShowModal, submitted, submitting, submitError, myRank, handleSubmitClick, handleModalConfirm } =
    useLeaderboardSubmit({ mode, wpm: results?.wpm ?? 0, accuracy: results?.accuracy ?? 0, timeTaken: results?.time ?? 0, difficulty })

  const prevScores = useMemo(() => getPersonalScores(mode), [mode])
  const prevBest = prevScores.length > 1
    ? Math.max(...prevScores.slice(0, -1).map(s => s.wpm))
    : 0
  const isNewPB = results && results.valid && results.wpm > 0 && results.wpm > prevBest

  const streak = mode === 'daily' ? getDailyStreak() : 0

  const displayWpm  = useCountUp(results?.wpm)
  const displayAcc  = useCountUp(results?.accuracy)
  const displayCons = useCountUp(results?.consistency ?? 0)

  function handleShare() {
    const parts = [`${results.wpm} WPM`, `${results.accuracy}% acc`]
    if (results.consistency != null) parts.push(`${results.consistency}% consistency`)
    navigator.clipboard.writeText(parts.join(' · ') + ' - typetest').then(() => {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    })
  }

  function handleSaveImage() {
    downloadResultsImage(results, mode, difficulty, isDark)
    setSavedImg(true)
    setTimeout(() => setSavedImg(false), 2000)
  }

  function handleWeakKeyDrill() {
    if (!results?.keyStats || !words.length) return
    const drillText = buildWeakKeyText(results.keyStats, words)
    if (drillText) navigate(`/type/stopwatch?text=${encodeURIComponent(drillText)}`)
  }

  if (!results) return null

  if (results.wpm === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="mt-10 p-8 bg-surface rounded-2xl border border-border text-center"
      >
        <div className="text-sub text-sm mb-4">nothing typed - give it a go!</div>
        <button
          onClick={onRestart}
          className="px-6 py-2 rounded-lg bg-main text-bg text-sm font-semibold hover:bg-main transition-colors"
        >
          try again
        </button>
      </motion.div>
    )
  }

  const hasWeakKeys = results.keyStats?.some(s => s.total >= 2 && s.accuracy < 90)

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <UsernameModal onConfirm={handleModalConfirm} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="mt-10 p-8 bg-surface rounded-2xl border border-border"
      >
        {isNewPB && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.6 }}
            className="text-center text-sm font-semibold mb-5"
            style={{ color: 'var(--color-main)' }}
          >
            ★ new personal best
          </motion.div>
        )}

        {!results.valid && (
          <div className="text-center text-xs text-sub mb-4">
            not counted — accuracy too low or test too short
          </div>
        )}

        {/* Daily streak */}
        {mode === 'daily' && streak > 0 && (
          <div className="text-center text-xs text-sub mb-4">
            🔥 <span className="text-main font-semibold">{streak}</span> day streak
          </div>
        )}

        {/* Main stats */}
        <div className="flex flex-wrap gap-8 justify-center mb-2">
          <div className="text-center">
            <div className="text-6xl font-bold text-main tabular-nums">{displayWpm}</div>
            <div className="text-sm text-sub mt-1">wpm</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-text tabular-nums">{displayAcc}%</div>
            <div className="text-sm text-sub mt-1">accuracy</div>
          </div>
          {results.consistency != null && (
            <div className="text-center">
              <div className="text-6xl font-bold text-text tabular-nums">{displayCons}%</div>
              <div className="text-sm text-sub mt-1">consistency</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-6xl font-bold text-text tabular-nums">{results.time}s</div>
            <div className="text-sm text-sub mt-1">time</div>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold text-wrong tabular-nums">{mistakes}</div>
            <div className="text-sm text-sub mt-1">mistakes</div>
          </div>
        </div>

        <MistakeBreakdown chars={chars} inputLength={inputLength} />
        <WordChart wordWpms={results.wordWpms} />
        <KeyboardHeatmap keyStats={results.keyStats} />

        {/* Weak key drill prompt */}
        {hasWeakKeys && words.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={handleWeakKeyDrill}
              className="text-xs text-sub hover:text-main transition-colors underline underline-offset-2"
            >
              practice your weak keys →
            </button>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {onPracticeAgain && (
            <button
              onClick={onPracticeAgain}
              className="px-6 py-2 rounded-lg bg-border text-text hover:bg-btn-hover transition-colors text-sm"
              title="Retry this exact text"
            >
              try again
            </button>
          )}
          <button
            onClick={onRestart}
            className="px-6 py-2 rounded-lg bg-border text-text hover:bg-btn-hover transition-colors text-sm"
            title="Pick a new random text"
          >
            {onPracticeAgain ? 'new text' : 'try again'}
          </button>
          {!submitted && supabase && results.valid && (
            <button
              onClick={handleSubmitClick}
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-main text-bg hover:bg-main transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'saving...' : 'save to leaderboard'}
            </button>
          )}
          {submitted && (
            <span className="px-6 py-2 text-correct text-sm">
              saved!{myRank !== null && <span className="text-sub ml-2">your rank: <span style={{ color: 'var(--color-main)' }}>#{myRank}</span></span>}
            </span>
          )}
          <button
            onClick={handleShare}
            className="px-6 py-2 rounded-lg bg-border text-sub hover:text-text hover:bg-btn-hover transition-colors text-sm"
          >
            {shared ? 'copied!' : 'share'}
          </button>
          <button
            onClick={handleSaveImage}
            className="px-6 py-2 rounded-lg bg-border text-sub hover:text-text hover:bg-btn-hover transition-colors text-sm"
          >
            {savedImg ? 'saved!' : 'save image'}
          </button>
          {submitError && (
            <span className="px-6 py-2 text-wrong text-sm">{submitError}</span>
          )}
        </div>
      </motion.div>
    </>
  )
}
