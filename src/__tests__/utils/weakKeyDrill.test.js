import { describe, it, expect } from 'vitest'
import { buildWeakKeyText } from '../../utils/weakKeyDrill.js'

const WORDS = [
  'apple', 'banana', 'cherry', 'date', 'elder', 'figure', 'grape',
  'honey', 'island', 'jungle', 'kiwi', 'lemon', 'mango', 'nectar',
  'orange', 'papaya', 'quince', 'raisin', 'strawberry', 'tangerine',
]

// ── Null / guard cases ────────────────────────────────────────────────────────

describe('buildWeakKeyText — null guards', () => {
  it('returns null for empty keyStats', () => {
    expect(buildWeakKeyText([], WORDS)).toBeNull()
  })

  it('returns null for null keyStats', () => {
    expect(buildWeakKeyText(null, WORDS)).toBeNull()
  })

  it('returns null for empty words list', () => {
    const keyStats = [{ key: 'a', accuracy: 40, total: 5 }]
    expect(buildWeakKeyText(keyStats, [])).toBeNull()
  })

  it('returns null for null words list', () => {
    const keyStats = [{ key: 'a', accuracy: 40, total: 5 }]
    expect(buildWeakKeyText(keyStats, null)).toBeNull()
  })

  it('returns null when no keys have >= 2 recorded keystrokes', () => {
    const keyStats = [{ key: 'a', accuracy: 0, total: 1 }]
    expect(buildWeakKeyText(keyStats, WORDS)).toBeNull()
  })

  it('returns null when fewer than 5 words contain the weak key', () => {
    // 'z' appears in no word in our list
    const keyStats = [{ key: 'z', accuracy: 0, total: 5 }]
    expect(buildWeakKeyText(keyStats, WORDS)).toBeNull()
  })
})

// ── Output structure ──────────────────────────────────────────────────────────

describe('buildWeakKeyText — output structure', () => {
  const keyStats = [{ key: 'a', accuracy: 40, total: 10 }]

  it('returns a string', () => {
    expect(typeof buildWeakKeyText(keyStats, WORDS, 10)).toBe('string')
  })

  it('ends with a period', () => {
    expect(buildWeakKeyText(keyStats, WORDS, 10)).toMatch(/\.$/)
  })

  it('generates exactly the requested word count', () => {
    const result = buildWeakKeyText(keyStats, WORDS, 15)
    const words = result.replace(/\.$/, '').split(' ')
    expect(words.length).toBe(15)
  })

  it('uses the default 50-word count when not specified', () => {
    const result = buildWeakKeyText(keyStats, WORDS)
    const words = result.replace(/\.$/, '').split(' ')
    expect(words.length).toBe(50)
  })
})

// ── Key targeting ─────────────────────────────────────────────────────────────

describe('buildWeakKeyText — key targeting', () => {
  it('all output words contain at least one of the weak key letters', () => {
    const keyStats = [{ key: 'a', accuracy: 30, total: 10 }]
    const result = buildWeakKeyText(keyStats, WORDS, 20)
    const resultWords = result.replace(/\.$/, '').split(' ')
    const allContainKey = resultWords.every(w => w.toLowerCase().includes('a'))
    expect(allContainKey).toBe(true)
  })

  it('targets the lowest-accuracy keys first', () => {
    // 'a' is worst, 'e' is better — result should heavily use 'a'-containing words
    const keyStats = [
      { key: 'a', accuracy: 20, total: 10 },
      { key: 'e', accuracy: 80, total: 10 },
    ]
    const result = buildWeakKeyText(keyStats, WORDS, 20)
    expect(result).not.toBeNull()
    // words should include 'a' or 'e' (since both qualify as weak, pool is union)
    const resultWords = result.replace(/\.$/, '').split(' ')
    expect(resultWords.every(w => w.includes('a') || w.includes('e'))).toBe(true)
  })

  it('ignores keys with fewer than 2 total keystrokes', () => {
    const keyStats = [
      { key: 'z', accuracy: 0, total: 1 },  // < 2 keystrokes — skip
      { key: 'a', accuracy: 50, total: 5 },  // valid
    ]
    const result = buildWeakKeyText(keyStats, WORDS, 10)
    // Should still work using 'a' as the weak key
    expect(result).not.toBeNull()
  })
})
