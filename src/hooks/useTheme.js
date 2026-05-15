import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('typingtest_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', stored)
    return stored
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('typingtest_theme', theme)
  }, [theme])

  return {
    theme,
    isDark: theme === 'dark',
    toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
  }
}
