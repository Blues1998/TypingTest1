import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRank, getDifficulty, setDifficulty, hashText,
  getWordsByTier, RANKS, BUBBLE_PRESETS,
} from '../../utils/levelSystem.js'

// ── getRank ───────────────────────────────────────────────────────────────────

describe('getRank', () => {
  it('returns Novice for 0 WPM', () => expect(getRank(0).label).toBe('Novice'))
  it('returns Novice for WPM below 30', () => expect(getRank(29).label).toBe('Novice'))
  it('returns Beginner for exactly 30 WPM', () => expect(getRank(30).label).toBe('Beginner'))
  it('returns Standard for exactly 45 WPM', () => expect(getRank(45).label).toBe('Standard'))
  it('returns Advanced for exactly 65 WPM', () => expect(getRank(65).label).toBe('Advanced'))
  it('returns Expert for exactly 90 WPM', () => expect(getRank(90).label).toBe('Expert'))
  it('returns Master for exactly 120 WPM', () => expect(getRank(120).label).toBe('Master'))
  it('returns Master for 200+ WPM', () => expect(getRank(200).label).toBe('Master'))
  it('returns Novice for null', () => expect(getRank(null).label).toBe('Novice'))
  it('returns Novice for undefined', () => expect(getRank(undefined).label).toBe('Novice'))

  it('each rank has a color string', () => {
    RANKS.forEach(r => expect(r.color).toMatch(/^#[0-9a-f]{6}$/i))
  })

  it('RANKS are ordered by ascending min', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min)
    }
  })
})

// ── hashText ──────────────────────────────────────────────────────────────────

describe('hashText', () => {
  it('returns 0 for empty string', () => expect(hashText('')).toBe(0))
  it('returns 0 for null', () => expect(hashText(null)).toBe(0))
  it('returns 0 for undefined', () => expect(hashText(undefined)).toBe(0))

  it('returns a positive number for non-empty text', () => {
    expect(hashText('hello world')).toBeGreaterThan(0)
  })

  it('is deterministic — same input same output', () => {
    expect(hashText('hello')).toBe(hashText('hello'))
    expect(hashText('typing test')).toBe(hashText('typing test'))
  })

  it('produces different values for different text', () => {
    expect(hashText('hello')).not.toBe(hashText('world'))
  })

  it('is sensitive to length differences', () => {
    expect(hashText('ab')).not.toBe(hashText('abc'))
  })
})

// ── getDifficulty / setDifficulty ─────────────────────────────────────────────

describe('getDifficulty / setDifficulty', () => {
  beforeEach(() => localStorage.clear())

  it('returns "standard" when nothing is saved', () => {
    expect(getDifficulty('stopwatch')).toBe('standard')
  })

  it('persists and retrieves a saved difficulty', () => {
    setDifficulty('stopwatch', 'elite')
    expect(getDifficulty('stopwatch')).toBe('elite')
  })

  it('each mode has an independent difficulty', () => {
    setDifficulty('stopwatch', 'advanced')
    setDifficulty('countdown', 'rookie')
    expect(getDifficulty('stopwatch')).toBe('advanced')
    expect(getDifficulty('countdown')).toBe('rookie')
  })

  it('overwriting a difficulty works', () => {
    setDifficulty('stopwatch', 'elite')
    setDifficulty('stopwatch', 'rookie')
    expect(getDifficulty('stopwatch')).toBe('rookie')
  })
})

// ── getWordsByTier ────────────────────────────────────────────────────────────

describe('getWordsByTier', () => {
  const words = ['hi', 'the', 'apple', 'jumping', 'extraordinary', 'magnificent']

  it('training returns only words with length <= 5', () => {
    const result = getWordsByTier(words, 'training')
    expect(result.every(w => w.length <= 5)).toBe(true)
    expect(result).toContain('hi')
    expect(result).toContain('the')
    expect(result).toContain('apple')
    expect(result).not.toContain('jumping')
  })

  it('admiral returns only words with length >= 6', () => {
    const result = getWordsByTier(words, 'admiral')
    expect(result.every(w => w.length >= 6)).toBe(true)
    expect(result).toContain('jumping')
    expect(result).not.toContain('hi')
    expect(result).not.toContain('the')
  })

  it('pilot returns all words unfiltered', () => {
    expect(getWordsByTier(words, 'pilot')).toEqual(words)
  })

  it('commander returns all words unfiltered', () => {
    expect(getWordsByTier(words, 'commander')).toEqual(words)
  })
})

// ── BUBBLE_PRESETS ────────────────────────────────────────────────────────────

describe('BUBBLE_PRESETS', () => {
  const tiers = ['training', 'pilot', 'commander', 'admiral']

  it('defines all four difficulty tiers', () => {
    tiers.forEach(t => expect(BUBBLE_PRESETS).toHaveProperty(t))
  })

  it('speed increases with difficulty', () => {
    expect(BUBBLE_PRESETS.pilot.speed).toBeGreaterThan(BUBBLE_PRESETS.training.speed)
    expect(BUBBLE_PRESETS.commander.speed).toBeGreaterThan(BUBBLE_PRESETS.pilot.speed)
    expect(BUBBLE_PRESETS.admiral.speed).toBeGreaterThan(BUBBLE_PRESETS.commander.speed)
  })

  it('spawn interval decreases with difficulty (harder = faster spawning)', () => {
    expect(BUBBLE_PRESETS.pilot.spawn).toBeLessThan(BUBBLE_PRESETS.training.spawn)
    expect(BUBBLE_PRESETS.commander.spawn).toBeLessThan(BUBBLE_PRESETS.pilot.spawn)
    expect(BUBBLE_PRESETS.admiral.spawn).toBeLessThan(BUBBLE_PRESETS.commander.spawn)
  })
})
