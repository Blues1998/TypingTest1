import { useState, useRef, useEffect, useCallback } from 'react'
import { savePersonalScore, getPersonalScores } from '../services/scoreService.js'
import { checkAchievements } from '../utils/achievements.js'

function extractWords(sentences) {
  const raw = sentences.flatMap(s =>
    s.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length >= 3)
  )
  for (let i = raw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [raw[i], raw[j]] = [raw[j], raw[i]]
  }
  return raw
}

const STARTING_TIME = 30.0
const TIME_CAP      = 90.0
const CORRECT_BONUS =  1.5
const WRONG_PENALTY =  1.5
const TICK_MS       = 50

export function useSurvival({ sentences = [] }) {
  const wordPool           = useRef(extractWords(sentences))
  const wordIndexRef       = useRef(0)
  const timeRef            = useRef(STARTING_TIME)
  const scoreRef           = useRef(0)
  const timerRef           = useRef(null)
  const lastResultTimerRef = useRef(null)
  const phaseRef           = useRef('running')
  const startTimeRef       = useRef(Date.now())

  const [currentWord, setCurrentWord] = useState(() => wordPool.current[0] || '')
  const [inputValue,  setInputValue]  = useState('')
  const [timeDisplay, setTimeDisplay] = useState(STARTING_TIME)
  const [score,       setScore]       = useState(0)
  const [phase,       setPhase]       = useState('running')
  const [lastResult,  setLastResult]  = useState(null) // 'correct' | 'wrong'
  const [liveWpm,     setLiveWpm]     = useState(0)
  const [isNewPB,     setIsNewPB]     = useState(false)

  function advanceWord() {
    wordIndexRef.current = (wordIndexRef.current + 1) % wordPool.current.length
    setCurrentWord(wordPool.current[wordIndexRef.current])
  }

  const endGame = useCallback(() => {
    clearInterval(timerRef.current)
    phaseRef.current = 'dead'
    setPhase('dead')

    const finalScore = scoreRef.current
    savePersonalScore({ wpm: finalScore, accuracy: 100, timeTaken: 30, mode: 'survival' })
    checkAchievements(getPersonalScores())

    // Check personal best (compare against prior runs, excluding this one)
    const prevScores = getPersonalScores('survival')
    const prevBest = prevScores.length > 1
      ? Math.max(...prevScores.slice(0, -1).map(s => s.wpm))
      : 0
    if (finalScore > prevBest) setIsNewPB(true)
  }, [])

  useEffect(() => {
    if (wordPool.current.length === 0) return
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - TICK_MS / 1000)
      setTimeDisplay(Math.max(0, timeRef.current))

      // Update live WPM
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000
      if (elapsedSec > 2) {
        setLiveWpm(Math.round((scoreRef.current * 5) / (elapsedSec / 60)))
      }

      if (timeRef.current <= 0 && phaseRef.current === 'running') {
        endGame()
      }
    }, TICK_MS)

    return () => clearInterval(timerRef.current)
  }, [endGame])

  function handleInput(e) {
    const val = e.target.value
    if (val.endsWith(' ') || val.endsWith('\n')) {
      const typed = val.trim()
      if (typed === currentWord) {
        timeRef.current = Math.min(TIME_CAP, timeRef.current + CORRECT_BONUS)
        scoreRef.current++
        setScore(scoreRef.current)
        setLastResult('correct')
      } else if (typed.length > 0) {
        timeRef.current = Math.max(0, timeRef.current - WRONG_PENALTY)
        setLastResult('wrong')
      }
      advanceWord()
      setInputValue('')
      clearTimeout(lastResultTimerRef.current)
      lastResultTimerRef.current = setTimeout(() => setLastResult(null), 350)
      return
    }
    setInputValue(val)
  }

  function restart() {
    clearInterval(timerRef.current)
    wordPool.current = extractWords(sentences)
    wordIndexRef.current = 0
    timeRef.current = STARTING_TIME
    scoreRef.current = 0
    phaseRef.current = 'running'
    startTimeRef.current = Date.now()

    setCurrentWord(wordPool.current[0] || '')
    setInputValue('')
    setTimeDisplay(STARTING_TIME)
    setScore(0)
    setPhase('running')
    setLastResult(null)
    setLiveWpm(0)
    setIsNewPB(false)

    timerRef.current = setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - TICK_MS / 1000)
      setTimeDisplay(Math.max(0, timeRef.current))

      const elapsedSec = (Date.now() - startTimeRef.current) / 1000
      if (elapsedSec > 2) {
        setLiveWpm(Math.round((scoreRef.current * 5) / (elapsedSec / 60)))
      }

      if (timeRef.current <= 0 && phaseRef.current === 'running') {
        endGame()
      }
    }, TICK_MS)
  }

  return { currentWord, inputValue, timeDisplay, score, phase, lastResult, liveWpm, isNewPB, handleInput, restart, TIME_CAP }
}
