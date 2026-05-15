import { describe, it, expect, beforeEach } from 'vitest'
import { recordDailyCompletion, hasDoneToday, getDailyStreak } from '../../utils/streakUtils.js'

const PREFIX = 'typingtest_daily_'
const todayKey = PREFIX + new Date().toISOString().slice(0, 10)

function dateKey(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return PREFIX + d.toISOString().slice(0, 10)
}

describe('streakUtils', () => {
  beforeEach(() => localStorage.clear())

  // ── hasDoneToday ───────────────────────────────────────────────────────────

  describe('hasDoneToday', () => {
    it('returns false when nothing is recorded', () => {
      expect(hasDoneToday()).toBe(false)
    })

    it('returns true immediately after recording', () => {
      recordDailyCompletion()
      expect(hasDoneToday()).toBe(true)
    })

    it('is idempotent — multiple recordings still return true', () => {
      recordDailyCompletion()
      recordDailyCompletion()
      expect(hasDoneToday()).toBe(true)
    })
  })

  // ── getDailyStreak ─────────────────────────────────────────────────────────

  describe('getDailyStreak', () => {
    it('returns 0 when nothing is recorded', () => {
      expect(getDailyStreak()).toBe(0)
    })

    it('returns 1 after completing today', () => {
      recordDailyCompletion()
      expect(getDailyStreak()).toBe(1)
    })

    it('counts 2 consecutive days (today + yesterday)', () => {
      localStorage.setItem(dateKey(0), '1')
      localStorage.setItem(dateKey(1), '1')
      expect(getDailyStreak()).toBe(2)
    })

    it('counts 5 consecutive days', () => {
      for (let i = 0; i < 5; i++) localStorage.setItem(dateKey(i), '1')
      expect(getDailyStreak()).toBe(5)
    })

    it('breaks streak when yesterday is missing', () => {
      localStorage.setItem(dateKey(0), '1')
      // skip day 1
      localStorage.setItem(dateKey(2), '1')
      expect(getDailyStreak()).toBe(1)
    })

    it('returns 0 when only yesterday is set (not today)', () => {
      localStorage.setItem(dateKey(1), '1')
      expect(getDailyStreak()).toBe(0)
    })

    it('returns correct count even when future dates are in storage', () => {
      // Storing a "future" key should not affect the streak from today
      localStorage.setItem(dateKey(0), '1')
      localStorage.setItem(dateKey(1), '1')
      // Manually set a "future" date (irrelevant to streak counting which goes backwards)
      localStorage.setItem(PREFIX + '2099-12-31', '1')
      expect(getDailyStreak()).toBe(2)
    })
  })

  // ── recordDailyCompletion ──────────────────────────────────────────────────

  describe('recordDailyCompletion', () => {
    it('writes the correct localStorage key', () => {
      recordDailyCompletion()
      expect(localStorage.getItem(todayKey)).toBe('1')
    })
  })
})
