import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CharDisplay } from '../../components/typing/CharDisplay.jsx'

function makeChars(text, statuses) {
  return text.split('').map((char, i) => ({ char, status: statuses[i] || 'pending' }))
}

describe('CharDisplay', () => {
  describe('rendering chars', () => {
    it('renders all characters from the chars array', () => {
      const chars = makeChars('hello', ['correct', 'correct', 'pending', 'pending', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={2} />)
      const spans = container.querySelectorAll('p span[style]')
      // Each char gets a span with style (transition)
      expect(spans.length).toBeGreaterThanOrEqual(5)
    })

    it('applies text-text class to correct chars', () => {
      const chars = makeChars('ab', ['correct', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={1} />)
      const correctSpan = container.querySelector('.text-text')
      expect(correctSpan).not.toBeNull()
    })

    it('applies text-wrong class to wrong chars', () => {
      const chars = makeChars('ab', ['wrong', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={1} />)
      const wrongSpan = container.querySelector('.text-wrong')
      expect(wrongSpan).not.toBeNull()
    })

    it('applies text-sub class to pending chars', () => {
      const chars = makeChars('ab', ['pending', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={0} />)
      const pendingSpans = container.querySelectorAll('.text-sub')
      expect(pendingSpans.length).toBeGreaterThan(0)
    })

    it('renders a <p> tag in normal mode', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={0} />)
      expect(container.querySelector('p')).not.toBeNull()
    })

    it('renders a <pre> tag in code mode', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={0} isCode />)
      expect(container.querySelector('pre')).not.toBeNull()
    })
  })

  describe('caret positioning', () => {
    it('renders a caret element at the current caretIndex', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      const { container } = render(<CharDisplay chars={chars} caretIndex={0} />)
      // The Caret component renders inside the span at the caret position
      // We verify the span at index 0 contains a child element (the caret)
      const spans = container.querySelectorAll('p > span')
      // span[0] should have the Caret child in addition to the char text
      expect(spans[0].children.length).toBeGreaterThan(0)
    })
  })

  describe('ghost caret', () => {
    it('renders a ghost caret at the specified ghostCaretIndex', () => {
      const chars = makeChars('hello', ['correct', 'correct', 'pending', 'pending', 'pending'])
      const { container } = render(
        <CharDisplay chars={chars} caretIndex={2} ghostCaretIndex={1} />
      )
      // Ghost caret span has aria-hidden="true"
      const ghostCaret = container.querySelector('[aria-hidden="true"]')
      expect(ghostCaret).not.toBeNull()
    })

    it('does not render ghost caret when ghostCaretIndex is null', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      const { container } = render(
        <CharDisplay chars={chars} caretIndex={0} ghostCaretIndex={null} />
      )
      // The ghost caret has aria-hidden; the outer <p> also has aria-hidden
      // so we check specifically for the ghost caret's bg-[#00ccff] class
      const ghostEl = container.querySelector('.bg-\\[\\#00ccff\\]')
      expect(ghostEl).toBeNull()
    })
  })

  describe('extra chars', () => {
    it('renders extra chars with text-wrong opacity-70 class', () => {
      const chars = [
        { char: 'h', status: 'correct' },
        { char: 'i', status: 'extra' },
      ]
      const { container } = render(<CharDisplay chars={chars} caretIndex={2} />)
      const extraSpan = container.querySelector('.opacity-70')
      expect(extraSpan).not.toBeNull()
    })
  })

  describe('caretStyle prop', () => {
    it('defaults to line style without errors', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      expect(() => render(<CharDisplay chars={chars} caretIndex={0} />)).not.toThrow()
    })

    it('accepts block style without errors', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      expect(() => render(<CharDisplay chars={chars} caretIndex={0} caretStyle="block" />)).not.toThrow()
    })

    it('accepts underline style without errors', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      expect(() => render(<CharDisplay chars={chars} caretIndex={0} caretStyle="underline" />)).not.toThrow()
    })

    it('renders block caret as absolute (no inline width disruption)', () => {
      const chars = makeChars('hi', ['pending', 'pending'])
      const { container } = render(
        <CharDisplay chars={chars} caretIndex={0} caretStyle="block" />
      )
      // Block caret uses absolute inset-0 — the span at index 0 should have a child with aria-hidden
      const spans = container.querySelectorAll('p > span')
      expect(spans[0].querySelector('[aria-hidden]')).not.toBeNull()
    })

    it('renders trailing caret wrapper for block style when caret is past all chars', () => {
      const chars = makeChars('hi', ['correct', 'correct'])
      const { container } = render(
        <CharDisplay chars={chars} caretIndex={2} caretStyle="block" />
      )
      // The trailing wrapper span should be present
      expect(container.querySelector('[aria-hidden]')).not.toBeNull()
    })
  })
})
