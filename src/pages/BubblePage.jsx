import { useState, useContext, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { BubbleCanvas } from '../components/bubble/BubbleCanvas.jsx'
import { BubbleHUD } from '../components/bubble/BubbleHUD.jsx'
import { UsernameModal } from '../components/leaderboard/UsernameModal.jsx'
import { useBubbleGame } from '../hooks/useBubbleGame.js'
import { useLeaderboardSubmit } from '../hooks/useLeaderboardSubmit.js'
import { getDifficulty, setDifficulty, BUBBLE_TIERS } from '../utils/levelSystem.js'
import { useSound } from '../hooks/useSound.js'
import { supabase } from '../services/supabase.js'

function BubbleLeaderboardSubmit({ score, timeTaken }) {
  const { showModal, setShowModal, submitted, submitting, submitError, myRank, handleSubmitClick, handleModalConfirm } =
    useLeaderboardSubmit({ mode: 'bubble', wpm: score, accuracy: 100, timeTaken })

  if (!supabase) return null

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <UsernameModal onConfirm={handleModalConfirm} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {!submitted && (
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
    </>
  )
}

export function BubblePage() {
  const { words } = useContext(DataContext)
  const canvasRef = useRef(null)
  const { playBoom, playClick } = useSound()

  const [difficulty, setDifficultyState] = useState(() => {
    const saved = getDifficulty('bubble')
    return BUBBLE_TIERS.includes(saved) ? saved : 'pilot'
  })

  function handleDifficultyChange(tier) {
    setDifficulty('bubble', tier)
    setDifficultyState(tier)
  }

  const { score, strikes, wave, phase, timeTaken, inputRef, handleWordInput, start, restart, CANVAS_W, CANVAS_H } =
    useBubbleGame({ canvasRef, words, difficulty, onDestroy: playBoom, onInput: playClick })

  return (
    <PageWrapper>
      <div className="flex flex-col items-center px-4 py-8 gap-2">
        <BubbleHUD
          score={score}
          strikes={strikes}
          wave={wave}
          inputRef={inputRef}
          onInput={handleWordInput}
          phase={phase}
          onStart={start}
          onRestart={restart}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
        />
        {phase === 'gameover' && (
          <BubbleLeaderboardSubmit key={`${score}-${timeTaken}`} score={score} timeTaken={timeTaken} />
        )}
        <BubbleCanvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
      </div>
    </PageWrapper>
  )
}
