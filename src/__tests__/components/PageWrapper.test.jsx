import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PageWrapper } from '../../components/layout/PageWrapper.jsx'

describe('PageWrapper', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <PageWrapper><span>inner content</span></PageWrapper>
    )
    expect(getByText('inner content')).toBeTruthy()
  })

  it('wraps children in a full-width container', () => {
    const { container } = render(<PageWrapper><div>x</div></PageWrapper>)
    expect(container.firstChild.className).toContain('w-full')
  })
})
