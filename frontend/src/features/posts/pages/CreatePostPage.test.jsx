import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import communitiesReducer from '@/store/slices/communitiesSlice'
import postsReducer from '@/store/slices/postsSlice'
import { CreatePostPage } from './CreatePostPage'

vi.mock('@/services', () => ({
  postsService: {
    createPost: vi.fn(),
  },
  communitiesService: {
    getCommunity: vi.fn(),
    listCommunities: vi.fn().mockResolvedValue({ items: [] }),
  },
}))

function renderCreatePostPage(initialPath = '/create') {
  const store = configureStore({
    reducer: { auth: authReducer, posts: postsReducer, communities: communitiesReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: { user: { id: 1, username: 'amina', role: 'farmer' }, profile: { firstName: 'Amina', lastName: 'W' } },
      },
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <CreatePostPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('CreatePostPage typing', () => {
  it('keeps the caption focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    const textarea = screen.getByLabelText(/post caption/i)
    const paragraph = 'Neem oil is an effective and affordable way to control common pests on tomatoes.'
    await user.click(textarea)
    await user.type(textarea, paragraph)

    expect(textarea).toHaveValue(paragraph)
    expect(textarea).toHaveFocus()
  })

  it('does not show a title field or markdown formatting toolbar', () => {
    renderCreatePostPage()

    expect(screen.queryByLabelText(/^title$/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^bold$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^italic$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /preview/i })).not.toBeInTheDocument()
  })

  it('disables Post until a caption is entered', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    expect(screen.getByRole('button', { name: /^post$/i })).toBeDisabled()

    await user.type(screen.getByLabelText(/post caption/i), 'Harvest day!')
    expect(screen.getByRole('button', { name: /^post$/i })).toBeEnabled()
  })
})

describe('CreatePostPage announcement visibility', () => {
  it('does not show the announcement option for a general feed post', () => {
    renderCreatePostPage('/create')
    expect(screen.queryByText(/post as community announcement/i)).not.toBeInTheDocument()
  })

  it('does not show the announcement option for a community post when the viewer is not an admin', async () => {
    const { communitiesService } = await import('@/services')
    communitiesService.getCommunity.mockResolvedValue({
      id: 7,
      name: 'Maize Farmers',
      myRole: 'member',
      members: [],
      creator: null,
    })

    renderCreatePostPage('/create?communityId=7')

    await waitFor(() => expect(communitiesService.getCommunity).toHaveBeenCalled())
    expect(screen.queryByText(/post as community announcement/i)).not.toBeInTheDocument()
  })

  it('shows the announcement option for a community post when the viewer is an admin', async () => {
    const { communitiesService } = await import('@/services')
    communitiesService.getCommunity.mockResolvedValue({
      id: 8,
      name: 'Maize Farmers',
      myRole: 'admin',
      members: [],
      creator: null,
    })

    renderCreatePostPage('/create?communityId=8')

    expect(await screen.findByText(/post as community announcement/i)).toBeInTheDocument()
  })
})
