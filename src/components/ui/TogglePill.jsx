import { useState } from 'react'
import { safeGet, safeSet } from '../../utils/safeStorage.js'

export function TogglePill({ label, storageKey }) {
  const [active, setActive] = useState(() => safeGet(storageKey) === 'true')

  function toggle(e) {
    e.stopPropagation()
    const next = !active
    setActive(next)
    safeSet(storageKey, String(next))
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
