import { Caret } from './Caret.jsx'

const statusClass = {
  pending: 'text-sub',
  correct: 'text-text',
  wrong:   'text-wrong',
  extra:   'text-wrong opacity-70',
}

function GhostCaret() {
  return (
    <span
      className="inline-block w-[2px] h-[1.1em] bg-[#00ccff] opacity-40 align-middle mx-[1px] translate-y-[1px]"
      aria-hidden="true"
    />
  )
}

export function CharDisplay({ chars, caretIndex, ghostCaretIndex = null, isCode = false, caretStyle = 'line' }) {
  const Tag = isCode ? 'pre' : 'p'
  return (
    <Tag
      className={`font-mono select-none leading-relaxed ${
        isCode
          ? 'text-sm whitespace-pre overflow-x-auto'
          : 'text-xl md:text-2xl tracking-wide'
      }`}
      style={{ wordBreak: isCode ? 'normal' : 'break-word', overflowWrap: isCode ? 'normal' : 'break-word' }}
      aria-hidden="true"
    >
      {chars.map((c, i) => (
        <span
          key={i}
          className={`relative ${statusClass[c.status] || statusClass.pending}`}
          style={{ transition: 'color 60ms linear' }}
        >
          {i === ghostCaretIndex && <GhostCaret />}
          {i === caretIndex && <Caret style={caretStyle} />}
          {c.char}
        </span>
      ))}
      {/* Trailing caret — shown when all text is typed */}
      {caretIndex >= chars.length && (
        caretStyle === 'line'
          ? <Caret style="line" />
          : <span className="relative inline-block align-middle" style={{ width: '0.6ch', height: '1.1em' }}>
              <Caret style={caretStyle} />
            </span>
      )}
    </Tag>
  )
}
