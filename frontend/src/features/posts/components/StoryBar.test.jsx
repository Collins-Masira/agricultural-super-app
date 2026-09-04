import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import storiesReducer from '@/store/slices/storiesSlice'
import { StoryBar } from './StoryBar'

vi.mock('@/services', () => ({
  storiesService: {
    listActiveStories: vi.fn(),
  },
}))

function storyFixture(overrides = {}) {
  return {
    id: 1,
    userId: 5,
    imageUrl: 'https://x/brian.jpg',
    caption: null,
    createdAt: '2026-09-04T00:00:00',
    expiresAt: '2026-09-05T00:00:00',
    author: {
      user: { id: 5, username: 'brian', role: 'farmer' },
      profile: { firstName: 'Brian', lastName: 'K', profileImageUrl: null },
    },
    ...overrides,
  }
}

function renderStoryBar({ user = null } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, stories: storiesReducer },
    preloadedState: {
      auth: { status: user ? 'authenticated' : 'idle', user },
    },
  })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <StoryBar />
      </MemoryRouter>
    </Provider>,
  )
}

const amina = { user: { id: 1, username: 'amina', role: 'farmer' }, profile: { firstName: 'Amina', lastName: 'W', profileImageUrl: null } }

describe('StoryBar', () => {
  it('shows an add-story link when the current user has no active story', async () => {
    const { storiesService } = await import('@/services')
    storiesService.listActiveStories.mockResolvedValue([])

    renderStoryBar({ user: amina })

    await waitFor(() => expect(storiesService.listActiveStories).toHaveBeenCalled())
    const link = await screen.findByRole('link', { name: /your story/i })
    expect(link).toHaveAttribute('href', '/create/story')
  })

  it('renders other users active stories as clickable tiles, grouped by author', async () => {
    const { storiesService } = await import('@/services')
    storiesService.listActiveStories.mockResolvedValue([storyFixture()])

    renderStoryBar({ user: amina })

    expect(await screen.findByRole('button', { name: /brian/i })).toBeInTheDocument()
  })

  it("opens the viewer on a user's story when their tile is clicked", async () => {
    const user = userEvent.setup()
    const { storiesService } = await import('@/services')
    storiesService.listActiveStories.mockResolvedValue([storyFixture()])

    renderStoryBar({ user: amina })

    const tile = await screen.findByRole('button', { name: /brian/i })
    await user.click(tile)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The story image has an empty alt (decorative), so it isn't exposed
    // via the "img" role -- select it directly instead.
    expect(document.querySelector('.asa-story-viewer__media img')).toHaveAttribute(
      'src',
      'https://x/brian.jpg',
    )
  })

  it("shows the current user's own tile as a viewable story (not an add-link) once they have one active", async () => {
    const { storiesService } = await import('@/services')
    storiesService.listActiveStories.mockResolvedValue([storyFixture({ id: 2, userId: 1, author: amina })])

    renderStoryBar({ user: amina })

    const ownTile = await screen.findByRole('button', { name: /your story/i })
    expect(ownTile).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /your story/i })).not.toBeInTheDocument()
  })
})
