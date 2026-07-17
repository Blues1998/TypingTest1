import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TogglePill } from '../../components/ui/TogglePill.jsx'

describe('TogglePill', () => {
  beforeEach(() => localStorage.clear())

  it('renders its label', () => {
    const { getByText } = render(<TogglePill label="numbers" storageKey="opt_numbers" />)
    expect(getByText('numbers')).toBeTruthy()
  })

  it('starts inactive when storage is empty', () => {
    const { getByRole } = render(<TogglePill label="numbers" storageKey="opt_numbers" />)
    expect(getByRole('button').style.color).toBe('var(--color-sub)')
  })

  it('starts active when storage holds "true"', () => {
    localStorage.setItem('opt_numbers', 'true')
    const { getByRole } = render(<TogglePill label="numbers" storageKey="opt_numbers" />)
    expect(getByRole('button').style.color).toBe('var(--color-main)')
  })

  it('toggles state and persists to storage on click', () => {
    const { getByRole } = render(<TogglePill label="numbers" storageKey="opt_numbers" />)
    const btn = getByRole('button')
    fireEvent.click(btn)
    expect(localStorage.getItem('opt_numbers')).toBe('true')
    expect(btn.style.color).toBe('var(--color-main)')
    fireEvent.click(btn)
    expect(localStorage.getItem('opt_numbers')).toBe('false')
    expect(btn.style.color).toBe('var(--color-sub)')
  })
})
