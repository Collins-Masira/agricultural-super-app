import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

function CommentFormHarness() {
  const [open, setOpen] = useState(true)
  const [content, setContent] = useState('')

  return (
    <Modal open={open} title="Add a comment" onClose={() => setOpen(false)}>
      <textarea
        aria-label="Your comment"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
    </Modal>
  )
}

describe('Modal', () => {
  it('keeps a text input focused while the user types continuously', async () => {
    const user = userEvent.setup()
    render(<CommentFormHarness />)

    const textarea = screen.getByLabelText('Your comment')
    await user.click(textarea)
    await user.type(textarea, 'Great tips!')

    expect(textarea).toHaveValue('Great tips!')
    expect(textarea).toHaveFocus()
  })
})
