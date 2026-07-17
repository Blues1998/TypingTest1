import { safeGet } from '../utils/safeStorage.js'

const STOPWATCH_PREFIX = 'ghost_stopwatch_'

function ghostKeys() {
  // Enumerating localStorage can throw synchronously (Safari "Block All
  // Cookies", sandboxed iframes) — degrade to no runs rather than crashing.
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STOPWATCH_PREFIX)) keys.push(key)
    }
    return keys
  } catch {
    return []
  }
}

export function getGhostRuns() {
  const runs = []
  for (const key of ghostKeys()) {
    try {
      const parsed = JSON.parse(safeGet(key))
      if (!parsed || typeof parsed.text !== 'string') continue
      // Key format: ghost_stopwatch_{difficulty}_{numericHash}
      const afterPrefix = key.slice(STOPWATCH_PREFIX.length)
      const sep = afterPrefix.indexOf('_')
      const difficulty = sep !== -1 ? afterPrefix.slice(0, sep) : 'standard'
      runs.push({
        key,
        difficulty,
        wpm:       parsed.wpm       ?? 0,
        accuracy:  parsed.accuracy  ?? 0,
        timeTaken: parsed.timeTaken ?? 0,
        mistakes:  parsed.mistakes  ?? 0,
        text:      parsed.text,
        timestamp: parsed.timestamp ?? 0,
      })
    } catch { /* skip malformed records */ }
  }
  return runs.sort((a, b) => b.timestamp - a.timestamp)
}
