import { useState, useContext, useRef } from 'react'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { BubbleCanvas } from '../components/bubble/BubbleCanvas.jsx'
import { BubbleHUD } from '../components/bubble/BubbleHUD.jsx'
import { useBubbleGame } from '../hooks/useBubbleGame.js'
import { getDifficulty, setDifficulty, BUBBLE_TIERS } from '../utils/levelSystem.js'
import { useSound } from '../hooks/useSound.js'

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

  const { score, strikes, wave, phase, inputRef, handleWordInput, start, restart, CANVAS_W, CANVAS_H } =
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
        <BubbleCanvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
      </div>
    </PageWrapper>
  )
}
