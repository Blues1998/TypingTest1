import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSound } from '../../hooks/useSound.js'

function makeMockContext() {
  const node = () => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    Q: { value: 0 },
    type: '',
    buffer: null,
  })
  return {
    state: 'suspended',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(16) })),
    createBufferSource: vi.fn(node),
    createGain: vi.fn(node),
    createBiquadFilter: vi.fn(node),
    createOscillator: vi.fn(node),
  }
}

describe('useSound', () => {
  beforeEach(() => {
    localStorage.clear()
    delete window._typingAudioCtx
    delete window.AudioContext
    delete window.webkitAudioContext
  })
  afterEach(() => {
    vi.restoreAllMocks()
    delete window._typingAudioCtx
    delete window.AudioContext
  })

  it('is enabled by default when storage is empty', () => {
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(true)
  })

  it('is disabled when storage explicitly stores "false"', () => {
    localStorage.setItem('typingtest_sound', 'false')
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(false)
  })

  it('toggle flips enabled state and persists it', () => {
    const { result } = renderHook(() => useSound())
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(false)
    expect(localStorage.getItem('typingtest_sound')).toBe('false')
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(true)
    expect(localStorage.getItem('typingtest_sound')).toBe('true')
  })

  it('play helpers do not throw when no AudioContext is available', () => {
    const { result } = renderHook(() => useSound())
    expect(() => {
      result.current.playClick()
      result.current.playError()
      result.current.playBoom()
    }).not.toThrow()
  })

  it('synthesises audio nodes when an AudioContext exists and sound is enabled', () => {
    const ctx = makeMockContext()
    window.AudioContext = vi.fn(function () { return ctx })
    const { result } = renderHook(() => useSound())

    result.current.playClick()
    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.createBufferSource).toHaveBeenCalled()

    result.current.playError()
    expect(ctx.createOscillator).toHaveBeenCalled()

    result.current.playBoom()
    expect(ctx.createBiquadFilter).toHaveBeenCalled()
  })

  it('produces no audio when sound is disabled', () => {
    localStorage.setItem('typingtest_sound', 'false')
    const ctx = makeMockContext()
    window.AudioContext = vi.fn(function () { return ctx })
    const { result } = renderHook(() => useSound())

    result.current.playClick()
    result.current.playError()
    result.current.playBoom()
    expect(window.AudioContext).not.toHaveBeenCalled()
  })
})
