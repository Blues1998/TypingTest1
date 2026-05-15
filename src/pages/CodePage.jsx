import { useContext, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { CharDisplay } from '../components/typing/CharDisplay.jsx'
import { ResultsCard } from '../components/typing/ResultsCard.jsx'
import { useTypingTest } from '../hooks/useTypingTest.js'
import { useSound } from '../hooks/useSound.js'

function detectLanguage(code) {
  return /\bdef \b|\bclass \b/.test(code) ? 'python' : 'javascript'
}

export function CodePage() {
  const data = useContext(DataContext)
  const { playClick, playError } = useSound()
  const shakeControls = useAnimation()
  const caretStyle = localStorage.getItem('typingtest_caret_style') || 'line'

  const {
    text, chars, inputValue, caretIndex,
    phase, elapsed, results, restartKey,
    liveWpm, progress,
    handleInput, handleKeyDown, handleKeyUp, restart,
  } = useTypingTest({ mode: 'code', data, difficulty: 'standard' })

  const language = detectLanguage(text)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && phase !== 'finished') { e.preventDefault(); restart() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, restart])

  function onInputChange(e) {
    const newVal = e.target.value
    const prev = inputValue
    if (newVal.length > prev.length) {
      const i = newVal.length - 1
      if (i < text.length && newVal[i] !== text[i]) {
        playError()
        shakeControls.start({ x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.2 } })
      } else {
        playClick()
      }
    }
    handleInput(newVal)
  }

  const secs = Math.floor(elapsed)
  const ms   = Math.floor((elapsed % 1) * 10)

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sub text-xs">code snippets</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border border-border text-sub"
            >
              {language}
            </span>
          </div>
          <span className="text-sub text-xs">tab + enter to restart</span>
        </div>

        {/* Elapsed timer */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sub text-xs tabular-nums">{secs}.{ms}s</span>
          {liveWpm !== null && (
            <span className="text-sub text-xs tabular-nums">{liveWpm} wpm</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-px bg-border mb-6 rounded-full overflow-hidden">
          <div
            className="h-full bg-main rounded-full"
            style={{ width: `${progress * 100}%`, transition: 'width 0.05s linear' }}
          />
        </div>

        {/* Code area */}
        <div className="relative p-5 bg-code-bg border border-border rounded-xl">
          <motion.div animate={shakeControls}>
            <CharDisplay
              chars={chars}
              caretIndex={caretIndex}
              isCode
              caretStyle={caretStyle}
            />
          </motion.div>

          <input
            key={restartKey}
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onPaste={e => e.preventDefault()}
            disabled={phase === 'finished'}
            className="absolute inset-0 opacity-0 cursor-default w-full h-full"
            aria-label="code input"
          />
        </div>

        {phase === 'finished' && (
          <ResultsCard
            results={results}
            chars={chars}
            inputLength={inputValue.length}
            mode="code"
            onRestart={restart}
            onPracticeAgain={() => restart(true)}
          />
        )}

        {phase === 'idle' && (
          <p className="text-center text-sub text-xs mt-4">start typing to begin</p>
        )}
      </div>
    </PageWrapper>
  )
}
