import { describe, it, expect } from 'vitest'
import { mutateText } from '../../utils/textMutator.js'

const SAMPLE = 'the quick brown fox jumps over the lazy dog.'

describe('mutateText', () => {
  describe('no-op when both toggles off', () => {
    it('returns the original text unchanged', () => {
      expect(mutateText(SAMPLE, { numbers: false, punctuation: false })).toBe(SAMPLE)
    })

    it('returns the original text when options object is omitted', () => {
      expect(mutateText(SAMPLE)).toBe(SAMPLE)
    })
  })

  describe('output structure', () => {
    it('always ends with a period', () => {
      expect(mutateText(SAMPLE, { numbers: true, punctuation: true })).toMatch(/\.$/)
      expect(mutateText(SAMPLE, { numbers: true, punctuation: false })).toMatch(/\.$/)
      expect(mutateText(SAMPLE, { numbers: false, punctuation: true })).toMatch(/\.$/)
    })

    it('preserves the same word count as the input', () => {
      const result = mutateText(SAMPLE, { numbers: true, punctuation: true })
      const origWords = SAMPLE.replace(/[.!?]+$/, '').split(/\s+/).length
      const resultWords = result.replace(/\.$/, '').split(/\s+/).length
      expect(resultWords).toBe(origWords)
    })

    it('returns a non-empty string', () => {
      const result = mutateText(SAMPLE, { numbers: true, punctuation: true })
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('numbers toggle', () => {
    it('may inject numeric words when numbers=true', () => {
      // Run many times to overcome low probability (12% per word, 9 non-last words)
      let found = false
      for (let i = 0; i < 200; i++) {
        const result = mutateText(SAMPLE, { numbers: true, punctuation: false })
        if (/\d+/.test(result)) { found = true; break }
      }
      expect(found).toBe(true)
    })

    it('never injects numbers when numbers=false', () => {
      for (let i = 0; i < 50; i++) {
        const result = mutateText(SAMPLE, { numbers: false, punctuation: false })
        expect(result).toBe(SAMPLE)
      }
    })

    it('never replaces the last word with a number', () => {
      for (let i = 0; i < 100; i++) {
        const result = mutateText(SAMPLE, { numbers: true, punctuation: false })
        const words = result.replace(/\.$/, '').split(/\s+/)
        expect(/^\d+$/.test(words[words.length - 1])).toBe(false)
      }
    })
  })

  describe('punctuation toggle', () => {
    it('may inject commas/semicolons when punctuation=true', () => {
      let found = false
      for (let i = 0; i < 200; i++) {
        const result = mutateText(SAMPLE, { numbers: false, punctuation: true })
        // Look for mid-word punctuation (comma/semicolon/colon) before a space
        if (/[,;:](?=\s)/.test(result)) { found = true; break }
      }
      expect(found).toBe(true)
    })

    it('never appends punctuation to the last word', () => {
      for (let i = 0; i < 100; i++) {
        const result = mutateText(SAMPLE, { numbers: false, punctuation: true })
        // Last word before the final period should not have comma/semicolon
        const withoutFinalPeriod = result.replace(/\.$/, '')
        const lastWord = withoutFinalPeriod.split(/\s+/).pop()
        expect(/[,;:]$/.test(lastWord)).toBe(false)
      }
    })
  })

  describe('edge cases', () => {
    it('handles a single-word input', () => {
      const result = mutateText('hello.', { numbers: true, punctuation: true })
      expect(result).toMatch(/^hello\.$/)
    })

    it('handles text with no trailing period', () => {
      const result = mutateText('hello world', { numbers: false, punctuation: false })
      // Without mutations it should be returned as-is (no added period since we short-circuit)
      expect(result).toBe('hello world')
    })
  })
})
