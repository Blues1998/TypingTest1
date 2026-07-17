import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { safeGet, safeSet, safeRemove } from '../../utils/safeStorage.js'

describe('safeStorage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  describe('safeGet', () => {
    it('returns the stored value', () => {
      localStorage.setItem('k', 'v')
      expect(safeGet('k')).toBe('v')
    })

    it('returns null by default when the key is absent', () => {
      expect(safeGet('missing')).toBeNull()
    })

    it('returns the provided fallback when the key is absent', () => {
      expect(safeGet('missing', 'fallback')).toBe('fallback')
    })

    it('returns the fallback when getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      expect(safeGet('k', 'fallback')).toBe('fallback')
    })
  })

  describe('safeSet', () => {
    it('writes the value and returns true', () => {
      expect(safeSet('k', 'v')).toBe(true)
      expect(localStorage.getItem('k')).toBe('v')
    })

    it('returns false when setItem throws (e.g. quota exceeded)', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      expect(safeSet('k', 'v')).toBe(false)
    })
  })

  describe('safeRemove', () => {
    it('removes the key', () => {
      localStorage.setItem('k', 'v')
      safeRemove('k')
      expect(localStorage.getItem('k')).toBeNull()
    })

    it('does not throw when removeItem throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      expect(() => safeRemove('k')).not.toThrow()
    })
  })
})
