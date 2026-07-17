import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from '../../components/layout/NavBar.jsx'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NavBar />
    </MemoryRouter>
  )
}

describe('NavBar', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => document.documentElement.removeAttribute('data-theme'))

  it('renders all navigation links', () => {
    const { getByText } = renderAt('/')
    for (const label of ['home', 'leaderboard', 'history', 'achievements', 'settings']) {
      expect(getByText(label)).toBeTruthy()
    }
  })

  it('marks the matching route as the current page', () => {
    const { getByText } = renderAt('/history')
    expect(getByText('history').getAttribute('aria-current')).toBe('page')
    expect(getByText('home').getAttribute('aria-current')).toBeNull()
  })

  it('treats "/" as active only on the exact root path', () => {
    const { getByText } = renderAt('/leaderboard')
    expect(getByText('home').getAttribute('aria-current')).toBeNull()
    expect(getByText('leaderboard').getAttribute('aria-current')).toBe('page')
  })

  it('toggles the theme when the theme button is clicked', () => {
    const { getByTitle } = renderAt('/')
    const themeBtn = getByTitle('switch to light')
    fireEvent.click(themeBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('toggles sound when the sound button is clicked', () => {
    const { getByTitle } = renderAt('/')
    fireEvent.click(getByTitle('sound on'))
    expect(localStorage.getItem('typingtest_sound')).toBe('false')
  })
})
