import { Link, useLocation } from 'react-router-dom'
import { useSound } from '../../hooks/useSound.js'
import { useTheme } from '../../hooks/useTheme.js'

const links = [
  { to: '/',              label: 'home' },
  { to: '/leaderboard',   label: 'leaderboard' },
  { to: '/history',       label: 'history' },
  { to: '/achievements',  label: 'achievements' },
]

export function NavBar() {
  const { pathname } = useLocation()
  const { enabled, toggle: toggleSound } = useSound()
  const { isDark, toggle: toggleTheme } = useTheme()

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-border">
      <Link to="/" className="text-main font-bold text-lg tracking-wider select-none">
        typetest
      </Link>
      <div className="flex items-center gap-6 text-sm">
        {links.map(({ to, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className="relative pb-0.5 transition-colors duration-150"
              style={{ color: active ? 'var(--color-text)' : 'var(--color-sub)' }}
            >
              {label}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px rounded-full"
                  style={{ background: 'var(--color-main)' }}
                />
              )}
            </Link>
          )
        })}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'switch to light' : 'switch to dark'}
          className="transition-colors duration-150 text-sub hover:text-text"
          style={{ fontSize: 15, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {isDark ? '☀' : '☾'}
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          title={enabled ? 'sound on' : 'sound off'}
          className="transition-colors duration-150 text-sub hover:text-text"
          style={{ fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: enabled ? 1 : 0.4 }}
        >
          {enabled ? '♪' : '♩'}
        </button>
      </div>
    </nav>
  )
}
