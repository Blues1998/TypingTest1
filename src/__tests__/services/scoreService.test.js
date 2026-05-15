import { describe, it, expect, beforeEach } from 'vitest'
import {
  savePersonalScore, getPersonalScores, clearPersonalScores, getStatsOverview,
} from '../../services/scoreService.js'

function entry(overrides = {}) {
  return {
    wpm: 60,
    accuracy: 95,
    timeTaken: 60,
    mode: 'stopwatch',
    difficulty: 'standard',
    consistency: null,
    ...overrides,
  }
}

describe('scoreService — personal scores', () => {
  beforeEach(() => localStorage.clear())

  // ── save + retrieve ──────────────────────────────────────────────────────

  it('starts empty', () => {
    expect(getPersonalScores()).toEqual([])
  })

  it('saves a score and retrieves it', () => {
    savePersonalScore(entry({ wpm: 75, accuracy: 97 }))
    const scores = getPersonalScores()
    expect(scores.length).toBe(1)
    expect(scores[0].wpm).toBe(75)
    expect(scores[0].accuracy).toBe(97)
  })

  it('persists a timestamp on every entry', () => {
    savePersonalScore(entry())
    const scores = getPersonalScores()
    expect(typeof scores[0].timestamp).toBe('number')
    expect(scores[0].timestamp).toBeGreaterThan(0)
  })

  it('accumulates multiple scores', () => {
    savePersonalScore(entry({ wpm: 50 }))
    savePersonalScore(entry({ wpm: 60 }))
    savePersonalScore(entry({ wpm: 70 }))
    expect(getPersonalScores().length).toBe(3)
  })

  // ── mode filter ──────────────────────────────────────────────────────────

  it('filters by mode', () => {
    savePersonalScore(entry({ mode: 'countdown' }))
    savePersonalScore(entry({ mode: 'stopwatch' }))
    savePersonalScore(entry({ mode: 'stopwatch' }))
    expect(getPersonalScores('countdown').length).toBe(1)
    expect(getPersonalScores('stopwatch').length).toBe(2)
  })

  it('returns all modes when filter is null', () => {
    savePersonalScore(entry({ mode: 'countdown' }))
    savePersonalScore(entry({ mode: 'stopwatch' }))
    expect(getPersonalScores(null).length).toBe(2)
  })

  it('returns all modes when filter is not provided', () => {
    savePersonalScore(entry({ mode: 'daily' }))
    savePersonalScore(entry({ mode: 'words' }))
    expect(getPersonalScores().length).toBe(2)
  })

  // ── 200-entry cap ────────────────────────────────────────────────────────

  it('caps storage at 200 entries', () => {
    for (let i = 0; i < 210; i++) savePersonalScore(entry({ wpm: i }))
    expect(getPersonalScores().length).toBe(200)
  })

  it('keeps the most recent 200 entries when cap is exceeded', () => {
    for (let i = 0; i < 210; i++) savePersonalScore(entry({ wpm: i }))
    const scores = getPersonalScores()
    // Oldest entry (wpm=0) should be gone; newest (wpm=209) should be present
    expect(scores[scores.length - 1].wpm).toBe(209)
    expect(scores.some(s => s.wpm === 0)).toBe(false)
  })

  // ── clearPersonalScores ──────────────────────────────────────────────────

  it('clearPersonalScores removes all scores', () => {
    savePersonalScore(entry())
    savePersonalScore(entry())
    clearPersonalScores()
    expect(getPersonalScores()).toEqual([])
  })
})

// ── getStatsOverview ──────────────────────────────────────────────────────────

describe('getStatsOverview', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when no scores exist', () => {
    expect(getStatsOverview()).toBeNull()
  })

  it('returns correct totalTests count', () => {
    savePersonalScore(entry())
    savePersonalScore(entry())
    expect(getStatsOverview().totalTests).toBe(2)
  })

  it('returns correct bestPerMode', () => {
    savePersonalScore(entry({ wpm: 60, mode: 'stopwatch' }))
    savePersonalScore(entry({ wpm: 80, mode: 'stopwatch' }))
    savePersonalScore(entry({ wpm: 55, mode: 'countdown' }))
    const overview = getStatsOverview()
    expect(overview.bestPerMode['stopwatch']).toBe(80)
    expect(overview.bestPerMode['countdown']).toBe(55)
  })

  it('identifies the favorite mode (most played)', () => {
    savePersonalScore(entry({ mode: 'stopwatch' }))
    savePersonalScore(entry({ mode: 'stopwatch' }))
    savePersonalScore(entry({ mode: 'stopwatch' }))
    savePersonalScore(entry({ mode: 'countdown' }))
    expect(getStatsOverview().favoriteMode).toBe('stopwatch')
  })

  it('counts unique days played in totalDays', () => {
    // Two entries on the same day = 1 unique day
    savePersonalScore(entry())
    savePersonalScore(entry())
    expect(getStatsOverview().totalDays).toBe(1)
  })

  it('computes avgAccuracy7d only from recent scores', () => {
    // Store a score with an old timestamp (8 days ago)
    const old = entry({ accuracy: 10 })
    old.timestamp = Date.now() - 8 * 24 * 60 * 60 * 1000
    const all = JSON.parse(localStorage.getItem('typingtest_scores') || '[]')
    all.push(old)
    localStorage.setItem('typingtest_scores', JSON.stringify(all))

    // Store a recent score
    savePersonalScore(entry({ accuracy: 90 }))

    const overview = getStatsOverview()
    // Old score (accuracy 10) should be excluded from 7-day average
    expect(overview.avgAccuracy7d).toBe(90)
  })

  it('returns null for avgAccuracy7d when no recent scores', () => {
    // Only an old score
    const old = entry({ accuracy: 80 })
    old.timestamp = Date.now() - 10 * 24 * 60 * 60 * 1000
    localStorage.setItem('typingtest_scores', JSON.stringify([old]))
    const overview = getStatsOverview()
    expect(overview.avgAccuracy7d).toBeNull()
  })
})
