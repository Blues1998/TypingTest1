import { useState, useEffect } from 'react'
import { safeGet, safeSet } from '../utils/safeStorage.js'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = safeGet('typingtest_theme', 'dark')
    document.documentElement.setAttribute('data-theme', stored)
    return stored
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    safeSet('typingtest_theme', theme)
  }, [theme])

  return {
    theme,
    isDark: theme === 'dark',
    toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
  }
}
