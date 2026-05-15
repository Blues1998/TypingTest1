function Shield({ active }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: `2px solid ${active ? '#00ccff' : 'var(--color-border)'}`,
        background: active ? 'rgba(0,204,255,0.12)' : 'transparent',
        boxShadow: active ? '0 0 8px rgba(0,204,255,0.5)' : 'none',
        transition: 'all 0.3s ease',
        marginLeft: 6,
      }}
    >
      {!active && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="1" y1="1" x2="9" y2="9" stroke="var(--color-sub)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="1" x2="1" y2="9" stroke="var(--color-sub)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </span>
  )
}

export function BubbleHUD({ score, strikes, wave, inputRef, onInput, phase, onRestart }) {
  return (
    <div className="w-full max-w-4xl">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-5 text-sm">
          <span className="text-sub">
            score{' '}
            <span className="text-main font-semibold tabular-nums">{score}</span>
          </span>
          <span className="text-sub">
            wave{' '}
            <span className="text-text tabular-nums">{wave}</span>
          </span>
        </div>
        {/* Shields */}
        <div className="flex items-center gap-1">
          <span className="text-sub text-xs mr-1">shields</span>
          <Shield active={strikes < 1} />
          <Shield active={strikes < 2} />
          <Shield active={strikes < 3} />
        </div>
      </div>

      {/* Word input */}
      {phase === 'running' && (
        <input
          ref={inputRef}
          type="text"
          onChange={onInput}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="intercept incoming word..."
          className="w-full bg-[#0a0a18] border border-[#1a2040] rounded-lg px-4 py-3 text-text text-sm focus:outline-none focus:border-[#00ccff] transition-colors mt-1"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        />
      )}

      {/* Game over */}
      {phase === 'gameover' && (
        <div className="text-center py-10">
          <div
            className="text-3xl font-bold mb-1"
            style={{ color: 'var(--color-wrong)', textShadow: '0 0 20px rgba(255,79,79,0.5)' }}
          >
            planet lost
          </div>
          <div className="text-sub text-sm mb-2">
            you reached wave <span className="text-text">{wave}</span>
          </div>
          <div className="text-sub text-sm mb-7">
            final score:{' '}
            <span className="text-main font-semibold text-lg">{score}</span>
          </div>
          <button
            onClick={onRestart}
            className="px-7 py-2 rounded-lg font-semibold text-sm bg-main text-bg hover:bg-main/90 transition-colors"
          >
            defend again
          </button>
        </div>
      )}
    </div>
  )
}
