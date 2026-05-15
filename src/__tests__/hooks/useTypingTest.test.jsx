import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypingTest } from '../../hooks/useTypingTest.js'

// ── Mock heavyweight dependencies ─────────────────────────────────────────────

vi.mock('../../services/scoreService.js', () => ({
  savePersonalScore: vi.fn(),
  getPersonalScores: vi.fn(() => []),
}))

vi.mock('../../utils/achievements.js', () => ({
  checkAchievements: vi.fn(),
}))

vi.mock('../../utils/streakUtils.js', () => ({
  recordDailyCompletion: vi.fn(),
  getDailyStreak: vi.fn(() => 0),
}))

// ── Minimal data fixture ──────────────────────────────────────────────────────

const DATA = {
  words: ['the', 'quick', 'brown', 'fox'],
  sentences: {
    rookie:   ['Short text.'],
    standard: ['Hello world test.'],
    advanced: ['Advanced text here.'],
    elite:    ['Elite text sample.'],
  },
  longTexts: {
    standard: ['Long standard text here for countdown.'],
    advanced: ['Long advanced text.'],
    elite:    ['Long elite text.'],
  },
  codeSnippets: ['const x = 1;'],
  quotes: [{ text: 'To be or not.', author: 'Shakespeare' }],
}

function renderTypingHook(overrides = {}) {
  return renderHook(() =>
    useTypingTest({
      mode: 'stopwatch',
      data: DATA,
      difficulty: 'standard',
      duration: 60,
      wordCount: 25,
      ...overrides,
    })
  )
}

describe('useTypingTest', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts in "idle" phase', () => {
      const { result } = renderTypingHook()
      expect(result.current.phase).toBe('idle')
    })

    it('has empty inputValue', () => {
      const { result } = renderTypingHook()
      expect(result.current.inputValue).toBe('')
    })

    it('has no results initially', () => {
      const { result } = renderTypingHook()
      expect(result.current.results).toBeNull()
    })

    it('initializes text from the data fixture', () => {
      const { result } = renderTypingHook()
      expect(typeof result.current.text).toBe('string')
      expect(result.current.text.length).toBeGreaterThan(0)
    })

    it('initializes chars matching the text', () => {
      const { result } = renderTypingHook()
      expect(result.current.chars.length).toBe(result.current.text.length)
    })

    it('caretIndex starts at 0', () => {
      const { result } = renderTypingHook()
      expect(result.current.caretIndex).toBe(0)
    })

    it('progress starts at 0', () => {
      const { result } = renderTypingHook()
      expect(result.current.progress).toBe(0)
    })
  })

  // ── typing behaviour ───────────────────────────────────────────────────────

  describe('handleInput', () => {
    it('transitions to "running" on first keystroke', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('H'))
      expect(result.current.phase).toBe('running')
    })

    it('updates inputValue as the user types', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('Hel'))
      expect(result.current.inputValue).toBe('Hel')
    })

    it('advances caretIndex as chars are typed', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('He'))
      expect(result.current.caretIndex).toBe(2)
    })

    it('marks correct chars with status "correct"', () => {
      const { result } = renderTypingHook()
      const firstChar = result.current.text[0]
      act(() => result.current.handleInput(firstChar))
      expect(result.current.chars[0].status).toBe('correct')
    })

    it('marks wrong chars with status "wrong"', () => {
      const { result } = renderTypingHook()
      const wrongChar = result.current.text[0] === 'X' ? 'Y' : 'X'
      act(() => result.current.handleInput(wrongChar))
      expect(result.current.chars[0].status).toBe('wrong')
    })

    it('does nothing when phase is "finished"', () => {
      const { result } = renderTypingHook()
      // Manually force finished state by typing the entire text
      act(() => result.current.handleInput(result.current.text))
      expect(result.current.phase).toBe('finished')
      const wpmBefore = result.current.results?.wpm
      act(() => result.current.handleInput(result.current.text + 'X'))
      // Results should not have changed
      expect(result.current.results?.wpm).toBe(wpmBefore)
    })
  })

  // ── completion ─────────────────────────────────────────────────────────────

  describe('test completion', () => {
    it('transitions to "finished" when all text is typed in stopwatch mode', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput(result.current.text))
      expect(result.current.phase).toBe('finished')
    })

    it('populates results on completion', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput(result.current.text))
      expect(result.current.results).not.toBeNull()
      expect(typeof result.current.results.wpm).toBe('number')
      expect(typeof result.current.results.accuracy).toBe('number')
    })

    it('transitions to "finished" when countdown timer expires', () => {
      const { result } = renderTypingHook({ mode: 'countdown', duration: 5 })
      act(() => result.current.handleInput('He'))
      act(() => vi.advanceTimersByTime(6000))
      expect(result.current.phase).toBe('finished')
    })
  })

  // ── restart ────────────────────────────────────────────────────────────────

  describe('restart', () => {
    it('resets to "idle" phase', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput(result.current.text))
      expect(result.current.phase).toBe('finished')
      act(() => result.current.restart())
      expect(result.current.phase).toBe('idle')
    })

    it('clears inputValue', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('He'))
      act(() => result.current.restart())
      expect(result.current.inputValue).toBe('')
    })

    it('clears results', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput(result.current.text))
      act(() => result.current.restart())
      expect(result.current.results).toBeNull()
    })

    it('resets caretIndex to 0', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('He'))
      act(() => result.current.restart())
      expect(result.current.caretIndex).toBe(0)
    })

    it('keeps same text with keepText=true', () => {
      const { result } = renderTypingHook()
      const textBefore = result.current.text
      act(() => result.current.restart(true))
      expect(result.current.text).toBe(textBefore)
    })
  })

  // ── quotes mode ────────────────────────────────────────────────────────────

  describe('quotes mode', () => {
    it('sets author from the quote object', () => {
      const { result } = renderTypingHook({ mode: 'quotes' })
      expect(result.current.author).toBe('Shakespeare')
    })

    it('resolves text correctly from the quote object', () => {
      const { result } = renderTypingHook({ mode: 'quotes' })
      expect(result.current.text).toBe('To be or not.')
    })
  })

  // ── liveWpm ────────────────────────────────────────────────────────────────

  describe('liveWpm', () => {
    it('is null in idle phase', () => {
      const { result } = renderTypingHook()
      expect(result.current.liveWpm).toBeNull()
    })

    it('is null in the first 3 seconds of running', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('H'))
      act(() => vi.advanceTimersByTime(2000))
      expect(result.current.liveWpm).toBeNull()
    })

    it('is a number after 3+ seconds of running', () => {
      const { result } = renderTypingHook()
      act(() => result.current.handleInput('H'))
      act(() => vi.advanceTimersByTime(4000))
      expect(typeof result.current.liveWpm).toBe('number')
    })
  })
})
