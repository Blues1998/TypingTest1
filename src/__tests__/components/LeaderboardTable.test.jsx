import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable.jsx'

function entry(overrides = {}) {
  return {
    username: 'player',
    wpm: 70,
    accuracy: 96,
    created_at: '2026-01-02T00:00:00Z',
    ...overrides,
  }
}

describe('LeaderboardTable', () => {
  it('shows a loading state', () => {
    const { getByText } = render(<LeaderboardTable data={[]} loading />)
    expect(getByText('loading...')).toBeTruthy()
  })

  it('shows an error state', () => {
    const { getByText } = render(<LeaderboardTable data={[]} fetchError />)
    expect(getByText(/couldn't load scores/)).toBeTruthy()
  })

  it('shows an empty state when there are no scores', () => {
    const { getByText } = render(<LeaderboardTable data={[]} />)
    expect(getByText(/no scores yet/)).toBeTruthy()
  })

  it('renders a row per score with 1-based ranks', () => {
    const { container, getByText } = render(
      <LeaderboardTable data={[entry({ username: 'a' }), entry({ username: 'b' })]} />
    )
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(getByText('1')).toBeTruthy()
    expect(getByText('2')).toBeTruthy()
  })

  it('highlights the current user with a "(you)" marker', () => {
    const { getByText } = render(
      <LeaderboardTable data={[entry({ username: 'ada' })]} username="ada" />
    )
    expect(getByText(/\(you\)/)).toBeTruthy()
  })

  it('renders an em dash when accuracy is missing', () => {
    const { container } = render(
      <LeaderboardTable data={[entry({ accuracy: null })]} />
    )
    expect(container.textContent).toContain('—%')
  })
})
