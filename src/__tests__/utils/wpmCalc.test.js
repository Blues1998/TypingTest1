import { describe, it, expect } from 'vitest'
import { calcWpm, calcAccuracy, calcConsistency } from '../../utils/wpmCalc.js'

// ── calcWpm ──────────────────────────────────────────────────────────────────

describe('calcWpm', () => {
  it('returns 0 when elapsed < 0.5s', () => {
    expect(calcWpm(300, 0.4)).toBe(0)
  })

  it('returns 0 when no chars typed', () => {
    expect(calcWpm(0, 60)).toBe(0)
  })

  it('calculates 60 WPM for 300 chars in 60 seconds', () => {
    // 300 chars / 5 = 60 words; 60s / 60 = 1 min → 60 WPM
    expect(calcWpm(300, 60)).toBe(60)
  })

  it('calculates 120 WPM for 600 chars in 60 seconds', () => {
    expect(calcWpm(600, 60)).toBe(120)
  })

  it('calculates 40 WPM for 200 chars in 60 seconds', () => {
    expect(calcWpm(200, 60)).toBe(40)
  })

  it('calculates correctly for shorter durations', () => {
    // 150 chars in 30s = 30 words in 0.5 min = 60 WPM
    expect(calcWpm(150, 30)).toBe(60)
  })

  it('returns a rounded integer', () => {
    const result = calcWpm(101, 30)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('handles very high WPM without capping', () => {
    expect(calcWpm(1500, 60)).toBe(300)
  })
})

// ── calcAccuracy ─────────────────────────────────────────────────────────────

describe('calcAccuracy', () => {
  it('returns 100 when no input', () => {
    expect(calcAccuracy([], 0)).toBe(100)
  })

  it('returns 100 for all correct chars', () => {
    const chars = [{ status: 'correct' }, { status: 'correct' }, { status: 'correct' }]
    expect(calcAccuracy(chars, 3)).toBe(100)
  })

  it('returns 0 for all wrong chars', () => {
    const chars = [{ status: 'wrong' }, { status: 'wrong' }]
    expect(calcAccuracy(chars, 2)).toBe(0)
  })

  it('returns 50 for half correct', () => {
    const chars = [{ status: 'correct' }, { status: 'wrong' }]
    expect(calcAccuracy(chars, 2)).toBe(50)
  })

  it('returns 75 for 3/4 correct', () => {
    const chars = [
      { status: 'correct' },
      { status: 'correct' },
      { status: 'correct' },
      { status: 'wrong' },
    ]
    expect(calcAccuracy(chars, 4)).toBe(75)
  })

  it('only counts up to inputLength chars', () => {
    // 4 chars total but only 2 were typed; both correct
    const chars = [
      { status: 'correct' },
      { status: 'correct' },
      { status: 'pending' },
      { status: 'pending' },
    ]
    expect(calcAccuracy(chars, 2)).toBe(100)
  })

  it('ignores extra chars beyond the text', () => {
    const chars = [{ status: 'correct' }, { status: 'extra' }]
    // extra chars count as input (they are wrong by definition)
    expect(calcAccuracy(chars, 2)).toBe(50)
  })

  it('returns a rounded integer', () => {
    const chars = [{ status: 'correct' }, { status: 'correct' }, { status: 'wrong' }]
    expect(Number.isInteger(calcAccuracy(chars, 3))).toBe(true)
  })
})

// ── calcConsistency ───────────────────────────────────────────────────────────

describe('calcConsistency', () => {
  it('returns null for null input', () => {
    expect(calcConsistency(null)).toBeNull()
  })

  it('returns null for fewer than 3 data points', () => {
    expect(calcConsistency([{ wpm: 60 }, { wpm: 70 }])).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(calcConsistency([])).toBeNull()
  })

  it('returns 100 for perfectly uniform WPM', () => {
    const data = [60, 60, 60, 60, 60].map(wpm => ({ wpm }))
    expect(calcConsistency(data)).toBe(100)
  })

  it('returns a lower score for highly variable WPM', () => {
    const data = [10, 200, 10, 200, 10].map(wpm => ({ wpm }))
    const result = calcConsistency(data)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(60)
  })

  it('returns a value between 0 and 100', () => {
    const data = [50, 70, 60, 80, 55, 75].map(wpm => ({ wpm }))
    const result = calcConsistency(data)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('ignores zero WPM entries', () => {
    const data = [60, 0, 60, 0, 60].map(wpm => ({ wpm }))
    // After filtering zeros, 3 identical values → should be 100
    expect(calcConsistency(data)).toBe(100)
  })

  it('returns null when filtered data has fewer than 3 entries', () => {
    const data = [0, 60, 0].map(wpm => ({ wpm }))
    expect(calcConsistency(data)).toBeNull()
  })
})
