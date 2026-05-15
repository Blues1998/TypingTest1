export function buildWeakKeyText(keyStats, words, targetWordCount = 50) {
  if (!keyStats || keyStats.length === 0 || !words || words.length === 0) return null

  // Find bottom 3 keys by accuracy (require at least 2 keystrokes recorded)
  const worst = keyStats
    .filter(s => s.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map(s => s.key)

  if (worst.length === 0) return null

  // Filter word list to entries that contain at least one weak key
  const relevant = words.filter(w =>
    worst.some(k => w.toLowerCase().includes(k))
  )

  if (relevant.length < 5) return null

  const chosen = []
  for (let i = 0; i < targetWordCount; i++) {
    chosen.push(relevant[Math.floor(Math.random() * relevant.length)])
  }

  return chosen.join(' ') + '.'
}
