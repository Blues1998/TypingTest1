import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeaderboardSubmit } from '../../hooks/useLeaderboardSubmit.js'

const state = vi.hoisted(() => ({ supabase: {} }))
const svc = vi.hoisted(() => ({ submitScore: vi.fn(), getMyRank: vi.fn() }))

vi.mock('../../services/supabase.js', () => ({
  get supabase() { return state.supabase },
}))
vi.mock('../../services/scoreService.js', () => ({
  submitScore: svc.submitScore,
  getMyRank: svc.getMyRank,
}))

const params = { mode: 'stopwatch', wpm: 70, accuracy: 96, timeTaken: 30, difficulty: 'standard' }

describe('useLeaderboardSubmit', () => {
  beforeEach(() => {
    localStorage.clear()
    state.supabase = {}
    svc.submitScore.mockReset().mockResolvedValue(undefined)
    svc.getMyRank.mockReset().mockResolvedValue(3)
  })
  afterEach(() => vi.restoreAllMocks())

  it('opens the username modal when no username is stored', () => {
    const { result } = renderHook(() => useLeaderboardSubmit(params))
    act(() => result.current.handleSubmitClick())
    expect(result.current.showModal).toBe(true)
    expect(svc.submitScore).not.toHaveBeenCalled()
  })

  it('submits directly when a username already exists', async () => {
    localStorage.setItem('typingtest_username', 'ada')
    const { result } = renderHook(() => useLeaderboardSubmit(params))
    await act(async () => { result.current.handleSubmitClick() })
    expect(svc.submitScore).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'ada', mode: 'stopwatch', wpm: 70 })
    )
    expect(result.current.submitted).toBe(true)
    expect(result.current.myRank).toBe(3)
  })

  it('handleModalConfirm stores the name, closes the modal, and submits', async () => {
    const { result } = renderHook(() => useLeaderboardSubmit(params))
    await act(async () => { result.current.handleModalConfirm('grace') })
    expect(localStorage.getItem('typingtest_username')).toBe('grace')
    expect(result.current.showModal).toBe(false)
    expect(result.current.submitted).toBe(true)
    expect(svc.submitScore).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'grace' })
    )
  })

  it('sets an error message when submission fails', async () => {
    svc.submitScore.mockRejectedValueOnce(new Error('network'))
    localStorage.setItem('typingtest_username', 'ada')
    const { result } = renderHook(() => useLeaderboardSubmit(params))
    await act(async () => { result.current.handleSubmitClick() })
    expect(result.current.submitError).toBe('Submit failed. Try again later.')
    expect(result.current.submitted).toBe(false)
  })

  it('does not set a rank when getMyRank returns null', async () => {
    svc.getMyRank.mockResolvedValueOnce(null)
    localStorage.setItem('typingtest_username', 'ada')
    const { result } = renderHook(() => useLeaderboardSubmit(params))
    await act(async () => { result.current.handleSubmitClick() })
    expect(result.current.submitted).toBe(true)
    expect(result.current.myRank).toBeNull()
  })

  it('does nothing when supabase is not configured', async () => {
    state.supabase = null
    localStorage.setItem('typingtest_username', 'ada')
    const { result } = renderHook(() => useLeaderboardSubmit(params))
    await act(async () => { result.current.handleSubmitClick() })
    expect(svc.submitScore).not.toHaveBeenCalled()
    expect(result.current.submitted).toBe(false)
  })
})
