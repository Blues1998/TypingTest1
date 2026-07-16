import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { BUBBLE_PRESETS, getWordsByTier } from '../utils/levelSystem.js'
import { savePersonalScore, getPersonalScores } from '../services/scoreService.js'
import { checkAchievements } from '../utils/achievements.js'

export const CANVAS_W = 1200
export const CANVAS_H = 700

// ── Helpers ────────────────────────────────────────────────────────────────

function rand(min, max) { return min + Math.random() * (max - min) }
function randInt(min, max) { return Math.floor(rand(min, max + 1)) }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function generateAsteroidPoints(baseR) {
  const n = randInt(8, 11)
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 + rand(-0.35, 0.35)
    const r = baseR * rand(0.6, 1.35)
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })
}

function generateStars() {
  const layers = [
    { count: 120, minR: 0.4, maxR: 0.9,  minOp: 0.2, maxOp: 0.5,  speed: 0.12 },
    { count: 60,  minR: 0.7, maxR: 1.4,  minOp: 0.3, maxOp: 0.7,  speed: 0.28 },
    { count: 30,  minR: 1.2, maxR: 2.2,  minOp: 0.5, maxOp: 1.0,  speed: 0.55 },
  ]
  return layers.flatMap((l, layer) =>
    Array.from({ length: l.count }, () => ({
      x: rand(0, CANVAS_W),
      y: rand(0, CANVAS_H),
      r: rand(l.minR, l.maxR),
      opacity: rand(l.minOp, l.maxOp),
      speed: l.speed,
      layer,
    }))
  )
}

function getNextWord(poolRef, allWords) {
  if (poolRef.current.length === 0) poolRef.current = [...allWords]
  const idx = Math.floor(Math.random() * poolRef.current.length)
  const word = poolRef.current[idx]
  poolRef.current.splice(idx, 1)
  return word
}

// ── Drawing ────────────────────────────────────────────────────────────────

function drawStars(ctx, stars, speed) {
  for (const s of stars) {
    // Speed streaks at high velocity — horizontal trails behind each star
    const trailW = Math.max(0, (speed - 2.0) * 3.5 * s.r)
    if (trailW > 0) {
      const g = ctx.createLinearGradient(s.x - trailW, s.y, s.x, s.y)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(1, `rgba(255,255,255,${s.opacity * 0.7})`)
      ctx.beginPath()
      ctx.moveTo(s.x - trailW, s.y)
      ctx.lineTo(s.x, s.y)
      ctx.strokeStyle = g
      ctx.lineWidth = s.r * 1.2
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
    ctx.fill()

    s.y += s.speed
    if (s.y > CANVAS_H + 2) s.y = -2
  }
}

function drawPlanet(ctx, score) {
  const t = Math.min(score / 50, 1)
  const scale = 0.28 + t * 0.72
  const R = 80 * scale
  const px = CANVAS_W - 115
  const py = 105

  // Atmosphere halo
  const halo = ctx.createRadialGradient(px, py, R * 0.9, px, py, R * 1.9)
  halo.addColorStop(0, `rgba(255,140,40,${0.1 * scale})`)
  halo.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(px, py, R * 1.9, 0, Math.PI * 2)
  ctx.fillStyle = halo
  ctx.fill()

  // Planet body
  const grad = ctx.createRadialGradient(px - R * 0.28, py - R * 0.28, 0, px, py, R)
  grad.addColorStop(0,   '#f0b870')
  grad.addColorStop(0.4, '#c06820')
  grad.addColorStop(0.75,'#7a3008')
  grad.addColorStop(1,   '#1a0400')
  ctx.beginPath()
  ctx.arc(px, py, R, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Surface bands (subtle)
  ctx.save()
  ctx.beginPath()
  ctx.arc(px, py, R, 0, Math.PI * 2)
  ctx.clip()
  for (let i = -3; i <= 3; i++) {
    const bandY = py + i * R * 0.28
    ctx.beginPath()
    ctx.ellipse(px, bandY, R, R * 0.06, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,0,0,${0.12 + Math.abs(i) * 0.04})`
    ctx.fill()
  }
  ctx.restore()

  // Ring
  ctx.save()
  ctx.translate(px, py)
  ctx.scale(1, 0.22)
  const ringGrad = ctx.createRadialGradient(0, 0, R * 1.1, 0, 0, R * 1.8)
  ringGrad.addColorStop(0,   `rgba(210,140,60,${0.35 * scale})`)
  ringGrad.addColorStop(0.6, `rgba(180,110,40,${0.2 * scale})`)
  ringGrad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.arc(0, 0, R * 1.8, 0, Math.PI * 2)
  ctx.fillStyle = ringGrad
  ctx.fill()
  ctx.restore()
}

function drawAsteroid(ctx, a) {
  const { x, y, rotation, points, baseR, trail, word, tier, vy } = a

  // Comet trail — opacity and thickness scale with asteroid speed (vy)
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      const frac = i / trail.length
      ctx.beginPath()
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
      ctx.lineTo(trail[i].x, trail[i].y)
      ctx.strokeStyle = `rgba(255,140,60,${frac * Math.min(0.55, 0.22 + vy * 0.07)})`
      ctx.lineWidth = frac * Math.min(9, 5 + vy * 0.6)
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  // Rock body — gradient and edge glow differ by tier
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  const grad = ctx.createRadialGradient(-baseR * 0.2, -baseR * 0.2, 0, 0, 0, baseR)
  if (tier === 'small') {
    grad.addColorStop(0,   '#8ab4cc')
    grad.addColorStop(0.5, '#4a7090')
    grad.addColorStop(1,   '#0e1e30')
  } else if (tier === 'large') {
    grad.addColorStop(0,   '#8a5048')
    grad.addColorStop(0.5, '#5a2820')
    grad.addColorStop(1,   '#200808')
  } else {
    // medium — original brown
    grad.addColorStop(0,   '#7a6248')
    grad.addColorStop(0.5, '#5a4030')
    grad.addColorStop(1,   '#28180a')
  }

  ctx.beginPath()
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Edge glow by tier
  if (tier === 'small') {
    ctx.strokeStyle = 'rgba(100,200,255,0.35)'
  } else if (tier === 'large') {
    ctx.strokeStyle = 'rgba(255,80,60,0.35)'
  } else {
    ctx.strokeStyle = 'rgba(255,160,60,0.2)'
  }
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()

  // Word label with glow — color by tier
  ctx.save()
  if (tier === 'small') {
    ctx.shadowColor = 'rgba(100,220,255,0.9)'
  } else if (tier === 'large') {
    ctx.shadowColor = 'rgba(255,160,100,0.9)'
  } else {
    ctx.shadowColor = 'rgba(255,220,120,0.9)'
  }
  ctx.shadowBlur = 10
  const fontSize = Math.max(13, Math.min(20, 13 + Math.floor(baseR / 12)))
  ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(word, x, y)
  ctx.restore()
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.save()
    ctx.globalAlpha = p.life
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 4
    ctx.fill()
    ctx.restore()
  }
}

function drawShockwaves(ctx, shockwaves) {
  for (const sw of shockwaves) {
    // Outer ring
    ctx.beginPath()
    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,50,30,${sw.life * 0.8})`
    ctx.lineWidth = 2.5
    ctx.stroke()
    // Inner ring (faster, smaller)
    const innerR = sw.r * 0.55
    if (innerR > 0) {
      ctx.beginPath()
      ctx.arc(sw.x, sw.y, innerR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,120,60,${sw.life * 0.5})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

function drawShootingStars(ctx, stars) {
  for (const ss of stars) {
    const headX = ss.x
    const headY = ss.y
    const tailX = headX - ss.vx * ss.tailLen
    const tailY = headY - ss.vy * ss.tailLen
    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(1, `rgba(255,255,255,${ss.life * 0.9})`)
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(headX, headY)
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ── Main Hook ──────────────────────────────────────────────────────────────

export function useBubbleGame({ canvasRef, words = [], difficulty = 'pilot', onDestroy, onInput }) {
  const preset = BUBBLE_PRESETS[difficulty] || BUBBLE_PRESETS.pilot
  const tieredWords = useMemo(() => getWordsByTier(words, difficulty), [words, difficulty])

  const [score,   setScore]   = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [wave,    setWave]    = useState(1)
  const [phase,   setPhase]   = useState('idle')
  const [timeTaken, setTimeTaken] = useState(0)

  const startTimeRef = useRef(null)

  // All hot game state in refs to avoid stale closures in RAF
  const asteroidsRef     = useRef([])
  const particlesRef     = useRef([])
  const shockwavesRef    = useRef([])
  const shootingStarsRef = useRef([])
  const starsRef         = useRef(generateStars())
  const speedRef         = useRef(preset.speed)
  const scoreRef         = useRef(0)
  const strikesRef       = useRef(0)
  const waveRef          = useRef(1)
  const spawnIntervalRef = useRef(preset.spawn)
  const wordPoolRef      = useRef([...tieredWords])
  const rafRef           = useRef(null)
  const spawnTimerRef    = useRef(null)
  const shootTimerRef    = useRef(null)
  const phaseRef         = useRef('idle')
  const inputRef         = useRef(null)
  const gameLoopRef      = useRef(null)  // bridge so restart() can re-enter the loop

  // ── Spawners ──────────────────────────────────────────────────────────

  const spawnShootingStar = useCallback(() => {
    if (phaseRef.current === 'gameover') return
    const angle = rand(0.3, 0.65)
    const speed = rand(8, 14)
    shootingStarsRef.current.push({
      x: rand(CANVAS_W * 0.1, CANVAS_W * 0.6),
      y: rand(10, 60),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      tailLen: rand(5, 10),
      life: 1.0,
      decay: rand(0.015, 0.025),
    })
    shootTimerRef.current = setTimeout(spawnShootingStar, rand(4000, 9000))
  }, [])

  const spawnAsteroid = useCallback(() => {
    if (phaseRef.current !== 'running') return
    const word  = getNextWord(wordPoolRef, tieredWords)
    const baseR = 38 + word.length * 3
    const tier  = word.length <= 4 ? 'small' : word.length <= 7 ? 'medium' : 'large'
    const x     = baseR + 15 + Math.random() * (CANVAS_W - (baseR + 15) * 2)
    asteroidsRef.current.push({
      id:       Math.random().toString(36).slice(2),
      word,
      tier,
      x, y: -baseR,
      vx: rand(-0.3, 0.3),
      vy: speedRef.current,
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.008, 0.008),
      points:   generateAsteroidPoints(baseR),
      baseR,
      trail:    [],
    })
    spawnTimerRef.current = setTimeout(spawnAsteroid, spawnIntervalRef.current)
  }, [tieredWords])

  // ── Explosion ─────────────────────────────────────────────────────────

  function spawnExplosion(x, y) {
    const colors = ['#ffffff','#ffdd66','#ff9933','#00ddff','#aaffcc','#ff6644']
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = rand(1.5, 6)
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0.5, 1.5),
        life: 1.0,
        decay: rand(0.016, 0.030),
        r: rand(1.5, 4),
        color: choice(colors),
      })
    }
  }

  function spawnShockwave(x, y) {
    shockwavesRef.current.push({ x, y, r: 8, life: 1.0, decay: 0.034 })
  }

  // ── Input handler ─────────────────────────────────────────────────────

  function handleWordInput(e) {
    onInput?.()
    const typed = e.target.value.trim()
    const idx = asteroidsRef.current.findIndex(a => a.word === typed)
    if (idx === -1) return

    const a = asteroidsRef.current[idx]
    spawnExplosion(a.x, a.y)
    onDestroy?.()
    asteroidsRef.current.splice(idx, 1)
    e.target.value = ''

    const newScore = scoreRef.current + 1
    scoreRef.current = newScore
    setScore(newScore)

    // Wave: every 5 points
    if (newScore % 5 === 0) {
      const newWave = waveRef.current + 1
      waveRef.current = newWave
      setWave(newWave)
      speedRef.current = Math.min(4.5, speedRef.current + 0.18)
    }
    // Spawn interval tightens every 3 points
    if (newScore % 3 === 0) {
      spawnIntervalRef.current = Math.max(1100, spawnIntervalRef.current - 100)
    }
  }

  // ── Game over ─────────────────────────────────────────────────────────

  const endGame = useCallback(() => {
    phaseRef.current = 'gameover'
    setPhase('gameover')
    cancelAnimationFrame(rafRef.current)
    clearTimeout(spawnTimerRef.current)
    clearTimeout(shootTimerRef.current)

    const finalTimeTaken = startTimeRef.current
      ? Math.round(((Date.now() - startTimeRef.current) / 1000) * 10) / 10
      : 0
    setTimeTaken(finalTimeTaken)
    savePersonalScore({ wpm: scoreRef.current, accuracy: 100, timeTaken: finalTimeTaken, mode: 'bubble' })
    checkAchievements(getPersonalScores())
  }, [])

  // ── Start (idle → running) ────────────────────────────────────────────

  function start() {
    speedRef.current         = preset.speed
    spawnIntervalRef.current = preset.spawn
    wordPoolRef.current      = [...tieredWords]
    asteroidsRef.current     = []
    particlesRef.current     = []
    shockwavesRef.current    = []
    scoreRef.current         = 0
    strikesRef.current       = 0
    waveRef.current          = 1
    phaseRef.current         = 'running'
    startTimeRef.current     = Date.now()

    setScore(0)
    setStrikes(0)
    setWave(1)
    setPhase('running')
    setTimeTaken(0)

    // RAF is already running (background animation from idle)
    spawnTimerRef.current = setTimeout(spawnAsteroid, 700)
    // shootTimerRef already running from idle — leave it alone
  }

  // ── Main RAF loop ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!canvasRef.current || tieredWords.length === 0) return

    wordPoolRef.current = [...tieredWords]
    phaseRef.current    = 'idle'

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    function gameLoop() {
      // Background — always rendered regardless of phase
      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      drawStars(ctx, starsRef.current, speedRef.current)
      drawPlanet(ctx, scoreRef.current)

      // Shooting stars — always animate (halts via spawnShootingStar guard during gameover)
      for (const ss of shootingStarsRef.current) {
        ss.x += ss.vx
        ss.y += ss.vy
        ss.life -= ss.decay
      }
      shootingStarsRef.current = shootingStarsRef.current.filter(ss => ss.life > 0)
      drawShootingStars(ctx, shootingStarsRef.current)

      // Game logic — only while running
      if (phaseRef.current === 'running') {
        let newStrikes = 0
        const surviving = []
        for (const a of asteroidsRef.current) {
          a.y += a.vy
          a.x += a.vx
          a.rotation += a.rotSpeed
          a.trail.push({ x: a.x, y: a.y })
          const maxTrail = Math.min(32, 18 + Math.floor(speedRef.current * 5))
          if (a.trail.length > maxTrail) a.trail.shift()

          if (a.y - a.baseR > CANVAS_H) {
            newStrikes++
            spawnShockwave(a.x, CANVAS_H - 10)
          } else {
            surviving.push(a)
          }
        }

        if (newStrikes > 0) {
          asteroidsRef.current = []
          const total = strikesRef.current + newStrikes
          strikesRef.current = total
          setStrikes(total)
          if (total >= 3) { endGame(); return }
        } else {
          asteroidsRef.current = surviving
        }

        for (const a of asteroidsRef.current) drawAsteroid(ctx, a)

        // Particles
        for (const p of particlesRef.current) {
          p.vy += 0.11
          p.x  += p.vx
          p.y  += p.vy
          p.life -= p.decay
        }
        particlesRef.current = particlesRef.current.filter(p => p.life > 0)
        drawParticles(ctx, particlesRef.current)

        // Shockwaves
        for (const sw of shockwavesRef.current) {
          sw.r    += 3.5
          sw.life -= sw.decay
        }
        shockwavesRef.current = shockwavesRef.current.filter(sw => sw.life > 0)
        drawShockwaves(ctx, shockwavesRef.current)
      }

      rafRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = gameLoop

    rafRef.current = requestAnimationFrame(gameLoop)
    // Start shooting stars immediately (background animation in idle too)
    shootTimerRef.current = setTimeout(spawnShootingStar, rand(2000, 5000))
    // Do NOT start asteroid spawner here — start() will do it

    function handleVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current)
        clearTimeout(spawnTimerRef.current)
        clearTimeout(shootTimerRef.current)
      } else if (phaseRef.current === 'running') {
        rafRef.current = requestAnimationFrame(gameLoop)
        spawnTimerRef.current = setTimeout(spawnAsteroid, spawnIntervalRef.current)
        shootTimerRef.current = setTimeout(spawnShootingStar, rand(3000, 7000))
      } else if (phaseRef.current === 'idle') {
        rafRef.current = requestAnimationFrame(gameLoop)
        shootTimerRef.current = setTimeout(spawnShootingStar, rand(3000, 7000))
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(spawnTimerRef.current)
      clearTimeout(shootTimerRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [canvasRef, tieredWords.length, spawnAsteroid, spawnShootingStar, endGame])

  // ── Restart (gameover → running) ───────────────────────────────────────

  function restart() {
    cancelAnimationFrame(rafRef.current)
    clearTimeout(spawnTimerRef.current)
    clearTimeout(shootTimerRef.current)

    asteroidsRef.current     = []
    particlesRef.current     = []
    shockwavesRef.current    = []
    shootingStarsRef.current = []
    starsRef.current         = generateStars()
    speedRef.current         = preset.speed
    scoreRef.current         = 0
    strikesRef.current       = 0
    waveRef.current          = 1
    spawnIntervalRef.current = preset.spawn
    wordPoolRef.current      = [...tieredWords]
    phaseRef.current         = 'running'
    startTimeRef.current     = Date.now()

    setScore(0)
    setStrikes(0)
    setWave(1)
    setPhase('running')
    setTimeTaken(0)

    rafRef.current        = requestAnimationFrame(gameLoopRef.current)
    spawnTimerRef.current = setTimeout(spawnAsteroid, 700)
    shootTimerRef.current = setTimeout(spawnShootingStar, rand(2000, 5000))
  }

  return { score, strikes, wave, phase, timeTaken, inputRef, handleWordInput, start, restart, CANVAS_W, CANVAS_H }
}
