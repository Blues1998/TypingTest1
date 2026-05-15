import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkAchievements, getUnlockedSet, getUnlockedAchievements, ACHIEVEMENTS, TIER_META } from '../../utils/achievements.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function score(overrides = {}) {
  return { wpm: 50, accuracy: 95, mode: 'stopwatch', consistency: null, ...overrides }
}

function scores(count, overrides = {}) {
  return Array.from({ length: count }, () => score(overrides))
}

// ── ACHIEVEMENTS metadata ─────────────────────────────────────────────────────

describe('ACHIEVEMENTS metadata', () => {
  it('has 26 achievements total', () => {
    expect(ACHIEVEMENTS.length).toBe(26)
  })

  it('has exactly 1 diamond achievement', () => {
    expect(ACHIEVEMENTS.filter(a => a.tier === 'diamond').length).toBe(1)
  })

  it('has exactly 10 bronze achievements', () => {
    expect(ACHIEVEMENTS.filter(a => a.tier === 'bronze').length).toBe(10)
  })

  it('has exactly 8 silver achievements', () => {
    expect(ACHIEVEMENTS.filter(a => a.tier === 'silver').length).toBe(8)
  })

  it('has exactly 7 gold achievements', () => {
    expect(ACHIEVEMENTS.filter(a => a.tier === 'gold').length).toBe(7)
  })

  it('all achievements have required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id, `${a.id} missing field`).toBeTruthy()
      expect(a.tier, `${a.id} missing tier`).toBeTruthy()
      expect(a.icon, `${a.id} missing icon`).toBeTruthy()
      expect(a.label, `${a.id} missing label`).toBeTruthy()
      expect(a.desc, `${a.id} missing desc`).toBeTruthy()
    }
  })

  it('achievement IDs are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all tiers are valid values', () => {
    const valid = new Set(['bronze', 'silver', 'gold', 'diamond'])
    ACHIEVEMENTS.forEach(a => expect(valid.has(a.tier)).toBe(true))
  })
})

// ── TIER_META metadata ────────────────────────────────────────────────────────

describe('TIER_META', () => {
  const tiers = ['bronze', 'silver', 'gold', 'diamond']

  it('defines all four tiers', () => {
    tiers.forEach(t => expect(TIER_META).toHaveProperty(t))
  })

  it('each tier has label, color, and glow', () => {
    tiers.forEach(t => {
      expect(TIER_META[t].label).toBeTruthy()
      expect(TIER_META[t].color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(TIER_META[t].glow).toBeTruthy()
    })
  })
})

// ── checkAchievements ─────────────────────────────────────────────────────────

describe('checkAchievements', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty array for empty score list', () => {
    expect(checkAchievements([])).toEqual([])
  })

  it('unlocks first_test on first score', () => {
    const unlocked = checkAchievements([score()])
    expect(unlocked.map(a => a.id)).toContain('first_test')
  })

  it('unlocks wpm_30 when any score >= 30', () => {
    const unlocked = checkAchievements([score({ wpm: 35 })])
    expect(unlocked.map(a => a.id)).toContain('wpm_30')
  })

  it('unlocks wpm_50 when any score >= 50', () => {
    const unlocked = checkAchievements([score({ wpm: 55 })])
    expect(unlocked.map(a => a.id)).toContain('wpm_50')
  })

  it('does NOT unlock wpm_50 when best is 49', () => {
    const unlocked = checkAchievements([score({ wpm: 49 })])
    expect(unlocked.map(a => a.id)).not.toContain('wpm_50')
  })

  it('unlocks wpm_75, wpm_100, wpm_120, wpm_150 for 150+ WPM', () => {
    const unlocked = checkAchievements([score({ wpm: 150 })])
    const ids = unlocked.map(a => a.id)
    expect(ids).toContain('wpm_75')
    expect(ids).toContain('wpm_100')
    expect(ids).toContain('wpm_120')
    expect(ids).toContain('wpm_150')
  })

  it('unlocks acc_perfect for 100% accuracy', () => {
    const unlocked = checkAchievements([score({ accuracy: 100 })])
    expect(unlocked.map(a => a.id)).toContain('acc_perfect')
  })

  it('does NOT unlock acc_5_perfect with only 3 perfect scores', () => {
    const unlocked = checkAchievements(scores(3, { accuracy: 100 }))
    expect(unlocked.map(a => a.id)).not.toContain('acc_5_perfect')
  })

  it('unlocks acc_5_perfect with exactly 5 perfect scores', () => {
    const unlocked = checkAchievements(scores(5, { accuracy: 100 }))
    expect(unlocked.map(a => a.id)).toContain('acc_5_perfect')
  })

  it('unlocks no_mistakes_10 with 10 perfect scores', () => {
    const unlocked = checkAchievements(scores(10, { accuracy: 100 }))
    expect(unlocked.map(a => a.id)).toContain('no_mistakes_10')
  })

  it('unlocks tests_10 when 10 scores exist', () => {
    const unlocked = checkAchievements(scores(10))
    expect(unlocked.map(a => a.id)).toContain('tests_10')
  })

  it('does NOT unlock tests_50 with 10 scores', () => {
    const unlocked = checkAchievements(scores(10))
    expect(unlocked.map(a => a.id)).not.toContain('tests_50')
  })

  it('unlocks mode_code when a code test exists', () => {
    const unlocked = checkAchievements([score({ mode: 'code' })])
    expect(unlocked.map(a => a.id)).toContain('mode_code')
  })

  it('unlocks mode_quotes when a quotes test exists', () => {
    const unlocked = checkAchievements([score({ mode: 'quotes' })])
    expect(unlocked.map(a => a.id)).toContain('mode_quotes')
  })

  it('unlocks mode_survival when a survival test exists', () => {
    const unlocked = checkAchievements([score({ mode: 'survival' })])
    expect(unlocked.map(a => a.id)).toContain('mode_survival')
  })

  it('unlocks mode_words when a words test exists', () => {
    const unlocked = checkAchievements([score({ mode: 'words' })])
    expect(unlocked.map(a => a.id)).toContain('mode_words')
  })

  it('unlocks mode_all when 5 different modes are played', () => {
    const mixed = [
      score({ mode: 'stopwatch' }),
      score({ mode: 'countdown' }),
      score({ mode: 'daily' }),
      score({ mode: 'words' }),
      score({ mode: 'quotes' }),
    ]
    const unlocked = checkAchievements(mixed)
    expect(unlocked.map(a => a.id)).toContain('mode_all')
  })

  it('does NOT unlock mode_all with fewer than 5 distinct modes', () => {
    const mixed = [
      score({ mode: 'stopwatch' }),
      score({ mode: 'countdown' }),
      score({ mode: 'daily' }),
      score({ mode: 'words' }),
    ]
    const unlocked = checkAchievements(mixed)
    expect(unlocked.map(a => a.id)).not.toContain('mode_all')
  })

  it('unlocks consistency_80 when any score has >= 80 consistency', () => {
    const unlocked = checkAchievements([score({ consistency: 85 })])
    expect(unlocked.map(a => a.id)).toContain('consistency_80')
  })

  it('unlocks daily_first when a daily test exists', () => {
    const unlocked = checkAchievements([score({ mode: 'daily' })])
    expect(unlocked.map(a => a.id)).toContain('daily_first')
  })

  it('does NOT re-unlock already unlocked achievements', () => {
    const s = [score()]
    const first = checkAchievements(s)
    const second = checkAchievements(s)
    expect(second.length).toBe(0)
  })

  it('persists unlocked achievements to localStorage', () => {
    checkAchievements([score()])
    const stored = getUnlockedSet()
    expect(stored.has('first_test')).toBe(true)
  })

  it('dispatches a CustomEvent when new achievements are unlocked', () => {
    const spy = vi.spyOn(window, 'dispatchEvent')
    checkAchievements([score()])
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'typingtest-achievements' })
    )
    spy.mockRestore()
  })

  it('does NOT dispatch an event when nothing new is unlocked', () => {
    const spy = vi.spyOn(window, 'dispatchEvent')
    checkAchievements([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does NOT dispatch a second event when re-checking same scores', () => {
    const s = [score()]
    checkAchievements(s)
    const spy = vi.spyOn(window, 'dispatchEvent')
    checkAchievements(s)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ── getUnlockedSet / getUnlockedAchievements ──────────────────────────────────

describe('getUnlockedSet', () => {
  beforeEach(() => localStorage.clear())

  it('returns an empty Set when nothing is unlocked', () => {
    expect(getUnlockedSet().size).toBe(0)
  })

  it('returns a Set containing unlocked IDs', () => {
    checkAchievements([score()])
    const s = getUnlockedSet()
    expect(s.has('first_test')).toBe(true)
  })
})

describe('getUnlockedAchievements', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty array when nothing is unlocked', () => {
    expect(getUnlockedAchievements()).toEqual([])
  })

  it('returns achievement objects for unlocked IDs', () => {
    checkAchievements([score()])
    const result = getUnlockedAchievements()
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(a => typeof a.id === 'string')).toBe(true)
  })
})
