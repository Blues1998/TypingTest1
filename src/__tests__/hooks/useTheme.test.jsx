import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../../hooks/useTheme.js'

describe('useTheme', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => document.documentElement.removeAttribute('data-theme'))

  it('defaults to the dark theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('applies data-theme to the document element on mount', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('reads a persisted theme from storage', () => {
    localStorage.setItem('typingtest_theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('toggle switches dark → light', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('toggle switches light → dark', () => {
    localStorage.setItem('typingtest_theme', 'light')
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
  })

  it('persists the theme to storage and the DOM after toggling', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(localStorage.getItem('typingtest_theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
