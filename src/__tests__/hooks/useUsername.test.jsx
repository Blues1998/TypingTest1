import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUsername } from '../../hooks/useUsername.js'

describe('useUsername', () => {
  beforeEach(() => localStorage.clear())

  it('starts with no username when storage is empty', () => {
    const { result } = renderHook(() => useUsername())
    expect(result.current.username).toBeNull()
    expect(result.current.hasUsername).toBe(false)
  })

  it('reads an existing username from storage', () => {
    localStorage.setItem('typingtest_username', 'ada')
    const { result } = renderHook(() => useUsername())
    expect(result.current.username).toBe('ada')
    expect(result.current.hasUsername).toBe(true)
  })

  it('setUsername updates state and persists to storage', () => {
    const { result } = renderHook(() => useUsername())
    act(() => result.current.setUsername('grace'))
    expect(result.current.username).toBe('grace')
    expect(result.current.hasUsername).toBe(true)
    expect(localStorage.getItem('typingtest_username')).toBe('grace')
  })

  it('hasUsername is false for an empty string', () => {
    const { result } = renderHook(() => useUsername())
    act(() => result.current.setUsername(''))
    expect(result.current.hasUsername).toBe(false)
  })
})
