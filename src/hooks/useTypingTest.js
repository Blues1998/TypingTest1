import { useState, useRef, useCallback, useEffect } from 'react'
import { calcWpm, calcAccuracy, calcConsistency } from '../utils/wpmCalc.js'
import { pickPassage } from '../utils/dataLoader.js'
import { savePersonalScore, getPersonalScores } from '../services/scoreService.js'
import { hashText } from '../utils/levelSystem.js'
import { recordDailyCompletion, getDailyStreak } from '../utils/streakUtils.js'
import { mutateText } from '../utils/textMutator.js'
import { checkAchievements } from '../utils/achievements.js'

function buildChars(text) {
  return text.split('').map(char => ({ char, status: 'pending' }))
}

function ghostKey(mode, difficulty, textHash) {
  return `ghost_${mode}_${difficulty}_${textHash}`
}

function resolveText(passage) {
  if (passage && typeof passage === 'object') {
    if ('roman' in passage) return passage.roman  // Hindi paired {roman, hindi}
    return passage.text                            // Quotes {text, author}
  }
  return passage || ''
}

function resolveAuthor(passage) {
  if (passage && typeof passage === 'object') return passage.author || null
  return null
}

function resolveHindi(passage) {
  if (passage && typeof passage === 'object' && 'hindi' in passage) return passage.hindi
  return null
}

function applyMutations(rawText, mode) {
  if (mode === 'code' || mode === 'daily' || mode === 'quotes') return rawText
  const numbers = localStorage.getItem('typingtest_numbers') === 'true'
  const punctuation = localStorage.getItem('typingtest_punctuation') === 'true'
  return mutateText(rawText, { numbers, punctuation })
}

export function useTypingTest({ mode, data, difficulty = 'standard', customText, enableGhost = false, duration = 60, wordCount = 0 }) {
  const sentences    = data?.sentences    || { standard: [] }
  const longTexts    = data?.longTexts    || { standard: [] }
  const codeSnippets = data?.codeSnippets || []
  const quotes       = data?.quotes       || []
  const words        = data?.words        || []

  const pickInitial = useCallback(() => {
    if (customText) return customText
    const passage = pickPassage(mode, difficulty, { sentences, longTexts, codeSnippets, quotes }, null, wordCount)
    return passage
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initialPassage = pickInitial()
  const initialText = applyMutations(resolveText(initialPassage), mode)
  const initialAuthor = resolveAuthor(initialPassage)
  const initialHindi = resolveHindi(initialPassage)

  const [text, setText]           = useState(() => initialText)
  const [author, setAuthor]       = useState(() => initialAuthor)
  const [hindiRef, setHindiRef]   = useState(() => initialHindi)
  const [chars, setChars]         = useState(() => buildChars(initialText))
  const [inputValue, setInputValue] = useState('')
  const [caretIndex, setCaretIndex] = useState(0)
  const [phase, setPhase]         = useState('idle')
  const [elapsed, setElapsed]     = useState(0)
  const [results, setResults]     = useState(null)
  const [restartKey, setRestartKey] = useState(0)
  const [ghostCaret, setGhostCaret] = useState(null)
  const [ghostWpm, setGhostWpm]   = useState(null)
  const [wordsTyped, setWordsTyped] = useState(0)

  const startTimeRef    = useRef(null)
  const timerRef        = useRef(null)
  const tabHeldRef      = useRef(false)
  const inputLengthRef  = useRef(0)
  const charsRef        = useRef(chars)
  const replayRef       = useRef([])
  const ghostReplayRef  = useRef(null)
  const textRef         = useRef(initialText)
  const customTextRef   = useRef(customText || null)
  const currentPassageRef = useRef(initialPassage)
  const wordTimingsRef  = useRef([])
  const keyDataRef      = useRef([])

  useEffect(() => { charsRef.current = chars }, [chars])

  useEffect(() => {
    const key = ghostKey(mode, difficulty, hashText(text))
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.text !== undefined && parsed.text !== text) return
        ghostReplayRef.current = parsed.replay
        setGhostWpm(parsed.wpm)
      } catch { /* ignore */ }
    }
  }, [text, mode, difficulty])

  const finishTest = useCallback(() => {
    clearInterval(timerRef.current)
    const finalElapsed = (performance.now() - startTimeRef.current) / 1000
    const finalWpm = calcWpm(inputLengthRef.current, finalElapsed)
    const finalAccuracy = calcAccuracy(charsRef.current, inputLengthRef.current)

    const textWords = textRef.current.split(' ')
    const boundaryTimes = [...wordTimingsRef.current, finalElapsed]
    const wordWpms = []
    let prevTime = 0
    for (let i = 0; i < Math.min(textWords.length, boundaryTimes.length, 60); i++) {
      const dt = boundaryTimes[i] - prevTime
      const wpm = dt > 0.05 ? Math.round((textWords[i].length / 5) / (dt / 60)) : 0
      wordWpms.push({ word: textWords[i].slice(0, 12), wpm: Math.min(Math.max(wpm, 0), 400) })
      prevTime = boundaryTimes[i]
    }

    const keyMap = {}
    for (const { key, correct } of keyDataRef.current) {
      if (!/[a-z]/.test(key)) continue
      if (!keyMap[key]) keyMap[key] = { total: 0, errors: 0 }
      keyMap[key].total++
      if (!correct) keyMap[key].errors++
    }
    const keyStats = Object.entries(keyMap)
      .map(([k, v]) => ({ key: k, accuracy: Math.round(((v.total - v.errors) / v.total) * 100), errors: v.errors, total: v.total }))

    const consistency = calcConsistency(wordWpms)
    const res = { wpm: finalWpm, accuracy: finalAccuracy, time: Math.round(finalElapsed * 10) / 10, wordWpms, keyStats, consistency }
    setResults(res)
    setPhase('finished')
    savePersonalScore({ wpm: finalWpm, accuracy: finalAccuracy, timeTaken: finalElapsed, mode, difficulty, consistency, keyStats })

    if (mode === 'daily') {
      recordDailyCompletion()
      const streak = getDailyStreak()
      res.streak = streak
    }

    // Achievement check — dispatches 'typingtest-achievements' event internally
    checkAchievements(getPersonalScores())

    // Ghost replay
    if (finalWpm > 0) {
      const key = ghostKey(mode, difficulty, hashText(textRef.current))
      const existing = localStorage.getItem(key)
      let existingWpm = 0
      try { existingWpm = existing ? (JSON.parse(existing).wpm ?? 0) : 0 } catch { /* ignore */ }
      if (finalWpm > existingWpm) {
        const mistakes = charsRef.current
          .slice(0, inputLengthRef.current)
          .filter(c => c.status !== 'correct')
          .length
        localStorage.setItem(key, JSON.stringify({
          wpm: finalWpm, accuracy: finalAccuracy, timeTaken: finalElapsed,
          mistakes, text: textRef.current, timestamp: Date.now(), replay: replayRef.current,
        }))
      }
    }
  }, [mode, difficulty])

  function startTest() {
    startTimeRef.current = performance.now()
    replayRef.current = []
    wordTimingsRef.current = []
    keyDataRef.current = []
    setPhase('running')
    timerRef.current = setInterval(() => {
      const el = (performance.now() - startTimeRef.current) / 1000
      setElapsed(el)

      replayRef.current.push({ ci: inputLengthRef.current, t: Math.round(el * 1000) })

      if (ghostReplayRef.current) {
        const tMs = el * 1000
        const frames = ghostReplayRef.current
        let frame = null
        for (let i = frames.length - 1; i >= 0; i--) {
          if (frames[i].t <= tMs) { frame = frames[i]; break }
        }
        if (frame) setGhostCaret(frame.ci)
      }

      if (mode === 'countdown' && el >= duration) finishTest()
    }, 100)
  }

  function handleInput(rawValue) {
    const newValue = rawValue.normalize('NFC')
    if (phase === 'finished') return
    if (phase === 'idle') startTest()

    const prevLen = inputLengthRef.current
    inputLengthRef.current = newValue.length

    if (newValue.length > prevLen && startTimeRef.current) {
      const el = (performance.now() - startTimeRef.current) / 1000
      for (let i = prevLen; i < Math.min(newValue.length, text.length); i++) {
        keyDataRef.current.push({ key: text[i].toLowerCase(), correct: newValue[i] === text[i] })
      }
      const lastI = newValue.length - 1
      if (lastI < text.length && text[lastI] === ' ' && newValue[lastI] === ' ') {
        wordTimingsRef.current.push(el)
        setWordsTyped(wordTimingsRef.current.length)
      }
    }

    const updated = text.split('').map((char, i) => ({
      char,
      status: i >= newValue.length ? 'pending'
            : newValue[i] === char  ? 'correct'
            :                         'wrong',
    }))
    const extras = newValue.slice(text.length).split('').map(char => ({ char, status: 'extra' }))
    const finalChars = [...updated, ...extras]

    charsRef.current = finalChars
    setChars(finalChars)
    setCaretIndex(newValue.length)
    setInputValue(newValue)

    if ((mode === 'stopwatch' || mode === 'daily' || mode === 'words' || mode === 'quotes') && newValue === text) finishTest()
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') { e.preventDefault(); tabHeldRef.current = true }
    if (e.key === 'Enter') {
      if (tabHeldRef.current) { e.preventDefault(); restart(); return }
      if ((mode === 'stopwatch' || mode === 'daily' || mode === 'words' || mode === 'quotes') && phase === 'running') {
        e.preventDefault(); finishTest()
      }
    }
  }

  function handleKeyUp(e) {
    if (e.key === 'Tab') tabHeldRef.current = false
  }

  function restart(keepText = false) {
    clearInterval(timerRef.current)
    tabHeldRef.current = false
    replayRef.current = []
    wordTimingsRef.current = []
    keyDataRef.current = []
    ghostReplayRef.current = null
    setGhostCaret(null)
    setGhostWpm(null)
    setWordsTyped(0)

    let newPassage
    if (keepText) {
      newPassage = currentPassageRef.current
    } else if (customTextRef.current) {
      newPassage = customTextRef.current
    } else {
      const prevRaw = typeof currentPassageRef.current === 'object'
        ? currentPassageRef.current
        : currentPassageRef.current
      newPassage = pickPassage(mode, difficulty, { sentences, longTexts, codeSnippets, quotes }, prevRaw, wordCount)
    }

    const newText = applyMutations(resolveText(newPassage), mode)
    const newAuthor = resolveAuthor(newPassage)

    textRef.current = newText
    currentPassageRef.current = newPassage
    setText(newText)
    setAuthor(newAuthor)
    setHindiRef(resolveHindi(newPassage))
    setChars(buildChars(newText))
    setInputValue('')
    setCaretIndex(0)
    setPhase('idle')
    setElapsed(0)
    setResults(null)
    inputLengthRef.current = 0
    setRestartKey(k => k + 1)

    const key = ghostKey(mode, difficulty, hashText(newText))
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.text !== undefined && parsed.text !== newText) return
        ghostReplayRef.current = parsed.replay
        setGhostWpm(parsed.wpm)
      } catch { /* ignore */ }
    }
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const remaining = Math.max(0, duration - elapsed)
  const liveWpm = (phase === 'running' && elapsed > 3)
    ? calcWpm(inputLengthRef.current, elapsed) : null
  const progress = text.length > 0 ? Math.min(inputLengthRef.current / text.length, 1) : 0

  return {
    text, chars, inputValue, caretIndex,
    phase, elapsed, remaining, results, restartKey,
    liveWpm, progress,
    ghostCaret, ghostWpm,
    author, hindiRef,
    wordsTyped,
    handleInput, handleKeyDown, handleKeyUp, restart,
  }
}
