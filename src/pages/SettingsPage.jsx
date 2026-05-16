import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper.jsx'
import { useTheme } from '../hooks/useTheme.js'

// ── localStorage keys ─────────────────────────────────────────────────────

const KEYS = {
  CARET:  'typingtest_caret_style',
  FONT:   'typingtest_font',
  SOUND:  'typingtest_sound',
  LANG:   'typingtest_lang',
  NUMS:   'typingtest_numbers',
  PUNC:   'typingtest_punctuation',
}

// ── Helpers ───────────────────────────────────────────────────────────────

function applyFont(font) {
  document.documentElement.setAttribute('data-font', font)
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div className="text-sub text-[10px] tracking-widest uppercase mb-3 mt-8 first:mt-0">
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-border gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-text text-sm">{label}</div>
        {description && <div className="text-sub text-xs mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">{children}</div>
    </div>
  )
}

function OptionPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
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

function TogglePill({ label, storageKey }) {
  const [active, setActive] = useState(() => localStorage.getItem(storageKey) === 'true')

  function toggle() {
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

// ── Page ──────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { isDark, toggle: toggleTheme } = useTheme()

  const [caretStyle, setCaretStyleState] = useState(
    () => localStorage.getItem(KEYS.CARET) || 'line'
  )
  const [font, setFontState] = useState(
    () => localStorage.getItem(KEYS.FONT) || 'jetbrains'
  )
  const [sound, setSoundState] = useState(
    () => localStorage.getItem(KEYS.SOUND) !== 'false'
  )
  const [lang, setLangState] = useState(
    () => localStorage.getItem(KEYS.LANG) || 'en'
  )

  function setCaretStyle(v) {
    setCaretStyleState(v)
    localStorage.setItem(KEYS.CARET, v)
  }

  function setFont(v) {
    setFontState(v)
    localStorage.setItem(KEYS.FONT, v)
    applyFont(v)
  }

  function setSound(v) {
    setSoundState(v)
    localStorage.setItem(KEYS.SOUND, String(v))
  }

  function setLang(v) {
    if (v === lang) return
    setLangState(v)
    localStorage.setItem(KEYS.LANG, v)
    window.dispatchEvent(new Event('typingtest-lang-changed'))
  }

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-text text-2xl font-semibold mb-8">settings</h1>

        {/* ── Typing experience ── */}
        <SectionHeader>typing experience</SectionHeader>

        <SettingRow
          label="caret style"
          description="shape of the cursor while typing"
        >
          {[
            { value: 'line',      label: 'line' },
            { value: 'block',     label: 'block' },
            { value: 'underline', label: 'underline' },
          ].map(opt => (
            <OptionPill
              key={opt.value}
              label={opt.label}
              active={caretStyle === opt.value}
              onClick={() => setCaretStyle(opt.value)}
            />
          ))}
        </SettingRow>

        <SettingRow
          label="font"
          description="monospace font used in the typing area"
        >
          {[
            { value: 'jetbrains', label: 'JetBrains' },
            { value: 'fira',      label: 'Fira Code' },
            { value: 'system',    label: 'system' },
          ].map(opt => (
            <OptionPill
              key={opt.value}
              label={opt.label}
              active={font === opt.value}
              onClick={() => setFont(opt.value)}
            />
          ))}
        </SettingRow>

        {/* ── Text ── */}
        <SectionHeader>text</SectionHeader>

        <SettingRow
          label="language"
          description="language of the typing passages"
        >
          {['en', 'es', 'fr', 'de', 'hi'].map(l => (
            <OptionPill
              key={l}
              label={l.toUpperCase()}
              active={lang === l}
              onClick={() => setLang(l)}
            />
          ))}
        </SettingRow>

        <SettingRow
          label="modifiers"
          description="inject numbers and punctuation into passages"
        >
          <TogglePill label="numbers"     storageKey={KEYS.NUMS} />
          <TogglePill label="punctuation" storageKey={KEYS.PUNC} />
        </SettingRow>

        {/* ── Appearance ── */}
        <SectionHeader>appearance</SectionHeader>

        <SettingRow
          label="theme"
          description="color scheme for the interface"
        >
          <OptionPill label="dark"  active={isDark}  onClick={() => { if (!isDark) toggleTheme() }} />
          <OptionPill label="light" active={!isDark} onClick={() => { if (isDark)  toggleTheme() }} />
        </SettingRow>

        {/* ── Audio ── */}
        <SectionHeader>audio</SectionHeader>

        <SettingRow
          label="sound effects"
          description="click and error sounds while typing"
        >
          <OptionPill label="on"  active={sound}  onClick={() => setSound(true)} />
          <OptionPill label="off" active={!sound} onClick={() => setSound(false)} />
        </SettingRow>
      </div>
    </PageWrapper>
  )
}
