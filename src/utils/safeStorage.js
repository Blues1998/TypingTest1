// localStorage can throw synchronously (Safari "Block All Cookies", sandboxed
// iframes, quota exceeded) — every call site must tolerate that without
// crashing the app.

export function safeGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch {
    return fallback
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch { /* ignore */ }
}

// JSON-typed variants: read/write structured values, tolerating both the
// storage throwing and malformed/absent JSON.
export function safeGetJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
