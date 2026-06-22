import { useContext, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { UsernameModal } from '../components/leaderboard/UsernameModal.jsx'
import { useSurvival } from '../hooks/useSurvival.js'
import { getPersonalScores } from '../services/scoreService.js'
import { useLeaderboardSubmit } from '../hooks/useLeaderboardSubmit.js'
import { supabase } from '../services/supabase.js'

function TimerDisplay({ time, cap }) {
  const pct = Math.min(time / cap, 1) * 100
  const color = time < 5 ? 'var(--color-wrong)' : time < 10 ? '#ff8844' : 'var(--color-correct)'

  return (
    <div className="w-full mb-8">
      <div className="flex items-baseline justify-center gap-2 mb-3">
        <span
          className="text-6xl font-bold tabular-nums"
          style={{ color, transition: 'color 0.3s' }}
        >
          {time.toFixed(1)}
        </span>
        <span className="text-sub text-sm">seconds</span>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: 'width 0.05s linear, background 0.3s',
          }}
        />
      </div>
    </div>
  )
}

function SurvivalResults({ score, isNewPB, onRestart }) {
  const { showModal, setShowModal, submitted, submitting, submitError, myRank, handleSubmitClick, handleModalConfirm } =
    useLeaderboardSubmit({ mode: 'survival', wpm: score, accuracy: 100, timeTaken: 30 })

  const prevScores = getPersonalScores('survival')
  const prevBest = prevScores.length > 1
    ? Math.max(...prevScores.slice(0, -1).map(s => s.wpm))
    : 0

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <UsernameModal onConfirm={handleModalConfirm} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {isNewPB && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.3 }}
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--color-main)' }}
          >
            ★ new personal best
          </motion.div>
        )}

        <div className="text-wrong text-3xl font-bold mb-3">time's up</div>

        <div className="flex gap-8 justify-center mb-6">
          <div>
            <div className="text-4xl font-bold text-main tabular-nums">{score}</div>
            <div className="text-xs text-sub mt-1">words</div>
          </div>
          {prevBest > 0 && (
            <div>
              <div className="text-4xl font-bold text-sub tabular-nums">{prevBest}</div>
              <div className="text-xs text-sub mt-1">best</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onRestart}
            className="px-7 py-2 bg-border text-text rounded-lg font-semibold text-sm hover:bg-btn-hover transition-colors"
          >
            try again
          </button>
          {!submitted && supabase && (
            <button
              onClick={handleSubmitClick}
              disabled={submitting}
              className="px-7 py-2 bg-main text-bg rounded-lg font-semibold text-sm hover:bg-main transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'saving...' : 'save to leaderboard'}
            </button>
          )}
          {submitted && (
            <span className="px-6 py-2 text-correct text-sm">
              saved!{myRank !== null && <span className="text-sub ml-2">rank: <span style={{ color: 'var(--color-main)' }}>#{myRank}</span></span>}
            </span>
          )}
          {submitError && <span className="text-wrong text-sm">{submitError}</span>}
        </div>
      </motion.div>
    </>
  )
}

export function SurvivalPage() {
  const { sentences } = useContext(DataContext)
  const allSentences = [
    ...(sentences?.rookie   || []),
    ...(sentences?.standard || []),
  ]

  const inputRef = useRef(null)

  const {
    currentWord, inputValue, timeDisplay, score, liveWpm,
    phase, lastResult, isNewPB, handleInput, restart, TIME_CAP,
  } = useSurvival({ sentences: allSentences })

  useEffect(() => {
    if (phase === 'running') inputRef.current?.focus()
  }, [phase])

  // Escape resets to a new game
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && phase === 'running') restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, restart])

  return (
    <PageWrapper>
      <div className="max-w-md mx-auto px-6 py-12 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
          <span className="text-sub text-xs">survival</span>
          <span className="text-sub text-xs">space or enter to submit</span>
        </div>

        {/* Timer */}
        <TimerDisplay time={timeDisplay} cap={TIME_CAP} />

        {/* Score + live WPM */}
        <div className="flex gap-6 text-sub text-sm mb-8">
          <span>words: <span className="text-text font-semibold tabular-nums">{score}</span></span>
          {liveWpm > 0 && (
            <span>wpm: <span className="text-text font-semibold tabular-nums">{liveWpm}</span></span>
          )}
        </div>

        {/* Current word with char-level coloring */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
            className="text-5xl font-bold mb-8 font-mono select-none"
          >
            {currentWord.split('').map((ch, i) => {
              const typed = inputValue[i]
              const color = typed === undefined
                ? 'var(--color-sub)'
                : typed === ch ? 'var(--color-correct)' : 'var(--color-wrong)'
              return (
                <span key={i} style={{ color, transition: 'color 80ms' }}>{ch}</span>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        {phase === 'running' && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInput}
            onPaste={e => e.preventDefault()}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="type word then space..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-center text-text text-lg font-mono focus:outline-none focus:border-main transition-colors"
          />
        )}

        {/* Word result flash */}
        {phase === 'running' && (
          <div className="h-5 mt-2 flex items-center justify-center">
            {lastResult === 'correct' && (
              <span className="text-xs font-semibold" style={{ color: 'var(--color-correct)' }}>+1.5s ✓</span>
            )}
            {lastResult === 'wrong' && (
              <span className="text-xs font-semibold" style={{ color: 'var(--color-wrong)' }}>-1.5s ✗</span>
            )}
          </div>
        )}

        {/* Feedback legend */}
        {phase === 'running' && (
          <div className="flex gap-6 mt-2 text-xs text-sub">
            <span><span style={{ color: 'var(--color-correct)' }}>+{1.5}s</span> correct</span>
            <span><span style={{ color: 'var(--color-wrong)' }}>-{1.5}s</span> wrong</span>
          </div>
        )}

        {/* Game over */}
        {phase === 'dead' && (
          <SurvivalResults score={score} isNewPB={isNewPB} onRestart={restart} />
        )}
      </div>
    </PageWrapper>
  )
}
