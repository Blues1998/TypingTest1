import { motion } from 'framer-motion'

const BLINK = {
  animate:    { opacity: [1, 0, 1] },
  transition: { duration: 0.53, repeat: Infinity, ease: 'linear' },
}

export function Caret({ style = 'line' }) {
  if (style === 'block') {
    return (
      <motion.span
        animate={{ opacity: [0.65, 0.1, 0.65] }}
        transition={BLINK.transition}
        className="absolute inset-0 rounded-[1px] pointer-events-none"
        style={{ background: 'var(--color-main)' }}
        aria-hidden="true"
      />
    )
  }

  if (style === 'underline') {
    return (
      <motion.span
        {...BLINK}
        className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full pointer-events-none"
        style={{ background: 'var(--color-main)' }}
        aria-hidden="true"
      />
    )
  }

  // line (default)
  return (
    <motion.span
      {...BLINK}
      className="inline-block w-[2px] h-[1.1em] bg-main align-middle mx-[1px] translate-y-[1px]"
      aria-hidden="true"
    />
  )
}
