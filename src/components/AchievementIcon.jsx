const ICON_MAP = {
  keyboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="7"  cy="10" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="10" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="10" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="7"  cy="14" r="1.2" fill="currentColor" stroke="none"/>
      <rect x="10" y="13" width="4" height="2" rx="1" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  stack: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="15" width="18" height="4" rx="1"/>
      <rect x="5" y="10" width="14" height="5" rx="1"/>
      <rect x="7" y="5"  width="10" height="5" rx="1"/>
    </svg>
  ),
  gauge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 17A7 7 0 0 1 19 17"/>
      <path d="M12 17L8.5 11" strokeWidth="2"/>
      <circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M6.3 11l.7-.7M17.7 11l-.7-.7M12 5V6"/>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 11-12h-8l1-8z"/>
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 8L2 12l5 4"/>
      <path d="M17 8l5 4-5 4"/>
      <path d="M14 5l-4 14"/>
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="6" width="7" height="8" rx="1"/>
      <rect x="14" y="6" width="7" height="8" rx="1"/>
      <path d="M6 14v3"/>
      <path d="M17 14v3"/>
    </svg>
  ),
  sword: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4L9 15M5 19l4-4"/>
      <path d="M4 18l2 2"/>
      <path d="M14 9l2.5-2.5M11 12l2.5-2.5"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  lines: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 10h12M4 14h14M4 18h9"/>
    </svg>
  ),
  medal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="15" r="6"/>
      <path d="M8 4l4 7 4-7"/>
      <path d="M8 4h8"/>
      <path d="M9.5 13.5l2.5 1.5 2.5-1.5"/>
    </svg>
  ),
  bolt2: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 2L2 13h7l-2 9 15-14h-9l1-6z"/>
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c-4 7-4 11-4 14a4 4 0 0 0 8 0c0-3 0-7-4-14zm0 15a1.5 1.5 0 0 1-1.5-1.5c0-1 .5-2 1.5-3.5 1 1.5 1.5 2.5 1.5 3.5A1.5 1.5 0 0 1 12 17z"/>
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12c1-4 2-4 3 0s2 4 3 0 2-4 3 0 2 4 3 0 2-4 3 0s2 4 3 0"/>
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 7l2.5 5-5.5 2 3-7z" fill="currentColor" stroke="none"/>
      <path d="M12 17l-2.5-5 5.5-2-3 7z" fill="currentColor" stroke="none" opacity="0.4"/>
    </svg>
  ),
  stars5: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l1.8 5.6H19l-4.6 3.3 1.8 5.5L12 14l-4.2 3.4 1.8-5.5L5 8.6h5.2L12 3z"/>
      <path d="M4 14l.8 2.4 1.6-1.2L5 18.5l2.6-1.9-.8-2.6L4 14z" opacity="0.5"/>
      <path d="M20 14l-.8 2.4-1.6-1.2L19 18.5l-2.6-1.9.8-2.6L20 14z" opacity="0.5"/>
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12v6a6 6 0 0 1-12 0V2z"/>
      <path d="M3 2h3v4a2 2 0 0 1-4 0V2zM21 2h-3v4a2 2 0 0 0 4 0V2z"/>
      <path d="M12 13v5M9 22h6M9 18h6"/>
    </svg>
  ),
  podium: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9"  y="8"  width="6"  height="13" rx="1"/>
      <rect x="3"  y="12" width="6"  height="9"  rx="1"/>
      <rect x="15" y="10" width="6"  height="11" rx="1"/>
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-2.5 5-4 8-4 12 0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2 0-4-1.5-7-4-12z"/>
      <path d="M9 16l-3 5 4.5-2M15 16l3 5-4.5-2"/>
      <circle cx="12" cy="10" r="2.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  flame2: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8 9 7 13 7 17a5 5 0 0 0 10 0c0-4-1-8-5-15zm0 17.5a2.5 2.5 0 0 1-2.5-2.5c0-1.5 1-3 2.5-5 1.5 2 2.5 3.5 2.5 5A2.5 2.5 0 0 1 12 19.5z"/>
    </svg>
  ),
  wave2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12c1-5 2-5 3 0s2 5 3 0 2-5 3 0 2 5 3 0 2-5 3 0s2 5 3 0"/>
    </svg>
  ),
  anchor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="2"/>
      <path d="M12 8v13"/>
      <path d="M5 19c1-3.5 3.5-5 7-5s6 1.5 7 5"/>
      <path d="M3 11h4M21 11h-4"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M12 14c-1.5 2-1 4 1 4s2.5-2 1-4c-.5-1-1.5-1-2 0z" fill="currentColor" stroke="none"/>
    </svg>
  ),
  comet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="6" r="3"/>
      <path d="M15.5 8.5L4 20"/>
      <path d="M12 10l-5 2M14 12l-5 2"/>
    </svg>
  ),
  diamondcheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10L12 2l10 8-10 12L2 10z"/>
      <path d="M9 11l2.5 2.5L15 9" strokeWidth="2"/>
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18"/>
      <path d="M3 20l2.5-12 4.5 5 2-9 2 9 4.5-5L21 20H3z"/>
      <circle cx="6"  cy="8"  r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="4"  r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="8"  r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
  ),
}

export function AchievementIcon({ icon, size = 24, color = 'currentColor' }) {
  const svg = ICON_MAP[icon] ?? ICON_MAP.lock
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, color, flexShrink: 0 }}>
      {svg}
    </span>
  )
}

export { ICON_MAP }
