import { motion } from 'framer-motion'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { ACHIEVEMENTS, TIER_META, getUnlockedSet } from '../utils/achievements.js'
import { AchievementIcon } from '../components/AchievementIcon.jsx'

// ── Individual card ──────────────────────────────────────────────────────

function AchievementCard({ achievement, unlocked, index }) {
  const tier = TIER_META[achievement.tier]
  const isDiamond = achievement.tier === 'diamond'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border text-center"
      style={{
        background: unlocked
          ? isDiamond
            ? `radial-gradient(ellipse at top, ${tier.glow}, transparent 70%)`
            : `color-mix(in srgb, ${tier.color} 7%, var(--color-surface))`
          : 'var(--color-surface)',
        borderColor: unlocked ? tier.color : 'var(--color-border)',
        boxShadow: unlocked && isDiamond ? `0 0 28px ${tier.glow}` : 'none',
        opacity: unlocked ? 1 : 0.45,
      }}
    >
      {/* Tier badge dot */}
      <div
        className="absolute top-3 right-3 w-2 h-2 rounded-full"
        style={{ background: unlocked ? tier.color : 'var(--color-border)' }}
      />

      {/* Icon */}
      <div
        style={{
          color: unlocked ? tier.color : 'var(--color-sub)',
          filter: unlocked && isDiamond ? `drop-shadow(0 0 6px ${tier.color})` : 'none',
        }}
      >
        <AchievementIcon icon={unlocked ? achievement.icon : 'lock'} size={36} />
      </div>

      {/* Name */}
      <div
        className="font-bold text-sm leading-tight"
        style={{ color: unlocked ? 'var(--color-text)' : 'var(--color-sub)' }}
      >
        {unlocked ? achievement.label : '???'}
      </div>

      {/* Description */}
      <div className="text-xs leading-snug" style={{ color: 'var(--color-sub)' }}>
        {achievement.desc}
      </div>
    </motion.div>
  )
}

// ── Tier section ─────────────────────────────────────────────────────────

function TierSection({ tier, achievements, unlocked, startIndex }) {
  const meta = TIER_META[tier]
  const tierUnlocked = achievements.filter(a => unlocked.has(a.id)).length
  const isDiamond = tier === 'diamond'

  return (
    <div className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="h-px flex-1 rounded-full"
          style={{ background: `linear-gradient(to right, ${meta.color}, transparent)` }}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-sub)' }}>
            {tierUnlocked} / {achievements.length}
          </span>
        </div>
        <div
          className="h-px flex-1 rounded-full"
          style={{ background: `linear-gradient(to left, ${meta.color}, transparent)` }}
        />
      </div>

      {/* Cards */}
      <div className={isDiamond
        ? 'max-w-sm mx-auto'
        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
      }>
        {achievements.map((a, i) => (
          <AchievementCard
            key={a.id}
            achievement={a}
            unlocked={unlocked.has(a.id)}
            index={startIndex + i}
          />
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export function AchievementsPage() {
  const unlocked = getUnlockedSet()
  const total = ACHIEVEMENTS.filter(a => a.tier !== 'diamond').length
  const earned = ACHIEVEMENTS.filter(a => a.tier !== 'diamond' && unlocked.has(a.id)).length

  const byTier = {
    diamond: ACHIEVEMENTS.filter(a => a.tier === 'diamond'),
    gold:    ACHIEVEMENTS.filter(a => a.tier === 'gold'),
    silver:  ACHIEVEMENTS.filter(a => a.tier === 'silver'),
    bronze:  ACHIEVEMENTS.filter(a => a.tier === 'bronze'),
  }

  const pct = total > 0 ? Math.round((earned / total) * 100) : 0

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-10"
        >
          <h1 className="text-text text-2xl font-bold mb-1">achievements</h1>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sub text-sm">{earned} / {total} unlocked</span>
            <span className="text-main text-sm font-semibold">{pct}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden w-full max-w-xs">
            <div
              className="h-full rounded-full bg-main transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </motion.div>

        {/* Diamond first, then gold → silver → bronze */}
        <TierSection tier="diamond" achievements={byTier.diamond} unlocked={unlocked} startIndex={0} />
        <TierSection tier="gold"    achievements={byTier.gold}    unlocked={unlocked} startIndex={1} />
        <TierSection tier="silver"  achievements={byTier.silver}  unlocked={unlocked} startIndex={8} />
        <TierSection tier="bronze"  achievements={byTier.bronze}  unlocked={unlocked} startIndex={16} />
      </div>
    </PageWrapper>
  )
}
