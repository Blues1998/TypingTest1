import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AchievementIcon } from './AchievementIcon.jsx'
import { TIER_META } from '../utils/achievements.js'

export function AchievementToast() {
  const [visible, setVisible] = useState(null)
  const queueRef = useRef([])
  const timerRef = useRef(null)

  function showNext() {
    if (queueRef.current.length === 0) {
      setVisible(null)
      return
    }
    const next = queueRef.current.shift()
    setVisible(next)
    timerRef.current = setTimeout(() => showNext(), 3400)
  }

  useEffect(() => {
    function onAchievements(e) {
      const incoming = e.detail || []
      if (incoming.length === 0) return

      // If nothing is showing, display immediately; otherwise queue
      if (!visible && queueRef.current.length === 0) {
        const [first, ...rest] = incoming
        queueRef.current = rest
        setVisible(first)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => showNext(), 3400)
      } else {
        queueRef.current.push(...incoming)
      }
    }

    window.addEventListener('typingtest-achievements', onAchievements)
    return () => {
      window.removeEventListener('typingtest-achievements', onAchievements)
      clearTimeout(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const tier = TIER_META[visible.tier] ?? TIER_META.bronze

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={visible.id}
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{    opacity: 0, y: 30,  scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.875rem 1.25rem',
          borderRadius: '0.875rem',
          borderLeft: `4px solid ${tier.color}`,
          border: `1px solid ${tier.color}`,
          background: 'var(--color-bg)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${tier.color}33`,
          minWidth: 260,
          maxWidth: 380,
          pointerEvents: 'none',
        }}
      >
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            filter: `drop-shadow(0 0 6px ${tier.color})`,
          }}
        >
          <AchievementIcon icon={visible.icon} size={36} color={tier.color} />
        </div>

        {/* Text */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: tier.color,
              marginBottom: 2,
            }}
          >
            {tier.label} achievement unlocked
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {visible.label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-sub)', marginTop: 2, lineHeight: 1.3 }}>
            {visible.desc}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
