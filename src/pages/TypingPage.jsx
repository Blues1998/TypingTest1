import { useContext, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, useAnimation } from 'framer-motion'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { CharDisplay } from '../components/typing/CharDisplay.jsx'
import { TimerBar } from '../components/typing/TimerBar.jsx'
import { ResultsCard } from '../components/typing/ResultsCard.jsx'
import { useTypingTest } from '../hooks/useTypingTest.js'
import { useSound } from '../hooks/useSound.js'
import { getDifficulty } from '../utils/levelSystem.js'

const HINDI_PHONETIC_GUIDE = [
  { spelling: 'aa', sound: 'long a', example: 'baazaar' },
  { spelling: 'ee', sound: 'long i', example: 'meetha' },
  { spelling: 'oo', sound: 'long u', example: 'doodh' },
  { spelling: 'ai', sound: 'ai / ay', example: 'main' },
  { spelling: 'au', sound: 'ow', example: 'mausam' },
  { spelling: 'kh', sound: 'aspirated k', example: 'khaana' },
  { spelling: 'gh', sound: 'aspirated g', example: 'ghar' },
  { spelling: 'ch', sound: 'ch', example: 'achha' },
  { spelling: 'jh', sound: 'aspirated j', example: 'jhaad' },
  { spelling: 'th', sound: 'aspirated t', example: 'thanda' },
  { spelling: 'dh', sound: 'aspirated d', example: 'dhodh' },
  { spelling: 'bh', sound: 'aspirated b', example: 'bheed' },
  { spelling: 'sh', sound: 'sh', example: 'sheher' },
  { spelling: 'woh', sound: 'he / she', example: 'woh jaata' },
]

function HindiGuideModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', maxWidth: '480px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>Hindi phonetic mode</h2>
          <button onClick={onClose} className="text-xl leading-none transition-colors" style={{ color: 'var(--color-sub)' }}>×</button>
        </div>

        <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--color-sub)' }}>
          Sentences are written in <span style={{ color: 'var(--color-text)' }}>phonetic Roman script</span> — type exactly what you see using your regular keyboard.
          No special keyboard or IME needed.
        </p>

        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-sub)', borderLeft: '2px solid var(--color-main)', paddingLeft: '8px' }}>
          spelling conventions
        </p>
        <div className="flex flex-col gap-1.5 mb-5">
          {HINDI_PHONETIC_GUIDE.map(({ spelling, sound, example }) => (
            <div key={spelling} className="flex items-center gap-3 text-xs">
              <span className="font-mono font-semibold w-10 shrink-0" style={{ color: 'var(--color-main)' }}>{spelling}</span>
              <span className="w-24 shrink-0" style={{ color: 'var(--color-text)' }}>{sound}</span>
              <span style={{ color: 'var(--color-sub)' }}>e.g. <span className="font-mono">{example}</span></span>
            </div>
          ))}
        </div>

        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-sub)' }}>
          Double letters (e.g. <span className="font-mono" style={{ color: 'var(--color-text)' }}>bacche, achha</span>) indicate a short, clipped consonant sound. Hyphens are typed as-is.
        </p>
      </div>
    </div>
  )
}

function HindiWordDisplay({ text, chars, hindiText, caretIndex }) {
  const romanParts = text.split(/([ ]+)/)
  const hindiParts = hindiText.split(/([ ]+)/)

  let pos = 0
  const wordRanges = romanParts.map(part => {
    const start = pos
    pos += part.length
    return { start, end: pos }
  })

  return (
    <p className="text-xl leading-loose break-words" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
      {hindiParts.map((part, i) => {
        const { start, end } = wordRanges[i] || { start: 0, end: 0 }
        const isSpace = part === ' '
        let status = 'pending'
        if (end <= caretIndex) {
          status = chars.slice(start, end).every(c => c.status === 'correct') ? 'correct' : 'wrong'
        } else if (start < caretIndex) {
          status = 'typing'
        }
        return (
          <span
            key={i}
            style={{
              color: status === 'correct' ? 'var(--color-correct)'
                : status === 'wrong'   ? 'var(--color-wrong)'
                : status === 'typing'  ? 'var(--color-text)'
                : 'var(--color-sub)',
              borderBottom: status === 'typing' && !isSpace ? '2px solid var(--color-main)' : undefined,
            }}
          >
            {part}
          </span>
        )
      })}
    </p>
  )
}

export function TypingPage() {
  const { mode } = useParams()
  const [searchParams] = useSearchParams()
  const data = useContext(DataContext)

  const customText = searchParams.get('text')
  const difficulty = getDifficulty(mode)
  const duration = parseInt(searchParams.get('duration') || '60', 10)
  const wordCount = parseInt(searchParams.get('n') || '25', 10)

  const {
    text, chars, inputValue, caretIndex,
    phase, elapsed, remaining, results, restartKey,
    liveWpm, progress,
    ghostCaret, ghostWpm,
    author, hindiRef, wordsTyped,
    handleInput, handleKeyDown, handleKeyUp, restart,
  } = useTypingTest({ mode, data, difficulty, customText, duration, wordCount })

  const { playClick, playError } = useSound()
  const shakeControls = useAnimation()
  const [capsLock, setCapsLock] = useState(false)
  const [showHindiGuide, setShowHindiGuide] = useState(false)
  const caretStyle = localStorage.getItem('typingtest_caret_style') || 'line'
  const lang = localStorage.getItem('typingtest_lang') || 'en'

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

  function onKeyDown(e) {
    setCapsLock(e.getModifierState('CapsLock'))
    if (e.key === 'Escape' && phase !== 'finished') { e.preventDefault(); restart() }
    handleKeyDown(e)
  }

  function onKeyUp(e) {
    setCapsLock(e.getModifierState('CapsLock'))
    handleKeyUp(e)
  }

  const modeLabel = mode === 'countdown' ? `${duration}s`
    : mode === 'daily'   ? 'daily'
    : mode === 'words'   ? `${wordCount} words`
    : mode === 'quotes'  ? 'quotes'
    : 'stopwatch'

  const ghostDeltaSecs = (ghostCaret !== null && liveWpm && liveWpm > 0)
    ? ((caretIndex - ghostCaret) / (liveWpm * 5 / 60)).toFixed(1)
    : null

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sub text-xs">{modeLabel}</span>
            {mode !== 'quotes' && mode !== 'daily' && (
              <span className="text-sub text-xs capitalize">{difficulty}</span>
            )}
            {ghostWpm && (
              <span className="text-[#00ccff] text-xs">👻 vs {ghostWpm} wpm</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sub text-xs">tab + enter to restart</span>
            {lang === 'hi' && (
              <button
                onClick={() => setShowHindiGuide(true)}
                className="text-xs transition-colors"
                style={{ color: 'var(--color-sub)' }}
                title="transliteration guide"
              >
                ⌨ guide
              </button>
            )}
          </div>
        </div>

        <TimerBar
          mode={mode}
          elapsed={elapsed}
          remaining={remaining}
          duration={duration}
          wordCount={wordCount}
          wordsTyped={wordsTyped}
        />

        {/* Progress bar */}
        <div className="w-full h-px bg-[#222222] mb-6 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress * 100}%`, background: 'var(--color-border)', transition: 'width 0.05s linear' }}
          />
        </div>

        {capsLock && (
          <div className="text-center text-xs mb-3" style={{ color: 'var(--color-wrong)' }}>
            caps lock is on
          </div>
        )}

        {/* Typing area */}
        <div className="relative">
          <div className="absolute -top-5 right-0 flex items-center gap-3">
            {liveWpm !== null && (
              <span className="text-sub text-xs tabular-nums">{liveWpm} wpm</span>
            )}
            {ghostDeltaSecs !== null && phase === 'running' && (
              <span
                className="text-xs tabular-nums font-semibold"
                style={{ color: Number(ghostDeltaSecs) >= 0 ? 'var(--color-correct)' : 'var(--color-wrong)' }}
              >
                {Number(ghostDeltaSecs) >= 0 ? '+' : ''}{ghostDeltaSecs}s
              </span>
            )}
          </div>

          <motion.div animate={shakeControls}>
            {hindiRef ? (
              <HindiWordDisplay text={text} chars={chars} hindiText={hindiRef} caretIndex={caretIndex} />
            ) : (
              <CharDisplay chars={chars} caretIndex={caretIndex} ghostCaretIndex={ghostCaret} caretStyle={caretStyle} />
            )}
          </motion.div>

          {/* Quote author attribution */}
          {author && phase !== 'finished' && (
            <div className="mt-3 text-right text-sub text-xs italic">
              - {author}
            </div>
          )}

          <input
            key={restartKey}
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onPaste={e => e.preventDefault()}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={phase === 'finished'}
            className="absolute inset-0 opacity-0 cursor-default w-full h-full"
            aria-label="typing input"
          />
        </div>

        {phase === 'finished' && (
          <ResultsCard
            results={results}
            chars={chars}
            inputLength={inputValue.length}
            mode={mode}
            difficulty={difficulty}
            onRestart={() => restart()}
            onPracticeAgain={() => restart(true)}
            words={data?.words || []}
          />
        )}

        {phase === 'idle' && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <p className="text-sub text-xs">start typing to begin</p>
            <button
              onClick={() => restart()}
              title="new text (tab + enter)"
              className="text-sub hover:text-text transition-colors text-base leading-none"
            >
              ↺
            </button>
          </div>
        )}
      </div>

      {showHindiGuide && <HindiGuideModal onClose={() => setShowHindiGuide(false)} />}
    </PageWrapper>
  )
}
