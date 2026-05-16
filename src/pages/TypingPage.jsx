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

const HINDI_VOWELS = [
  ['a','अ'],['aa','आ'],['i','इ'],['ee','ई'],
  ['u','उ'],['oo','ऊ'],['e','ए'],['ai','ऐ'],
  ['o','ओ'],['au','औ'],
]
const HINDI_CONSONANTS = [
  ['k','क'],['kh','ख'],['g','ग'],['gh','घ'],
  ['ch','च'],['chh','छ'],['j','ज'],['jh','झ'],
  ['t','त'],['th','थ'],['d','द'],['dh','ध'],
  ['n','न'],['p','प'],['ph/f','फ'],['b','ब'],
  ['bh','भ'],['m','म'],['y','य'],['r','र'],
  ['l','ल'],['v/w','व'],['sh','श'],['s','स'],
  ['h','ह'],['T','ट'],['Th','ठ'],['D','ड'],
  ['Dh','ढ'],['N','ण'],['Sh','ष'],['ng','ं'],
]

function MapEntry({ lat, dev }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-main)' }}>{lat}</span>
      <span className="text-[10px]" style={{ color: 'var(--color-sub)' }}>→</span>
      <span className="text-sm" style={{ color: 'var(--color-text)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{dev}</span>
    </div>
  )
}

function HindiGuideModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', maxWidth: '520px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>Hindi transliteration guide</h2>
          <button onClick={onClose} className="text-xl leading-none transition-colors" style={{ color: 'var(--color-sub)' }}>×</button>
        </div>

        <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--color-sub)' }}>
          Enable <span style={{ color: 'var(--color-text)' }}>Hindi – Transliteration</span> in your OS keyboard settings
          (macOS: System Settings → Keyboard → Input Sources) or install{' '}
          <span style={{ color: 'var(--color-text)' }}>Google Input Tools</span> in Chrome.
          Type the Latin sequence — your IME converts it to Devanagari automatically.
        </p>

        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--color-sub)', borderLeft: '2px solid var(--color-main)', paddingLeft: '8px' }}>
          vowels · स्वर
        </p>
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {HINDI_VOWELS.map(([lat, dev]) => <MapEntry key={lat} lat={lat} dev={dev} />)}
        </div>

        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--color-sub)', borderLeft: '2px solid var(--color-main)', paddingLeft: '8px' }}>
          consonants · व्यंजन
        </p>
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {HINDI_CONSONANTS.map(([lat, dev]) => <MapEntry key={lat} lat={lat} dev={dev} />)}
        </div>

        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-sub)' }}>
          Capital <span className="font-mono" style={{ color: 'var(--color-text)' }}>T Th D Dh N</span> = retroflex consonants ·
          vowels attach to the preceding consonant automatically · double a consonant letter to add a halant (्)
        </p>
      </div>
    </div>
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
    author, wordsTyped,
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
            <CharDisplay chars={chars} caretIndex={caretIndex} ghostCaretIndex={ghostCaret} caretStyle={caretStyle} />
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
