import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { UsernameModal } from '../../components/leaderboard/UsernameModal.jsx'

describe('UsernameModal', () => {
  it('renders the prompt and disables save while empty', () => {
    const { getByText, getByRole } = render(
      <UsernameModal onConfirm={vi.fn()} onClose={vi.fn()} />
    )
    expect(getByText('enter a display name')).toBeTruthy()
    expect(getByRole('button', { name: 'save' }).disabled).toBe(true)
  })

  it('enables save once a name is typed', () => {
    const { getByPlaceholderText, getByRole } = render(
      <UsernameModal onConfirm={vi.fn()} onClose={vi.fn()} />
    )
    fireEvent.change(getByPlaceholderText('your name'), { target: { value: 'ada' } })
    expect(getByRole('button', { name: 'save' }).disabled).toBe(false)
  })

  it('confirms with the trimmed name on submit', () => {
    const onConfirm = vi.fn()
    const { getByPlaceholderText, getByRole } = render(
      <UsernameModal onConfirm={onConfirm} onClose={vi.fn()} />
    )
    fireEvent.change(getByPlaceholderText('your name'), { target: { value: '  ada  ' } })
    fireEvent.click(getByRole('button', { name: 'save' }))
    expect(onConfirm).toHaveBeenCalledWith('ada')
  })

  it('does not confirm when only whitespace is entered', () => {
    const onConfirm = vi.fn()
    const { getByPlaceholderText, container } = render(
      <UsernameModal onConfirm={onConfirm} onClose={vi.fn()} />
    )
    fireEvent.change(getByPlaceholderText('your name'), { target: { value: '   ' } })
    fireEvent.submit(container.querySelector('form'))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn()
    const { getByRole } = render(
      <UsernameModal onConfirm={vi.fn()} onClose={onClose} />
    )
    fireEvent.click(getByRole('button', { name: 'cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <UsernameModal onConfirm={vi.fn()} onClose={onClose} />
    )
    fireEvent.click(container.firstChild)
    expect(onClose).toHaveBeenCalled()
  })
})
