// Rounded pill toggle button used across settings-style option rows.
// `active` drives the accent border/text/background treatment.
export function PillButton({ label, active, onClick }) {
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
