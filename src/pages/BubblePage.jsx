import { useContext, useRef } from 'react'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { BubbleCanvas } from '../components/bubble/BubbleCanvas.jsx'
import { BubbleHUD } from '../components/bubble/BubbleHUD.jsx'
import { useBubbleGame } from '../hooks/useBubbleGame.js'
import { getDifficulty } from '../utils/levelSystem.js'
import { useSound } from '../hooks/useSound.js'

export function BubblePage() {
  const { words } = useContext(DataContext)
  const canvasRef = useRef(null)
  const difficulty = getDifficulty('bubble')
  const { playBoom, playClick } = useSound()

  const { score, strikes, wave, phase, inputRef, handleWordInput, restart, CANVAS_W, CANVAS_H } =
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
          onRestart={restart}
          difficulty={difficulty}
        />
        <BubbleCanvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
      </div>
    </PageWrapper>
  )
}
