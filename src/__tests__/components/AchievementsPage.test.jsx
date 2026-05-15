import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AchievementsPage } from '../../pages/AchievementsPage.jsx'
import * as achievementsModule from '../../utils/achievements.js'

// AchievementsPage uses framer-motion — stub it to avoid animation timing issues
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
  }
})

// PageWrapper uses motion — stub it too
vi.mock('../../components/layout/PageWrapper.jsx', () => ({
  PageWrapper: ({ children }) => <div>{children}</div>,
}))

describe('AchievementsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => render(<AchievementsPage />)).not.toThrow()
  })

  it('shows "achievements" heading', () => {
    const { getByText } = render(<AchievementsPage />)
    expect(getByText('achievements')).toBeTruthy()
  })

  it('shows 0% progress when nothing is unlocked', () => {
    const { getByText } = render(<AchievementsPage />)
    expect(getByText('0%')).toBeTruthy()
  })

  it('shows "0 / N unlocked" with correct total', () => {
    const { getByText } = render(<AchievementsPage />)
    // Non-diamond achievements: 10 bronze + 8 silver + 7 gold = 25
    expect(getByText(/0 \/ 25 unlocked/)).toBeTruthy()
  })

  it('shows "???" labels for locked achievements', () => {
    const { getAllByText } = render(<AchievementsPage />)
    const locked = getAllByText('???')
    expect(locked.length).toBeGreaterThan(0)
  })

  it('shows real achievement labels when unlocked', () => {
    // Pre-seed some unlocked achievements in localStorage
    localStorage.setItem(
      'typingtest_achievements',
      JSON.stringify(['first_test', 'wpm_30'])
    )
    const { getByText } = render(<AchievementsPage />)
    expect(getByText('First Steps')).toBeTruthy()
    expect(getByText('Picking Up Speed')).toBeTruthy()
  })

  it('renders tier section headers', () => {
    // TIER_META uses sentence-case labels; CSS `uppercase` transforms visually but DOM text stays as-is
    const { getByText } = render(<AchievementsPage />)
    expect(getByText('Bronze')).toBeTruthy()
    expect(getByText('Silver')).toBeTruthy()
    expect(getByText('Gold')).toBeTruthy()
    expect(getByText('Diamond')).toBeTruthy()
  })

  it('shows tier unlock counts (e.g. "0 / 10" for bronze)', () => {
    const { getByText } = render(<AchievementsPage />)
    expect(getByText('0 / 10')).toBeTruthy() // bronze: 10 total
    expect(getByText('0 / 8')).toBeTruthy()  // silver: 8 total
    expect(getByText('0 / 7')).toBeTruthy()  // gold: 7 total
    expect(getByText('0 / 1')).toBeTruthy()  // diamond: 1 total
  })

  it('updates progress percentage when achievements are unlocked', () => {
    // Unlock 5 of 25 non-diamond achievements
    const ids = achievementsModule.ACHIEVEMENTS
      .filter(a => a.tier !== 'diamond')
      .slice(0, 5)
      .map(a => a.id)
    localStorage.setItem('typingtest_achievements', JSON.stringify(ids))

    const { getByText } = render(<AchievementsPage />)
    expect(getByText('20%')).toBeTruthy()
    expect(getByText('5 / 25 unlocked')).toBeTruthy()
  })
})
