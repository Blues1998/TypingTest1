import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TimerBar } from '../../components/typing/TimerBar.jsx'

describe('TimerBar', () => {
  // ── countdown mode ─────────────────────────────────────────────────────────

  describe('countdown mode', () => {
    it('shows remaining and total seconds', () => {
      const { getByText } = render(
        <TimerBar mode="countdown" elapsed={30} remaining={30} duration={60} />
      )
      expect(getByText('30s')).toBeTruthy()
      expect(getByText('60s')).toBeTruthy()
    })

    it('shows ceil of remaining for display', () => {
      const { getByText } = render(
        <TimerBar mode="countdown" elapsed={0} remaining={29.7} duration={60} />
      )
      expect(getByText('30s')).toBeTruthy()
    })

    it('uses bg-wrong class when under 10s remaining (urgent)', () => {
      const { container } = render(
        <TimerBar mode="countdown" elapsed={55} remaining={5} duration={60} />
      )
      expect(container.querySelector('.bg-wrong')).not.toBeNull()
    })

    it('uses bg-main class when > 10s remaining', () => {
      const { container } = render(
        <TimerBar mode="countdown" elapsed={10} remaining={50} duration={60} />
      )
      expect(container.querySelector('.bg-main')).not.toBeNull()
      expect(container.querySelector('.bg-wrong')).toBeNull()
    })

    it('renders a progress bar (div with width style)', () => {
      const { container } = render(
        <TimerBar mode="countdown" elapsed={0} remaining={60} duration={60} />
      )
      const bar = container.querySelector('[style*="width"]')
      expect(bar).not.toBeNull()
      expect(bar.style.width).toBe('100%')
    })

    it('shows 0% width when time is up', () => {
      const { container } = render(
        <TimerBar mode="countdown" elapsed={60} remaining={0} duration={60} />
      )
      const bar = container.querySelector('[style*="width"]')
      expect(bar.style.width).toBe('0%')
    })
  })

  // ── words mode ─────────────────────────────────────────────────────────────

  describe('words mode', () => {
    it('shows words typed and total word count', () => {
      const { getByText } = render(
        <TimerBar mode="words" elapsed={10} remaining={0} wordCount={25} wordsTyped={12} />
      )
      expect(getByText('12 / 25 words')).toBeTruthy()
    })

    it('shows 0 words initially', () => {
      const { getByText } = render(
        <TimerBar mode="words" elapsed={0} remaining={0} wordCount={25} wordsTyped={0} />
      )
      expect(getByText('0 / 25 words')).toBeTruthy()
    })

    it('renders a progress bar at correct percentage', () => {
      const { container } = render(
        <TimerBar mode="words" elapsed={0} remaining={0} wordCount={100} wordsTyped={50} />
      )
      const bar = container.querySelector('[style*="width"]')
      expect(bar.style.width).toBe('50%')
    })

    it('caps progress bar at 100% when all words typed', () => {
      const { container } = render(
        <TimerBar mode="words" elapsed={0} remaining={0} wordCount={25} wordsTyped={25} />
      )
      const bar = container.querySelector('[style*="width"]')
      expect(bar.style.width).toBe('100%')
    })
  })

  // ── stopwatch / default mode ───────────────────────────────────────────────

  describe('stopwatch mode', () => {
    it('shows elapsed time in seconds.tenths format', () => {
      // Use textContent to handle JSX multi-node rendering of "{secs}.{ms}s"
      const { container } = render(
        <TimerBar mode="stopwatch" elapsed={12.5} remaining={0} />
      )
      expect(container.firstChild.textContent).toBe('12.5s')
    })

    it('shows 0.0s initially', () => {
      const { container } = render(
        <TimerBar mode="stopwatch" elapsed={0} remaining={0} />
      )
      expect(container.firstChild.textContent).toBe('0.0s')
    })

    it('does not render a progress bar', () => {
      const { container } = render(
        <TimerBar mode="stopwatch" elapsed={5} remaining={0} />
      )
      expect(container.querySelector('[style*="width"]')).toBeNull()
    })
  })

  // ── daily mode falls through to stopwatch display ─────────────────────────

  describe('daily mode', () => {
    it('shows elapsed time like stopwatch', () => {
      // Use an exact floating-point value (7.5) to avoid floor() ambiguity
      const { container } = render(
        <TimerBar mode="daily" elapsed={7.5} remaining={0} />
      )
      // JSX renders "{secs}.{ms}s" as multiple text nodes — use textContent
      expect(container.firstChild.textContent).toBe('7.5s')
    })
  })
})
