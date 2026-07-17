import { describe, it, expect, beforeEach } from 'vitest'
import {
  savePersonalScore, getPersonalScores, clearPersonalScores, getStatsOverview, getAggregateKeyStats,
  sanitizeUsername, USERNAME_MAX_LEN,
} from '../../services/scoreService.js'

describe('scoreService — sanitizeUsername', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeUsername('  alice  ')).toBe('alice')
  })

  it('collapses internal whitespace and strips control characters', () => {
    expect(sanitizeUsername('a\t\nb\u0000c')).toBe('a bc')
  })

  it('clamps to the max length', () => {
    const long = 'x'.repeat(100)
    expect(sanitizeUsername(long)).toHaveLength(USERNAME_MAX_LEN)
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(sanitizeUsername('')).toBeNull()
    expect(sanitizeUsername('   ')).toBeNull()
    expect(sanitizeUsername('\u0000\u001f')).toBeNull()
  })

  it('returns null for non-string input', () => {
    expect(sanitizeUsername(null)).toBeNull()
    expect(sanitizeUsername(42)).toBeNull()
    expect(sanitizeUsername(undefined)).toBeNull()
  })
})

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

  it('respects custom periodDays parameter', () => {
    savePersonalScore(entry({ accuracy: 80, wpm: 60 }))
    const overview30 = getStatsOverview(30)
    expect(overview30.avgAccuracy7d).toBe(80)
  })

  it('returns all-time averages when periodDays is null', () => {
    const old = entry({ accuracy: 50, wpm: 40 })
    old.timestamp = Date.now() - 60 * 24 * 60 * 60 * 1000
    localStorage.setItem('typingtest_scores', JSON.stringify([old]))
    savePersonalScore(entry({ accuracy: 90, wpm: 80 }))
    const overview = getStatsOverview(null)
    expect(overview.avgAccuracy7d).toBe(70) // (50 + 90) / 2
  })
})

// ── getAggregateKeyStats ──────────────────────────────────────────────────────

describe('getAggregateKeyStats', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty array when no scores exist', () => {
    expect(getAggregateKeyStats()).toEqual([])
  })

  it('returns empty array when scores have no keyStats', () => {
    savePersonalScore(entry())
    expect(getAggregateKeyStats()).toEqual([])
  })

  it('aggregates keyStats from a single score', () => {
    savePersonalScore(entry({
      keyStats: [{ key: 'a', accuracy: 80, errors: 2, total: 10 }],
    }))
    const result = getAggregateKeyStats()
    expect(result.length).toBe(1)
    expect(result[0].key).toBe('a')
    expect(result[0].total).toBe(10)
    expect(result[0].errors).toBe(2)
    expect(result[0].accuracy).toBe(80)
  })

  it('merges keyStats across multiple scores for the same key', () => {
    savePersonalScore(entry({
      keyStats: [{ key: 'a', accuracy: 90, errors: 1, total: 10 }],
    }))
    savePersonalScore(entry({
      keyStats: [{ key: 'a', accuracy: 70, errors: 3, total: 10 }],
    }))
    const result = getAggregateKeyStats()
    expect(result.length).toBe(1)
    expect(result[0].total).toBe(20)
    expect(result[0].errors).toBe(4)
    expect(result[0].accuracy).toBe(80) // (20 - 4) / 20 = 80%
  })

  it('handles multiple different keys', () => {
    savePersonalScore(entry({
      keyStats: [
        { key: 'a', accuracy: 90, errors: 1, total: 10 },
        { key: 's', accuracy: 100, errors: 0, total: 5 },
      ],
    }))
    const result = getAggregateKeyStats()
    expect(result.length).toBe(2)
    const keys = result.map(r => r.key)
    expect(keys).toContain('a')
    expect(keys).toContain('s')
  })

  it('ignores scores without keyStats gracefully', () => {
    savePersonalScore(entry()) // no keyStats
    savePersonalScore(entry({
      keyStats: [{ key: 'e', accuracy: 95, errors: 1, total: 20 }],
    }))
    const result = getAggregateKeyStats()
    expect(result.length).toBe(1)
    expect(result[0].key).toBe('e')
  })
})
