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

  it('nests a reply under its parent comment', () => {
    renderWithStore(
      basePost({
        comments: [
          {
            id: 10,
            parentCommentId: null,
            content: 'Original',
            createdAt: new Date().toISOString(),
            author: { profile: { firstName: null, lastName: null }, user: { username: 'amina' } },
          },
          {
            id: 11,
            parentCommentId: 10,
            content: 'Thanks for the tip!',
            createdAt: new Date().toISOString(),
            author: { profile: { firstName: null, lastName: null }, user: { username: 'brian' } },
          },
        ],
      }),
    )

    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByText('Thanks for the tip!')).toBeInTheDocument()
  })

  it('replying to a comment posts with that comment as the parent', async () => {
    const { postsService } = await import('@/services')
    postsService.addComment.mockResolvedValue({
      id: 20,
      parentCommentId: 10,
      content: 'Thanks!',
      createdAt: new Date().toISOString(),
      author: { profile: { firstName: null, lastName: null }, user: { username: 'brian' } },
    })
    const user = userEvent.setup()
    renderWithStore(
      basePost({
        comments: [
          {
            id: 10,
            parentCommentId: null,
            content: 'Original',
            createdAt: new Date().toISOString(),
            author: { profile: { firstName: null, lastName: null }, user: { username: 'amina' } },
          },
        ],
      }),
    )

    await user.click(screen.getByRole('button', { name: /reply/i }))
    expect(screen.getByText(/reply to amina/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/your comment/i), 'Thanks!')
    await user.click(screen.getByRole('button', { name: /post reply/i }))

    expect(postsService.addComment).toHaveBeenCalledWith(1, 'Thanks!', 10)
  })
})
