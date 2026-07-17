import { useState } from 'react'
import { PillButton } from './PillButton.jsx'

export function TogglePill({ label, storageKey }) {
  const [active, setActive] = useState(() => localStorage.getItem(storageKey) === 'true')

  function toggle(e) {
    e.stopPropagation()
    const next = !active
    setActive(next)
    localStorage.setItem(storageKey, String(next))
  }

  return <PillButton label={label} active={active} onClick={toggle} />
}
