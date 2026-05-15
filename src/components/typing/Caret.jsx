import { motion } from 'framer-motion'

export function Caret() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.53, repeat: Infinity, ease: 'linear' }}
      className="inline-block w-[2px] h-[1.1em] bg-main align-middle mx-[1px] translate-y-[1px]"
      aria-hidden="true"
    />
  )
}
