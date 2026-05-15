export function calcWpm(totalCharsTyped, elapsedSeconds) {
  if (elapsedSeconds < 0.5 || totalCharsTyped === 0) return 0
  return Math.round((totalCharsTyped / 5) / (elapsedSeconds / 60))
}

export function calcAccuracy(chars, inputLength) {
  if (inputLength === 0) return 100
  const correct = chars.slice(0, inputLength).filter(c => c.status === 'correct').length
  return Math.round((correct / inputLength) * 100)
}

export function calcConsistency(wordWpms) {
  if (!wordWpms || wordWpms.length < 3) return null
  const wpms = wordWpms.map(w => w.wpm).filter(v => v > 0 && v < 500)
  if (wpms.length < 3) return null
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length
  if (mean === 0) return null
  const variance = wpms.reduce((sum, v) => sum + (v - mean) ** 2, 0) / wpms.length
  const cv = Math.sqrt(variance) / mean
  return Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100))
}
