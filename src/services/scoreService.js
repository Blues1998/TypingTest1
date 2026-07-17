import { supabase } from './supabase.js'
import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/safeStorage.js'

const LS_KEY = 'typingtest_scores'

// Modes whose `wpm` field is a genuine words-per-minute figure. Other modes
// (survival's word count, bubble's arcade score) reuse the `wpm` field for
// storage convenience but must be excluded from aggregate WPM stats.
export const WPM_MODES = ['stopwatch', 'countdown', 'words', 'quotes', 'daily', 'code']

function safeParseScores() {
  return safeGetJSON(LS_KEY, [])
}

// ── Personal (localStorage) ────────────────────────────────────────────────

export function savePersonalScore({ wpm, accuracy, timeTaken, mode, difficulty = null, consistency = null, keyStats = null }) {
  const all = safeParseScores()
  all.push({ wpm, accuracy, timeTaken, mode, difficulty, consistency, keyStats, timestamp: Date.now() })
  safeSetJSON(LS_KEY, all.slice(-200))
}

export function getAggregateKeyStats() {
  const all = getPersonalScores()
  const map = {}
  for (const score of all) {
    if (!score.keyStats) continue
    for (const s of score.keyStats) {
      if (!map[s.key]) map[s.key] = { total: 0, errors: 0 }
      map[s.key].total  += s.total
      map[s.key].errors += s.errors
    }
  }
  return Object.entries(map).map(([key, v]) => ({
    key,
    accuracy: Math.round(((v.total - v.errors) / v.total) * 100),
    errors:   v.errors,
    total:    v.total,
  }))
}

export function getPersonalScores(mode = null) {
  const all = safeParseScores()
  return mode ? all.filter(s => s.mode === mode) : all
}

export function clearPersonalScores() {
  safeRemove(LS_KEY)
}

// ── Aggregate stats ────────────────────────────────────────────────────────

// periodDays: number of days to include in the avg stats window, or null for all-time
export function getStatsOverview(periodDays = 7) {
  const all = getPersonalScores()
  if (all.length === 0) return null

  // Best WPM per mode (all-time)
  const modeMap = {}
  for (const s of all) {
    if (!modeMap[s.mode] || s.wpm > modeMap[s.mode]) modeMap[s.mode] = s.wpm
  }

  // Period averages — only over modes where wpm/accuracy are genuine figures
  const cutoff = periodDays ? Date.now() - periodDays * 24 * 60 * 60 * 1000 : 0
  const recentAll = periodDays ? all.filter(s => s.timestamp >= cutoff) : all
  const recent = recentAll.filter(s => WPM_MODES.includes(s.mode))
  const avgAccuracy7d = recent.length
    ? Math.round(recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length)
    : null
  const avgWpm7d = recent.length
    ? Math.round(recent.reduce((sum, s) => sum + s.wpm, 0) / recent.length)
    : null

  // Favorite mode (most played, all-time)
  const modeCounts = {}
  for (const s of all) modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1
  const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Unique days played (all-time)
  const days = new Set(all.map(s => new Date(s.timestamp).toISOString().slice(0, 10)))

  return {
    totalTests: all.length,
    bestPerMode: modeMap,
    avgAccuracy7d,
    avgWpm7d,
    favoriteMode,
    totalDays: days.size,
  }
}

// ── Global (Supabase) ──────────────────────────────────────────────────────

export async function submitScore({ username, mode, wpm, accuracy, timeTaken, difficulty = null }) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('scores').insert({
    username,
    mode,
    wpm,
    accuracy,
    time_taken: timeTaken,
    difficulty,
  })
  if (error) throw error
}

export async function getMyRank(mode, wpm) {
  if (!supabase) return null
  const { count, error } = await supabase
    .from('scores')
    .select('*', { count: 'exact', head: true })
    .eq('mode', mode)
    .gt('wpm', wpm)
  if (error) return null
  return (count ?? 0) + 1
}

export async function getLeaderboard(mode, limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('scores')
    .select('username, wpm, accuracy, time_taken, created_at')
    .eq('mode', mode)
    .order('wpm', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
