import { describe, it, expect } from 'vitest'
import { pickPassage } from '../../utils/dataLoader.js'

// Mock data that mimics the real JSON structure
const mockData = {
  sentences: {
    rookie:   ['Short sentence.', 'Another short one.'],
    standard: ['The quick brown fox jumps over.', 'Pack my box with five dozen.', 'How vexingly quick daft zebras.'],
    advanced: ['Advanced text presents a challenge.', 'Sophisticated vocabulary tests dexterity.'],
    elite:    ['Elite text demands extraordinary proficiency.'],
  },
  longTexts: {
    standard: ['Long standard text one.', 'Long standard text two.', 'Long standard text three.'],
    advanced: ['Long advanced text one.', 'Long advanced text two.'],
    elite:    ['Long elite text one.'],
  },
  codeSnippets: [
    'const x = 1;',
    'function greet(name) { return `Hello, ${name}!` }',
    'for (let i = 0; i < 10; i++) console.log(i)',
  ],
  quotes: [
    { text: 'To be or not to be, that is the question.', author: 'Shakespeare' },
    { text: 'Ask not what your country can do for you.', author: 'JFK' },
    { text: 'I have a dream.', author: 'Martin Luther King Jr.' },
    { text: 'The only thing we have to fear is fear itself.', author: 'FDR' },
  ],
}

// ── quotes mode ───────────────────────────────────────────────────────────────

describe('pickPassage — quotes mode', () => {
  it('returns an object with text and author properties', () => {
    const result = pickPassage('quotes', 'standard', mockData)
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('author')
  })

  it('returns a quote from the pool', () => {
    const result = pickPassage('quotes', 'standard', mockData)
    expect(mockData.quotes.map(q => q.text)).toContain(result.text)
  })

  it('avoids the excluded quote (object exclude)', () => {
    const exclude = mockData.quotes[0]
    let differentSeen = false
    for (let i = 0; i < 50; i++) {
      const result = pickPassage('quotes', 'standard', mockData, exclude)
      if (result.text !== exclude.text) { differentSeen = true; break }
    }
    expect(differentSeen).toBe(true)
  })

  it('handles a string exclude (backward compatibility)', () => {
    const result = pickPassage('quotes', 'standard', mockData, 'some old string')
    expect(result).toHaveProperty('text')
  })

  it('returns fallback text when quotes pool is empty', () => {
    const emptyData = { ...mockData, quotes: [] }
    const result = pickPassage('quotes', 'standard', emptyData)
    expect(result).toHaveProperty('text')
    expect(result.text).toBe('No quotes available.')
  })
})

// ── words mode ────────────────────────────────────────────────────────────────

describe('pickPassage — words mode', () => {
  it('returns a plain string', () => {
    const result = pickPassage('words', 'standard', mockData, null, 10)
    expect(typeof result).toBe('string')
  })

  it('ends with a period', () => {
    expect(pickPassage('words', 'standard', mockData, null, 10)).toMatch(/\.$/)
  })

  it('returns exactly the requested word count', () => {
    const n = 5
    const result = pickPassage('words', 'standard', mockData, null, n)
    const wordCount = result.replace(/\.$/, '').split(/\s+/).filter(Boolean).length
    expect(wordCount).toBe(n)
  })

  it('defaults to 25 words when wordCount is 0', () => {
    const result = pickPassage('words', 'standard', mockData, null, 0)
    const wordCount = result.replace(/\.$/, '').split(/\s+/).filter(Boolean).length
    expect(wordCount).toBe(25)
  })
})

// ── daily mode ────────────────────────────────────────────────────────────────

describe('pickPassage — daily mode', () => {
  it('returns the same text on repeated calls (deterministic by date)', () => {
    const r1 = pickPassage('daily', 'standard', mockData)
    const r2 = pickPassage('daily', 'standard', mockData)
    expect(r1).toBe(r2)
  })

  it('returns a string from the sentence pool', () => {
    const result = pickPassage('daily', 'standard', mockData)
    const allSentences = [
      ...mockData.sentences.standard,
      ...mockData.sentences.advanced,
    ]
    expect(allSentences).toContain(result)
  })
})

// ── stopwatch mode ────────────────────────────────────────────────────────────

describe('pickPassage — stopwatch mode', () => {
  it('returns a sentence from the correct difficulty pool', () => {
    const result = pickPassage('stopwatch', 'standard', mockData)
    expect(mockData.sentences.standard).toContain(result)
  })

  it('returns a sentence from the rookie pool', () => {
    const result = pickPassage('stopwatch', 'rookie', mockData)
    expect(mockData.sentences.rookie).toContain(result)
  })

  it('avoids returning the excluded sentence when pool has > 1 entry', () => {
    const exclude = mockData.sentences.standard[0]
    let differentSeen = false
    for (let i = 0; i < 30; i++) {
      const result = pickPassage('stopwatch', 'standard', mockData, exclude)
      if (result !== exclude) { differentSeen = true; break }
    }
    expect(differentSeen).toBe(true)
  })

  it('returns the only sentence even when it equals exclude (pool size 1)', () => {
    const singlePool = { ...mockData, sentences: { ...mockData.sentences, elite: ['Only one.'] } }
    const result = pickPassage('stopwatch', 'elite', singlePool, 'Only one.')
    expect(result).toBe('Only one.')
  })
})

// ── code mode ─────────────────────────────────────────────────────────────────

describe('pickPassage — code mode', () => {
  it('returns a snippet from the code pool', () => {
    const result = pickPassage('code', 'standard', mockData)
    expect(mockData.codeSnippets).toContain(result)
  })
})

// ── countdown mode ────────────────────────────────────────────────────────────

describe('pickPassage — countdown mode', () => {
  it('returns a long text for standard difficulty', () => {
    const result = pickPassage('countdown', 'standard', mockData)
    expect(mockData.longTexts.standard).toContain(result)
  })

  it('returns a sentence (not long text) for rookie difficulty', () => {
    const result = pickPassage('countdown', 'rookie', mockData)
    expect(mockData.sentences.rookie).toContain(result)
  })
})
