import { useRef, useState, useCallback } from 'react'
import { safeGet, safeSet } from '../utils/safeStorage.js'

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!window._typingAudioCtx || window._typingAudioCtx.state === 'closed') {
    try {
      window._typingAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch { return null }
  }
  return window._typingAudioCtx
}

function resumeCtx(ctx) {
  if (ctx && ctx.state === 'suspended') ctx.resume()
}

// Soft click: short filtered noise burst
function synthClick(ctx) {
  try {
    const bufSize = Math.floor(ctx.sampleRate * 0.018)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.5)
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3200
    filter.Q.value = 0.8
    gain.gain.value = 0.18
    src.buffer = buf
    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  } catch { /* ignore */ }
}

// Error thud: low-freq thump
function synthError(ctx) {
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch { /* ignore */ }
}

// Explosion boom: noise + low rumble (asteroid destroyed)
function synthBoom(ctx) {
  try {
    const bufSize = Math.floor(ctx.sampleRate * 0.35)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.2)
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 280
    gain.gain.value = 0.45
    src.buffer = buf
    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  } catch { /* ignore */ }
}

export function useSound() {
  const [enabled, setEnabled] = useState(
    () => safeGet('typingtest_sound') !== 'false'
  )
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const playClick = useCallback(() => {
    if (!enabledRef.current) return
    const ctx = getAudioContext()
    if (!ctx) return
    resumeCtx(ctx)
    synthClick(ctx)
  }, [])

  const playError = useCallback(() => {
    if (!enabledRef.current) return
    const ctx = getAudioContext()
    if (!ctx) return
    resumeCtx(ctx)
    synthError(ctx)
  }, [])

  const playBoom = useCallback(() => {
    if (!enabledRef.current) return
    const ctx = getAudioContext()
    if (!ctx) return
    resumeCtx(ctx)
    synthBoom(ctx)
  }, [])

  function toggle() {
    const next = !enabledRef.current
    safeSet('typingtest_sound', String(next))
    setEnabled(next)
  }

  return { enabled, toggle, playClick, playError, playBoom }
}
