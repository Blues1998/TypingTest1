const DAILY_PREFIX = 'typingtest_daily_'

function dateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${DAILY_PREFIX}${y}-${m}-${d}`
}

export function recordDailyCompletion() {
  localStorage.setItem(dateKey(), '1')
}

export function hasDoneToday() {
  return localStorage.getItem(dateKey()) === '1'
}

export function getDailyStreak() {
  let streak = 0
  const d = new Date()
  while (localStorage.getItem(dateKey(d)) === '1') {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
