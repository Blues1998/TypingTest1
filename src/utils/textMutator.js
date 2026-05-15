const COMMA_MARKS = [',', ',', ',', ';', ':']

export function mutateText(text, { numbers = false, punctuation = false } = {}) {
  if (!numbers && !punctuation) return text

  // Strip trailing period/punctuation to rebuild cleanly
  const stripped = text.trim().replace(/[.!?]+$/, '')
  const words = stripped.split(/\s+/)

  const result = words.map((word, i) => {
    const isLast = i === words.length - 1
    // Remove any trailing punctuation from the original word
    let w = word.replace(/[.,;:!?]+$/, '')

    // Numbers: replace ~12% of non-last words with a random integer
    if (numbers && !isLast && Math.random() < 0.12) {
      w = String(Math.floor(Math.random() * 100) + 1)
    }

    // Punctuation: add a comma/semicolon after ~18% of non-last words
    if (punctuation && !isLast && Math.random() < 0.18) {
      w += COMMA_MARKS[Math.floor(Math.random() * COMMA_MARKS.length)]
    }

    return w
  })

  return result.join(' ') + '.'
}
