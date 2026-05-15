export function TimerBar({ mode, elapsed, remaining, duration = 60, wordCount = null, wordsTyped = 0 }) {
  if (mode === 'countdown') {
    const pct = Math.max(0, (remaining / duration) * 100)
    const urgent = remaining <= Math.min(10, duration * 0.15)
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between text-sm text-sub mb-1">
          <span>{Math.ceil(remaining)}s</span>
          <span>{duration}s</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${urgent ? 'bg-wrong' : 'bg-main'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  if (mode === 'words' && wordCount) {
    const pct = Math.min((wordsTyped / wordCount) * 100, 100)
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between text-sm text-sub mb-1">
          <span>{wordsTyped} / {wordCount} words</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-main transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  // Stopwatch / daily / quotes / etc.
  const secs = Math.floor(elapsed)
  const ms = Math.floor((elapsed % 1) * 10)
  return (
    <div className="mb-6 text-sm text-sub tabular-nums">
      {secs}.{ms}s
    </div>
  )
}
