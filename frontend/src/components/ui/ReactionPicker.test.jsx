import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReactionPicker } from './ReactionPicker'

describe('ReactionPicker', () => {
  it('shows the total reaction count and no active emoji when the user has not reacted', () => {
    render(<ReactionPicker reactionCounts={{ like: 2, love: 1 }} myReaction={null} onReact={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('opens the emoji menu and reports the picked reaction', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    render(<ReactionPicker reactionCounts={{}} myReaction={null} onReact={onReact} onRemove={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /react to this post/i }))
    await user.click(screen.getByLabelText('Useful'))

    expect(onReact).toHaveBeenCalledWith('fire')
  })

  it('removes the reaction when the currently active emoji is picked again', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<ReactionPicker reactionCounts={{ love: 1 }} myReaction="love" onReact={vi.fn()} onRemove={onRemove} />)

    await user.click(screen.getByRole('button', { name: /your reaction: love/i }))
    await user.click(screen.getByLabelText('Love'))

    expect(onRemove).toHaveBeenCalled()
  })

  it('closes the menu after a pick', async () => {
    const user = userEvent.setup()
    render(<ReactionPicker reactionCounts={{}} myReaction={null} onReact={vi.fn()} onRemove={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /react to this post/i }))
    await user.click(screen.getByLabelText('Wow'))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
