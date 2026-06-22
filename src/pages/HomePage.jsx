import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DataContext } from '../App.jsx'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { getPersonalScores } from '../services/scoreService.js'
import {
  getRank,
  getDifficulty,
  setDifficulty,
  TYPING_TIERS,
  BUBBLE_TIERS,
} from '../utils/levelSystem.js'
import { getDailyStreak, hasDoneToday } from '../utils/streakUtils.js'

// ── Storage helpers ────────────────────────────────────────────────────────

const LS_DUR  = 'typingtest_countdown_dur'
const LS_WCNT = 'typingtest_words_count'
const LS_NUMS = 'typingtest_numbers'
const LS_PUNC = 'typingtest_punctuation'
const LS_LANG = 'typingtest_lang'

function getCountdownDur() { return parseInt(localStorage.getItem(LS_DUR) || '60', 10) }
function getWordCount()    { return parseInt(localStorage.getItem(LS_WCNT) || '25', 10) }

// ── Mode configs ───────────────────────────────────────────────────────────

const TYPING_MODES = [
  { key: 'stopwatch', label: 'stopwatch',     desc: 'type at your own pace, press enter when done',   icon: '⏱' },
  { key: 'countdown', label: 'countdown',     desc: 'type as much as you can before time runs out',   icon: '⏳', showDuration: true },
  { key: 'words',     label: 'word count',    desc: 'type an exact number of words as fast as you can', icon: '📝', showWordCount: true },
  { key: 'bubble',    label: 'stellar drift', desc: 'defend your planet - type incoming asteroids',    icon: '☄' },
]

const CHALLENGE_MODES = [
  { key: 'survival', label: 'survival',        desc: 'type words to add time - run out and you die',     icon: '⚡',  path: () => '/survival' },
  { key: 'ghost',    label: 'ghost race',       desc: 'race against your own best run',                   icon: '👻',  path: () => '/ghost' },
  { key: 'code',     label: 'code snippets',   desc: 'type real code - brackets, indents and all',       icon: '{ }', path: () => '/type/code' },
  { key: 'quotes',   label: 'quotes',           desc: 'type famous quotes from literature and history',   icon: '"',   path: () => '/type/quotes' },
  { key: 'daily',    label: 'daily challenge', desc: 'same text for everyone today - resets at midnight', icon: '★',  path: () => '/type/daily' },
]

const TIER_TOOLTIPS = {
  rookie:    '< 40 WPM · short common sentences',
  standard:  '40-70 WPM · everyday prose',
  advanced:  '70-100 WPM · complex punctuation',
  elite:     '100+ WPM · technical vocabulary',
  training:  '< 30 WPM · short words, slow asteroids',
  pilot:     '30-60 WPM · all words, normal speed',
  commander: '60-90 WPM · faster asteroids',
  admiral:   '90+ WPM · long words, very fast',
}

const LANGS = [
  { key: 'en', label: 'EN' },
  { key: 'es', label: 'ES' },
  { key: 'fr', label: 'FR' },
  { key: 'de', label: 'DE' },
  { key: 'hi', label: 'HI' },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function DifficultyPills({ mode, tiers }) {
  const [active, setActive] = useState(() => getDifficulty(mode))
  const [saved, setSaved] = useState(false)

  function pick(e, tier) {
    e.stopPropagation()
    setActive(tier)
    setDifficulty(mode, tier)
    setSaved(true)
    setTimeout(() => setSaved(false), 900)
  }

  return (
    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap" onClick={e => e.stopPropagation()}>
      {tiers.map(tier => (
        <button
          key={tier}
          onClick={e => pick(e, tier)}
          title={TIER_TOOLTIPS[tier] || tier}
          className="text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-100"
          style={{
            borderColor: active === tier ? 'var(--color-main)' : 'var(--color-border)',
            color:       active === tier ? 'var(--color-main)' : 'var(--color-sub)',
          }}
        >
          {tier}
        </button>
      ))}
      {saved && (
        <span className="text-[10px] text-correct ml-1">saved</span>
      )}
    </div>
  )
}

function DurationPills() {
  const [active, setActive] = useState(getCountdownDur)
  const DURATIONS = [15, 30, 60, 120]

  function pick(e, dur) {
    e.stopPropagation()
    setActive(dur)
    localStorage.setItem(LS_DUR, String(dur))
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
      {DURATIONS.map(d => (
        <button
          key={d}
          onClick={e => pick(e, d)}
          className="text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-100"
          style={{
            borderColor: active === d ? 'var(--color-main)' : 'var(--color-border)',
            color:       active === d ? 'var(--color-main)' : 'var(--color-sub)',
          }}
        >
          {d}s
        </button>
      ))}
    </div>
  )
}

function WordCountPills() {
  const [active, setActive] = useState(getWordCount)
  const COUNTS = [10, 25, 50, 100]

  function pick(e, n) {
    e.stopPropagation()
    setActive(n)
    localStorage.setItem(LS_WCNT, String(n))
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
      {COUNTS.map(n => (
        <button
          key={n}
          onClick={e => pick(e, n)}
          className="text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-100"
          style={{
            borderColor: active === n ? 'var(--color-main)' : 'var(--color-border)',
            color:       active === n ? 'var(--color-main)' : 'var(--color-sub)',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function ModeTile({ mode, index, showDifficulty, tiers, children, onClick, badge }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.055 }}
      onClick={onClick}
      className="group flex items-start gap-5 p-5 bg-surface border border-border rounded-xl text-left w-full hover:border-main transition-colors duration-150 h-full"
    >
      <span className="text-xl w-7 text-center opacity-75 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0">
        {mode.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-text font-semibold text-sm group-hover:text-main transition-colors">
            {mode.label}
          </div>
          {badge}
        </div>
        <div className="text-sub text-xs mt-0.5 leading-snug">{mode.desc}</div>
        {showDifficulty && tiers && (
          <DifficultyPills mode={mode.key} tiers={tiers} />
        )}
        {children}
      </div>
      <span className="text-border group-hover:text-sub transition-colors text-base shrink-0 mt-0.5">→</span>
    </motion.button>
  )
}

function SectionLabel({ children, delay = 0 }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
      className="text-sub text-xs tracking-widest uppercase mb-3 pl-2.5"
      style={{ borderLeft: '2px solid var(--color-main)' }}
    >
      {children}
    </motion.p>
  )
}

function TogglePill({ label, storageKey }) {
  const [active, setActive] = useState(() => localStorage.getItem(storageKey) === 'true')

  function toggle(e) {
    e.stopPropagation()
    const next = !active
    setActive(next)
    localStorage.setItem(storageKey, String(next))
  }

  return (
    <button
      onClick={toggle}
      className="text-[11px] px-3 py-1 rounded-full border transition-colors duration-100"
      style={{
        borderColor: active ? 'var(--color-main)' : 'var(--color-border)',
        color:       active ? 'var(--color-main)' : 'var(--color-sub)',
        background:  active ? 'color-mix(in srgb, var(--color-main) 10%, transparent)' : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function LangPills() {
  const [active, setActive] = useState(() => localStorage.getItem(LS_LANG) || 'en')

  function pick(e, lang) {
    e.stopPropagation()
    if (lang === active) return
    setActive(lang)
    localStorage.setItem(LS_LANG, lang)
    window.dispatchEvent(new Event('typingtest-lang-changed'))
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sub text-[11px] mr-1">lang</span>
      {LANGS.map(l => (
        <button
          key={l.key}
          onClick={e => pick(e, l.key)}
          className="text-[11px] px-2.5 py-1 rounded-full border transition-colors duration-100"
          style={{
            borderColor: active === l.key ? 'var(--color-main)' : 'var(--color-border)',
            color:       active === l.key ? 'var(--color-main)' : 'var(--color-sub)',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

function getSessionStats(allScores) {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const today = allScores.filter(s => s.timestamp >= startOfDay.getTime())
  if (today.length > 0) {
    const avg = Math.round(today.reduce((sum, s) => sum + s.wpm, 0) / today.length)
    return `today: ${today.length} game${today.length > 1 ? 's' : ''} · avg ${avg} wpm`
  }
  if (allScores.length > 0) {
    const last = allScores[allScores.length - 1]
    return `last session: ${last.wpm} wpm`
  }
  return null
}

// ── Home page ─────────────────────────────────────────────────────────────

export function HomePage() {
  const { sentences } = useContext(DataContext)
  const navigate = useNavigate()
  const [selectedSentence, setSelectedSentence] = useState('')
  const [customText, setCustomText] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const allScores = getPersonalScores()
  const best = allScores.length ? Math.max(...allScores.map(s => s.wpm)) : null
  const rank = getRank(best)
  const sessionStats = getSessionStats(allScores)
  const streak = getDailyStreak()
  const doneToday = hasDoneToday()

  const stdSentences = (sentences?.standard || []).map(s =>
    s && typeof s === 'object' ? (s.roman || '') : (s || '')
  )

  function getTypingPath(modeKey) {
    if (modeKey === 'countdown') {
      const dur = getCountdownDur()
      const diff = getDifficulty('countdown')
      return `/type/countdown?duration=${dur}&difficulty=${diff}`
    }
    if (modeKey === 'words') {
      const n = getWordCount()
      const diff = getDifficulty('words')
      return `/type/words?n=${n}&difficulty=${diff}`
    }
    if (modeKey === 'bubble') return '/bubble'
    return `/type/${modeKey}`
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-8 lg:px-6 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

            {/* Rank card */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="p-5 bg-surface border border-border rounded-xl"
            >
              {best ? (
                <>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold tabular-nums leading-none" style={{ color: rank.color }}>
                        {best}
                      </span>
                      <span className="text-sub text-sm">wpm</span>
                    </div>
                    <div className="text-xs mt-1.5 tracking-widest uppercase font-semibold" style={{ color: rank.color }}>
                      {rank.label}
                    </div>
                  </div>
                  <div className="border-t border-border my-3" />
                  <div className="flex flex-col gap-1.5">
                    {sessionStats && (
                      <div className="text-sub text-xs">{sessionStats}</div>
                    )}
                    {streak > 0 && (
                      <div className="text-sub text-xs flex items-center gap-1">
                        <span>🔥</span>
                        <span>{streak} day streak</span>
                      </div>
                    )}
                    {doneToday && (
                      <div className="text-[10px] font-semibold" style={{ color: 'var(--color-correct)' }}>
                        daily done ✓
                      </div>
                    )}
                    {!doneToday && streak > 0 && (
                      <div className="text-[10px]" style={{ color: 'var(--color-main)' }}>
                        keep your streak — do today's daily →
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 py-2">
                  <div className="text-sub text-sm">complete a test to earn your rank</div>
                  <div className="text-sub text-[10px] opacity-60">your best wpm and badge will appear here</div>
                </div>
              )}
            </motion.div>

            {/* Text options card */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.08 }}
              className="p-5 bg-surface border border-border rounded-xl flex flex-col gap-4"
            >
              <div>
                <SectionLabel>text options</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  <TogglePill label="numbers"     storageKey={LS_NUMS} />
                  <TogglePill label="punctuation" storageKey={LS_PUNC} />
                </div>
              </div>

              <LangPills />

              {stdSentences.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-sub text-[10px] mb-2">pick a specific text</p>
                    <div className="flex flex-col gap-2">
                      <select
                        value={selectedSentence}
                        onChange={e => setSelectedSentence(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-xs focus:outline-none focus:border-main transition-colors"
                      >
                        <option value="">- random -</option>
                        {stdSentences.map((s, i) => (
                          <option key={i} value={s}>
                            {s.length > 50 ? s.slice(0, 50) + '...' : s}
                          </option>
                        ))}
                      </select>
                      {selectedSentence && (
                        <button
                          onClick={() => navigate(`/type/stopwatch?text=${encodeURIComponent(selectedSentence)}`)}
                          className="w-full px-4 py-2 bg-main text-bg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          start
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <button
                  onClick={() => setShowCustom(v => !v)}
                  className="text-xs text-sub hover:text-text transition-colors"
                >
                  {showCustom ? '- cancel' : '+ custom text'}
                </button>
                {showCustom && (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="paste any text here to type it..."
                      rows={3}
                      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-xs font-mono focus:outline-none focus:border-main transition-colors resize-none"
                    />
                    {customText.trim().length > 5 && (
                      <button
                        onClick={() => navigate(`/type/stopwatch?text=${encodeURIComponent(customText.trim())}`)}
                        className="self-start px-4 py-2 bg-main text-bg rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        start typing
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

          </aside>

          {/* ── RIGHT MAIN ── */}
          <main className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Typing modes */}
            <section>
              <SectionLabel delay={0.05}>typing modes</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TYPING_MODES.map((mode, i) => (
                  <ModeTile
                    key={mode.key}
                    mode={mode}
                    index={i}
                    showDifficulty
                    tiers={mode.key === 'bubble' ? BUBBLE_TIERS : TYPING_TIERS}
                    onClick={() => navigate(getTypingPath(mode.key))}
                  >
                    {mode.showDuration && <DurationPills />}
                    {mode.showWordCount && <WordCountPills />}
                  </ModeTile>
                ))}
              </div>
            </section>

            {/* Challenge modes */}
            <section>
              <SectionLabel delay={0.18}>challenge modes</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHALLENGE_MODES.map((mode, i) => (
                  <div key={mode.key} className={mode.key === 'daily' ? 'sm:col-span-2' : ''}>
                    <ModeTile
                      mode={mode}
                      index={TYPING_MODES.length + i}
                      showDifficulty={false}
                      onClick={() => navigate(mode.path())}
                      badge={mode.key === 'daily' && streak > 0
                        ? <span className="text-[10px] text-main font-semibold">🔥 {streak}</span>
                        : null
                      }
                    />
                  </div>
                ))}
              </div>
            </section>

          </main>

        </div>
      </div>
    </PageWrapper>
  )
}
