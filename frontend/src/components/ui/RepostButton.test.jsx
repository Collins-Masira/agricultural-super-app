import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RepostButton } from './RepostButton'

describe('RepostButton', () => {
  it('shows Repost and calls onToggle when not yet reposted', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<RepostButton reposted={false} count={3} onToggle={onToggle} />)

    const button = screen.getByRole('button', { name: /repost/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)
    expect(onToggle).toHaveBeenCalled()
  })

  it('shows Unrepost and is marked pressed when already reposted', () => {
    render(<RepostButton reposted count={4} onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: /unrepost/i })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
