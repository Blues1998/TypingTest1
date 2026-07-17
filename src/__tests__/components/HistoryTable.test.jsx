import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HistoryTable } from '../../components/history/HistoryTable.jsx'

function row(overrides = {}) {
  return {
    timestamp: Date.now(),
    mode: 'stopwatch',
    difficulty: 'standard',
    wpm: 60,
    accuracy: 95,
    timeTaken: 30,
    ...overrides,
  }
}

describe('HistoryTable', () => {
  it('shows an empty-state message when there is no data', () => {
    const { getByText } = render(<HistoryTable data={[]} />)
    expect(getByText('no results yet')).toBeTruthy()
  })

  it('renders a row per entry', () => {
    const { container } = render(
      <HistoryTable data={[row({ wpm: 50 }), row({ wpm: 60 })]} />
    )
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
  })

  it('renders newest entries first (reversed order)', () => {
    const { container } = render(
      <HistoryTable data={[row({ wpm: 40 }), row({ wpm: 80 })]} />
    )
    const rows = container.querySelectorAll('tbody tr')
    // The last data entry (80) should be rendered first.
    expect(rows[0].textContent).toContain('80')
  })

  it('marks the best (max WPM) row with a star', () => {
    const { container } = render(
      <HistoryTable data={[row({ wpm: 40 }), row({ wpm: 90 })]} />
    )
    expect(container.textContent).toContain('★')
    expect(container.textContent).toContain('90')
  })

  it('renders an em dash when difficulty is null', () => {
    const { container } = render(<HistoryTable data={[row({ difficulty: null })]} />)
    expect(container.textContent).toContain('—')
  })

  it('formats accuracy with a percent sign', () => {
    const { container } = render(<HistoryTable data={[row({ accuracy: 88 })]} />)
    expect(container.textContent).toContain('88%')
  })
})
