import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import postsReducer from '@/store/slices/postsSlice'
import { CommentSection } from './CommentSection'

vi.mock('@/services', () => ({
  postsService: {
    addComment: vi.fn(),
  },
}))

function renderWithStore(post) {
  const store = configureStore({ reducer: { posts: postsReducer } })
  return render(
    <Provider store={store}>
      <CommentSection post={post} />
    </Provider>,
  )
}

function basePost(overrides = {}) {
  return {
    id: 1,
    comments: [],
    commentsOpen: true,
    ...overrides,
  }
}

describe('CommentSection', () => {
  it('shows the add-comment control when comments are open', () => {
    renderWithStore(basePost())
    expect(screen.getByRole('button', { name: /add a comment/i })).toBeInTheDocument()
    expect(screen.queryByText(/comments are closed/i)).not.toBeInTheDocument()
  })

  it('shows a closed message and hides the add-comment control when comments are closed', () => {
    renderWithStore(basePost({ commentsOpen: false }))
    expect(screen.getByText(/comments are closed by the community admin/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add a comment/i })).not.toBeInTheDocument()
  })

  it('still shows existing comments even when comments are closed', () => {
    renderWithStore(
      basePost({
        commentsOpen: false,
        comments: [
          {
            id: 10,
            content: 'Great post',
            createdAt: new Date().toISOString(),
            author: { profile: { firstName: null, lastName: null }, user: { username: 'amina' } },
          },
        ],
      }),
    )
    expect(screen.getByText('Great post')).toBeInTheDocument()
  })

  it('preserves intentional line breaks in an existing multiline comment', () => {
    renderWithStore(
      basePost({
        comments: [
          {
            id: 11,
            content: 'Great tip.\n\nI tried this last season and it worked well.',
            createdAt: new Date().toISOString(),
            author: { profile: { firstName: null, lastName: null }, user: { username: 'brian' } },
          },
        ],
      }),
    )
    expect(screen.getByText((_, node) => node?.textContent === 'Great tip.\n\nI tried this last season and it worked well.')).toBeInTheDocument()
  })

  it('keeps the comment textarea focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderWithStore(basePost())

    await user.click(screen.getByRole('button', { name: /add a comment/i }))
    const textarea = await screen.findByLabelText(/your comment/i)
    const sentence = 'Has anyone tried applying this to their tomatoes yet?'
    await user.type(textarea, sentence)

    expect(textarea).toHaveValue(sentence)
    expect(textarea).toHaveFocus()
  })
})
