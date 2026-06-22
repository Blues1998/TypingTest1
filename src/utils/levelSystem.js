export const SUPPORTED_LANGS = [
  { key: 'en', label: 'EN' },
  { key: 'es', label: 'ES' },
  { key: 'fr', label: 'FR' },
  { key: 'de', label: 'DE' },
  { key: 'hi', label: 'HI' },
]

export const RANKS = [
  { min: 0,   label: 'Novice',   color: '#555555' },
  { min: 30,  label: 'Beginner', color: '#a0a0a0' },
  { min: 45,  label: 'Standard', color: '#d1d1d1' },
  { min: 65,  label: 'Advanced', color: '#00ccff' },
  { min: 90,  label: 'Expert',   color: '#e2b714' },
  { min: 120, label: 'Master',   color: '#ff8844' },
]

export function getRank(bestWpm) {
  const wpm = bestWpm || 0
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (wpm >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

// ── Difficulty preference per mode ─────────────────────────────────────────

const prefKey = mode => `typingtest_difficulty_${mode}`

export function getDifficulty(mode) {
  return localStorage.getItem(prefKey(mode)) || 'standard'
}

export function setDifficulty(mode, tier) {
  localStorage.setItem(prefKey(mode), tier)
}

// ── Tier definitions ───────────────────────────────────────────────────────

export const TYPING_TIERS = ['rookie', 'standard', 'advanced', 'elite']

export const BUBBLE_TIERS = ['training', 'pilot', 'commander', 'admiral']

export const BUBBLE_PRESETS = {
  training:  { speed: 0.4, spawn: 3200 },
  pilot:     { speed: 0.9, spawn: 2500 },
  commander: { speed: 1.5, spawn: 2000 },
  admiral:   { speed: 2.2, spawn: 1500 },
}

// ── Word pool filtering for Stellar Drift ─────────────────────────────────

export function getWordsByTier(allWords, tier) {
  if (tier === 'training')  return allWords.filter(w => w.length <= 5)
  if (tier === 'admiral')   return allWords.filter(w => w.length >= 6)
  return allWords
}

// ── Simple text hash for ghost race key ───────────────────────────────────

export function hashText(text) {
  if (!text || text.length === 0) return 0
  return text.length * 31 + text.charCodeAt(0) * 17 + text.charCodeAt(text.length - 1)
}
