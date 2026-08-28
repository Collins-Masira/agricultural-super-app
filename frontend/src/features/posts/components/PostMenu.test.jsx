import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import communitiesReducer from '@/store/slices/communitiesSlice'
import postsReducer from '@/store/slices/postsSlice'
import { PostMenu } from './PostMenu'

vi.mock('@/services', () => ({
  postsService: {
    deletePost: vi.fn(),
    updatePost: vi.fn(),
    reportPost: vi.fn(),
  },
}))

function postFixture(overrides = {}) {
  return {
    id: 1,
    title: 'Original title',
    content: 'Original content',
    author: { user: { id: 5, username: 'amina', role: 'farmer' }, profile: {} },
    communityId: null,
    ...overrides,
  }
}

function renderMenu({ post, currentUser, community = null, onDeleted } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, posts: postsReducer, communities: communitiesReducer },
    preloadedState: {
      auth: { status: 'authenticated', user: currentUser },
      posts: {
        feed: [post],
        feedStatus: 'ready',
        feedError: null,
        current: null,
        currentStatus: 'idle',
        currentError: null,
        userPosts: [],
        userPostsStatus: 'idle',
        userPostsError: null,
        communityPosts: [],
        communityPostsCommunityId: null,
        communityPostsStatus: 'idle',
        communityPostsError: null,
        savedPosts: [],
        savedPostsStatus: 'idle',
        savedPostsError: null,
        likeLoadingPostId: null,
        reactionLoadingPostId: null,
        saveLoadingPostId: null,
        repostLoadingPostId: null,
        updateLoadingPostId: null,
        updateError: null,
        deleteLoadingPostId: null,
        deleteError: null,
      },
      communities: {
        list: [],
        listStatus: 'idle',
        listError: null,
        current: community,
        currentStatus: 'idle',
        currentError: null,
        createStatus: 'idle',
        createError: null,
        membershipLoadingId: null,
        settingsStatus: 'idle',
        settingsError: null,
        memberActionLoadingUserId: null,
      },
    },
  })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <PostMenu post={post} onDeleted={onDeleted} />
      </MemoryRouter>
    </Provider>,
  )
  return store
}

const owner = { user: { id: 5, username: 'amina', role: 'farmer' }, profile: {} }
const otherUser = { user: { id: 9, username: 'brian', role: 'farmer' }, profile: {} }

describe('PostMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the options menu for the post author', () => {
    renderMenu({ post: postFixture(), currentUser: owner })
    expect(screen.getByRole('button', { name: /post options/i })).toBeInTheDocument()
  })

  it('does not show the options menu for an anonymous viewer', () => {
    renderMenu({ post: postFixture(), currentUser: null })
    expect(screen.queryByRole('button', { name: /post options/i })).not.toBeInTheDocument()
  })

  it('offers only Report (no Edit/Delete) for a logged-in non-owner', async () => {
    const user = userEvent.setup()
    renderMenu({ post: postFixture(), currentUser: otherUser })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /report/i })).toBeInTheDocument()
  })

  it('shows a confirmation dialog when Delete is chosen', async () => {
    const user = userEvent.setup()
    renderMenu({ post: postFixture(), currentUser: owner })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(screen.getByText('Delete post?')).toBeInTheDocument()
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
  })

  it('does not delete the post when Cancel is clicked', async () => {
    const { postsService } = await import('@/services')
    const user = userEvent.setup()
    renderMenu({ post: postFixture(), currentUser: owner })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(postsService.deletePost).not.toHaveBeenCalled()
    expect(screen.queryByText('Delete post?')).not.toBeInTheDocument()
  })

  it('deletes the post and removes it from the feed when Delete is confirmed', async () => {
    const { postsService } = await import('@/services')
    postsService.deletePost.mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    const user = userEvent.setup()
    const store = renderMenu({ post: postFixture(), currentUser: owner, onDeleted })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(store.getState().posts.feed).toHaveLength(0))
    expect(onDeleted).toHaveBeenCalled()
  })

  it('shows an error and keeps the post when deletion fails', async () => {
    const { postsService } = await import('@/services')
    postsService.deletePost.mockRejectedValue(new Error('Server error.'))
    const user = userEvent.setup()
    const store = renderMenu({ post: postFixture(), currentUser: owner })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(await screen.findByText('Server error.')).toBeInTheDocument()
    expect(store.getState().posts.feed).toHaveLength(1)
  })

  it('shows an edit dialog pre-filled with the post when Edit is chosen', async () => {
    const user = userEvent.setup()
    renderMenu({ post: postFixture(), currentUser: owner })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /edit/i }))

    expect(screen.getByText('Edit post')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original content')).toBeInTheDocument()
  })

  it('saves edits and updates the post in the feed', async () => {
    const { postsService } = await import('@/services')
    postsService.updatePost.mockResolvedValue({
      id: 1,
      title: 'Updated title',
      content: 'Updated content',
      updatedAt: '2026-08-28T00:00:00Z',
    })
    const user = userEvent.setup()
    const store = renderMenu({ post: postFixture(), currentUser: owner })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /edit/i }))
    await user.clear(screen.getByLabelText(/title/i))
    await user.type(screen.getByLabelText(/title/i), 'Updated title')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(store.getState().posts.feed[0].title).toBe('Updated title'))
    expect(postsService.updatePost).toHaveBeenCalledWith(1, {
      title: 'Updated title',
      content: 'Original content',
    })
    expect(screen.queryByText('Edit post')).not.toBeInTheDocument()
  })

  it('does not show Edit for an unauthorized user, even a community admin who can delete', async () => {
    const user = userEvent.setup()
    renderMenu({
      post: postFixture({ communityId: 3 }),
      currentUser: otherUser,
      community: { id: 3, myRole: 'admin' },
    })

    await user.click(screen.getByRole('button', { name: /post options/i }))
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })
})
