import { describe, it, expect, beforeEach } from 'vitest'
import { getGhostRuns } from '../../services/ghostService.js'

const PREFIX = 'ghost_stopwatch_'

function run(overrides = {}) {
  return {
    text: 'the quick brown fox',
    wpm: 60,
    accuracy: 95,
    timeTaken: 30,
    mistakes: 2,
    timestamp: 1000,
    ...overrides,
  }
}

describe('ghostService — getGhostRuns', () => {
  beforeEach(() => localStorage.clear())

  it('returns an empty array when nothing is stored', () => {
    expect(getGhostRuns()).toEqual([])
  })

  it('ignores keys that do not use the ghost prefix', () => {
    localStorage.setItem('typingtest_theme', 'dark')
    localStorage.setItem('some_other_key', JSON.stringify(run()))
    expect(getGhostRuns()).toEqual([])
  })

  it('parses a stored run and exposes its fields', () => {
    localStorage.setItem(PREFIX + 'standard_12345', JSON.stringify(run({ wpm: 80 })))
    const runs = getGhostRuns()
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({
      key: PREFIX + 'standard_12345',
      difficulty: 'standard',
      wpm: 80,
      accuracy: 95,
      timeTaken: 30,
      mistakes: 2,
      text: 'the quick brown fox',
      timestamp: 1000,
    })
  })

  it('derives difficulty from the key segment after the prefix', () => {
    localStorage.setItem(PREFIX + 'elite_98765', JSON.stringify(run()))
    expect(getGhostRuns()[0].difficulty).toBe('elite')
  })

  it('defaults difficulty to "standard" when the key has no separator', () => {
    localStorage.setItem(PREFIX + '98765', JSON.stringify(run()))
    expect(getGhostRuns()[0].difficulty).toBe('standard')
  })

  it('applies zero defaults for missing numeric fields', () => {
    localStorage.setItem(PREFIX + 'standard_1', JSON.stringify({ text: 'only text' }))
    expect(getGhostRuns()[0]).toMatchObject({
      wpm: 0,
      accuracy: 0,
      timeTaken: 0,
      mistakes: 0,
      timestamp: 0,
    })
  })

  it('skips records without a string text field', () => {
    localStorage.setItem(PREFIX + 'standard_1', JSON.stringify({ wpm: 50 }))
    localStorage.setItem(PREFIX + 'standard_2', JSON.stringify({ text: 42 }))
    expect(getGhostRuns()).toEqual([])
  })

  it('skips malformed JSON without throwing', () => {
    localStorage.setItem(PREFIX + 'standard_1', 'not json {{{')
    localStorage.setItem(PREFIX + 'standard_2', JSON.stringify(run()))
    const runs = getGhostRuns()
    expect(runs).toHaveLength(1)
    expect(runs[0].text).toBe('the quick brown fox')
  })

  it('sorts runs by timestamp, newest first', () => {
    localStorage.setItem(PREFIX + 'standard_a', JSON.stringify(run({ timestamp: 100 })))
    localStorage.setItem(PREFIX + 'standard_b', JSON.stringify(run({ timestamp: 300 })))
    localStorage.setItem(PREFIX + 'standard_c', JSON.stringify(run({ timestamp: 200 })))
    const timestamps = getGhostRuns().map(r => r.timestamp)
    expect(timestamps).toEqual([300, 200, 100])
  })
})
