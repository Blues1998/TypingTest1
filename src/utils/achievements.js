import { getDailyStreak } from './streakUtils.js'
import { WPM_MODES } from '../services/scoreService.js'
import { safeGet, safeSet } from './safeStorage.js'

// Tiers: bronze → silver → gold → diamond (1, requires all others)
export const TIER_META = {
  bronze:  { label: 'Bronze',  color: '#cd7f32', glow: 'rgba(205,127,50,0.35)' },
  silver:  { label: 'Silver',  color: '#a8a9ad', glow: 'rgba(168,169,173,0.35)' },
  gold:    { label: 'Gold',    color: '#e2b714', glow: 'rgba(226,183,20,0.35)'  },
  diamond: { label: 'Diamond', color: '#00ccff', glow: 'rgba(0,204,255,0.45)'   },
}

export const ACHIEVEMENTS = [
  // ── Bronze ───────────────────────────────────────────────────────────────
  {
    id: 'first_test', tier: 'bronze', icon: 'keyboard',
    label: 'First Steps',
    desc: 'Complete your first typing test',
  },
  {
    id: 'tests_10', tier: 'bronze', icon: 'stack',
    label: 'Getting Warmed Up',
    desc: 'Complete 10 tests',
  },
  {
    id: 'wpm_30', tier: 'bronze', icon: 'gauge',
    label: 'Picking Up Speed',
    desc: 'Reach 30 WPM on any test',
  },
  {
    id: 'wpm_50', tier: 'bronze', icon: 'bolt',
    label: 'Half Century',
    desc: 'Reach 50 WPM on any test',
  },
  {
    id: 'acc_perfect', tier: 'bronze', icon: 'target',
    label: 'Clean Slate',
    desc: 'Finish a test with 100% accuracy',
  },
  {
    id: 'mode_code', tier: 'bronze', icon: 'code',
    label: 'Code Curious',
    desc: 'Complete a code snippet test',
  },
  {
    id: 'mode_quotes', tier: 'bronze', icon: 'quote',
    label: 'Quote Collector',
    desc: 'Type a famous quote',
  },
  {
    id: 'mode_survival', tier: 'bronze', icon: 'sword',
    label: 'Survivor',
    desc: 'Complete a survival game',
  },
  {
    id: 'daily_first', tier: 'bronze', icon: 'star',
    label: 'Day One',
    desc: 'Complete the daily challenge',
  },
  {
    id: 'mode_words', tier: 'bronze', icon: 'lines',
    label: 'Word by Word',
    desc: 'Complete a word count test',
  },

  // ── Silver ───────────────────────────────────────────────────────────────
  {
    id: 'tests_50', tier: 'silver', icon: 'medal',
    label: 'Dedicated',
    desc: 'Complete 50 tests',
  },
  {
    id: 'wpm_75', tier: 'silver', icon: 'bolt2',
    label: 'Speed Demon',
    desc: 'Reach 75 WPM on any test',
  },
  {
    id: 'streak_3', tier: 'silver', icon: 'flame',
    label: 'On a Roll',
    desc: '3-day daily challenge streak',
  },
  {
    id: 'consistency_80', tier: 'silver', icon: 'wave',
    label: 'Steady Hands',
    desc: 'Score 80%+ consistency on any test',
  },
  {
    id: 'mode_all', tier: 'silver', icon: 'compass',
    label: 'Explorer',
    desc: 'Try 5 or more different game modes',
  },
  {
    id: 'acc_5_perfect', tier: 'silver', icon: 'stars5',
    label: 'Pinpoint',
    desc: 'Finish 5 tests with 100% accuracy',
  },
  {
    id: 'wpm_100', tier: 'silver', icon: 'trophy',
    label: 'Century Club',
    desc: 'Reach 100 WPM on any test',
  },
  {
    id: 'tests_100', tier: 'silver', icon: 'podium',
    label: 'Centurion',
    desc: 'Complete 100 tests',
  },

  // ── Gold ─────────────────────────────────────────────────────────────────
  {
    id: 'wpm_120', tier: 'gold', icon: 'rocket',
    label: 'Speed Machine',
    desc: 'Reach 120 WPM on any test',
  },
  {
    id: 'streak_7', tier: 'gold', icon: 'flame2',
    label: 'Weekly Warrior',
    desc: '7-day daily challenge streak',
  },
  {
    id: 'consistency_90', tier: 'gold', icon: 'wave2',
    label: 'Metronome',
    desc: 'Score 90%+ consistency on any test',
  },
  {
    id: 'tests_500', tier: 'gold', icon: 'anchor',
    label: 'Iron Will',
    desc: 'Complete 500 tests',
  },
  {
    id: 'streak_30', tier: 'gold', icon: 'calendar',
    label: 'Monthly Devotee',
    desc: '30-day daily challenge streak',
  },
  {
    id: 'wpm_150', tier: 'gold', icon: 'comet',
    label: 'Transcendent',
    desc: 'Reach 150 WPM — the elite tier',
  },
  {
    id: 'no_mistakes_10', tier: 'gold', icon: 'diamondcheck',
    label: 'Flawless',
    desc: 'Finish 10 separate tests with 100% accuracy',
  },

  // ── Diamond ───────────────────────────────────────────────────────────────
  {
    id: 'grandmaster', tier: 'diamond', icon: 'crown',
    label: 'Grandmaster',
    desc: 'Unlock every other achievement',
  },
]

// IDs of non-diamond achievements (used for grandmaster check)
const NON_DIAMOND_IDS = ACHIEVEMENTS.filter(a => a.tier !== 'diamond').map(a => a.id)

function checkCondition(id, scores, streak, stored) {
  const wpmScores = scores.filter(s => WPM_MODES.includes(s.mode))
  switch (id) {
    case 'first_test':     return scores.length >= 1
    case 'tests_10':       return scores.length >= 10
    case 'tests_50':       return scores.length >= 50
    case 'tests_100':      return scores.length >= 100
    case 'tests_500':      return scores.length >= 500
    case 'wpm_30':         return wpmScores.some(s => s.wpm >= 30)
    case 'wpm_50':         return wpmScores.some(s => s.wpm >= 50)
    case 'wpm_75':         return wpmScores.some(s => s.wpm >= 75)
    case 'wpm_100':        return wpmScores.some(s => s.wpm >= 100)
    case 'wpm_120':        return wpmScores.some(s => s.wpm >= 120)
    case 'wpm_150':        return wpmScores.some(s => s.wpm >= 150)
    case 'acc_perfect':    return wpmScores.some(s => s.accuracy >= 100)
    case 'acc_5_perfect':  return wpmScores.filter(s => s.accuracy >= 100).length >= 5
    case 'no_mistakes_10': return wpmScores.filter(s => s.accuracy >= 100).length >= 10
    case 'consistency_80': return wpmScores.some(s => s.consistency >= 80)
    case 'consistency_90': return wpmScores.some(s => s.consistency >= 90)
    case 'streak_3':       return streak >= 3
    case 'streak_7':       return streak >= 7
    case 'streak_30':      return streak >= 30
    case 'daily_first':    return scores.some(s => s.mode === 'daily')
    case 'mode_code':      return scores.some(s => s.mode === 'code')
    case 'mode_quotes':    return scores.some(s => s.mode === 'quotes')
    case 'mode_survival':  return scores.some(s => s.mode === 'survival')
    case 'mode_words':     return scores.some(s => s.mode === 'words')
    case 'mode_all': {
      const modes = new Set(scores.map(s => s.mode))
      return modes.size >= 5
    }
    case 'grandmaster':
      return NON_DIAMOND_IDS.every(aid => stored.has(aid))
    default: return false
  }
}

function safeParseAchievements() {
  try {
    return JSON.parse(safeGet('typingtest_achievements') || '[]')
  } catch {
    return []
  }
}

export function checkAchievements(scores) {
  const stored = new Set(safeParseAchievements())
  const streak = getDailyStreak()
  const newlyUnlocked = []

  for (const a of ACHIEVEMENTS) {
    if (!stored.has(a.id) && checkCondition(a.id, scores, streak, stored)) {
      newlyUnlocked.push(a)
      stored.add(a.id)
    }
  }

  if (newlyUnlocked.length > 0) {
    safeSet('typingtest_achievements', JSON.stringify([...stored]))
    window.dispatchEvent(new CustomEvent('typingtest-achievements', { detail: newlyUnlocked }))
  }

  return newlyUnlocked
}

export function getUnlockedSet() {
  return new Set(safeParseAchievements())
}

export function getUnlockedAchievements() {
  const stored = getUnlockedSet()
  return ACHIEVEMENTS.filter(a => stored.has(a.id))
}

export function getAllAchievements() {
  return ACHIEVEMENTS
}
