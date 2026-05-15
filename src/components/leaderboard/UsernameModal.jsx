import { useState } from 'react'
import { motion } from 'framer-motion'

export function UsernameModal({ onConfirm, onClose }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const name = value.trim()
    if (name.length < 1) return
    onConfirm(name)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-surface border border-border rounded-2xl p-8 w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-text text-lg font-semibold mb-2">enter a display name</h2>
        <p className="text-sub text-sm mb-5">shown on the public leaderboard</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            autoFocus
            maxLength={20}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="your name"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text text-sm focus:outline-none focus:border-main transition-colors mb-4"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-sub hover:text-text transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-5 py-2 text-sm bg-main text-bg rounded-lg font-semibold disabled:opacity-40 hover:bg-main transition-colors"
            >
              save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
