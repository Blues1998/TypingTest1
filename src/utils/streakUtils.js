const DAILY_PREFIX = 'typingtest_daily_'

function dateKey(date = new Date()) {
  return DAILY_PREFIX + date.toISOString().slice(0, 10)
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
