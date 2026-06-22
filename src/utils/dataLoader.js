const _langCache = new Map()

export async function loadData() {
  const base = import.meta.env.BASE_URL
  const get = path => fetch(`${base}${path}`).then(r => r.json())

  const lang = localStorage.getItem('typingtest_lang') || 'en'
  const langFile = lang === 'en' ? 'data/sentences.json'
    : lang === 'es' ? 'data/sentences_es.json'
    : lang === 'fr' ? 'data/sentences_fr.json'
    : lang === 'de' ? 'data/sentences_de.json'
    : lang === 'hi' ? 'data/sentences_hi.json'
    : 'data/sentences.json'

  // Language file: fall back to English if the file is missing or unparseable.
  // Cache the result so repeated lang switches don't re-fetch.
  let langFetch
  if (_langCache.has(lang)) {
    langFetch = Promise.resolve(_langCache.get(lang))
  } else {
    langFetch = (lang === 'en'
      ? get(langFile)
      : fetch(`${base}${langFile}`)
          .then(r => (r.ok ? r.json() : get('data/sentences.json')))
          .catch(() => get('data/sentences.json'))
    ).then(result => { _langCache.set(lang, result); return result })
  }

  const [w, s, l, rs, as, esl, al, el, cs, q] = await Promise.all([
    get('data/words.json'),
    langFetch,
    get('data/long_texts.json'),
    get('data/rookie_sentences.json'),
    get('data/advanced_sentences.json'),
    get('data/elite_sentences.json'),
    get('data/advanced_long_texts.json'),
    get('data/elite_long_texts.json'),
    get('data/code_snippets.json'),
    get('data/quotes.json'),
  ])

  const nonEn = lang !== 'en'
  const langSents = s.sentences || []

  const toRoman = item => (item && typeof item === 'object') ? (item.roman || '') : (item || '')
  const toHindi = item => (item && typeof item === 'object') ? (item.hindi || '') : ''

  // For non-English, concatenate sentences into longer passages for countdown mode
  function buildLongTexts(count = 12, perText = 5) {
    return Array.from({ length: count }, () => {
      const shuffled = [...langSents].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(perText, langSents.length))
      const roman = selected.map(toRoman).join(' ')
      const hindi = selected.map(toHindi).filter(Boolean).join(' ')
      return hindi ? { roman, hindi } : roman
    })
  }

  return {
    words: w.words,
    sentences: {
      rookie:   nonEn ? langSents : rs.sentences,
      standard: langSents,
      advanced: nonEn ? langSents : as.sentences,
      elite:    nonEn ? langSents : esl.sentences,
    },
    longTexts: {
      standard: nonEn ? buildLongTexts() : l.texts,
      advanced: nonEn ? buildLongTexts() : al.texts,
      elite:    nonEn ? buildLongTexts() : el.texts,
    },
    codeSnippets: cs.snippets,
    quotes: q.quotes,
  }
}

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

function hashStr(str) {
  return str.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0x7fffffff, 0)
}

export function pickPassage(mode, difficulty = 'standard', data, exclude = null, wordCount = 0) {
  if (mode === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    const pool = [...(data.sentences?.standard || []), ...(data.sentences?.advanced || [])]
    return pool[hashStr(today) % pool.length]
  }

  if (mode === 'quotes') {
    const pool = data.quotes || []
    if (!pool.length) return { text: 'No quotes available.', author: null }
    const excludeText = typeof exclude === 'object' ? exclude?.text : exclude
    let entry = randomFrom(pool)
    for (let i = 0; i < 10 && entry?.text === excludeText; i++) entry = randomFrom(pool)
    return entry
  }

  if (mode === 'words') {
    const n = wordCount || 25
    const pool = data.sentences[difficulty] || data.sentences.standard || []
    const words = []
    let attempts = 0
    while (words.length < n + 5 && attempts < 30) {
      const sentence = randomFrom(pool)
      if (sentence) {
        const raw = (sentence && typeof sentence === 'object') ? (sentence.roman || '') : sentence
        const clean = raw.replace(/[.!?।]+$/, '')
        words.push(...clean.split(/\s+/).filter(Boolean))
      }
      attempts++
    }
    const chosen = words.slice(0, n)
    return chosen.join(' ') + '.'
  }

  let pool
  if (mode === 'code') {
    pool = data.codeSnippets
  } else if (mode === 'countdown') {
    if (difficulty === 'rookie') pool = data.sentences.rookie || data.sentences.standard
    else pool = data.longTexts[difficulty] || data.longTexts.standard
  } else {
    pool = data.sentences[difficulty] || data.sentences.standard
  }

  if (!exclude || pool.length <= 1) return randomFrom(pool)
  let result = randomFrom(pool)
  for (let i = 0; i < 15 && result === exclude; i++) result = randomFrom(pool)
  return result
}
