import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import storiesReducer from '@/store/slices/storiesSlice'
import { CreateStoryPage } from './CreateStoryPage'

vi.mock('@/services', () => ({
  uploadsService: {
    uploadImage: vi.fn().mockResolvedValue({ url: 'https://x/uploaded.png', filename: 'uploaded.png' }),
  },
  storiesService: {
    createStory: vi.fn(),
  },
}))

function renderCreateStoryPage() {
  const store = configureStore({
    reducer: { auth: authReducer, stories: storiesReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: { user: { id: 1, username: 'amina', role: 'farmer' }, profile: { firstName: 'Amina', lastName: 'W' } },
      },
    },
  })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CreateStoryPage />
      </MemoryRouter>
    </Provider>,
  )
  return store
}

async function selectImage(user) {
  const file = new File(['image-bytes'], 'story.png', { type: 'image/png' })
  const input = document.querySelector('input[type="file"]')
  await user.upload(input, file)
}

describe('CreateStoryPage', () => {
  it('disables Share story until an image is uploaded', () => {
    renderCreateStoryPage()
    expect(screen.getByRole('button', { name: /share story/i })).toBeDisabled()
  })

  it('creates a real story via the API and navigates home on success', async () => {
    const user = userEvent.setup()
    const { storiesService } = await import('@/services')
    storiesService.createStory.mockResolvedValue({
      id: 9,
      userId: 1,
      imageUrl: 'https://x/uploaded.png',
      caption: 'Morning harvest',
      createdAt: '2026-09-04T00:00:00',
      expiresAt: '2026-09-05T00:00:00',
      author: null,
    })

    renderCreateStoryPage()
    await selectImage(user)

    await waitFor(() => expect(screen.getByRole('button', { name: /share story/i })).toBeEnabled())

    await user.type(screen.getByLabelText(/story caption/i), 'Morning harvest')
    await user.click(screen.getByRole('button', { name: /share story/i }))

    await waitFor(() =>
      expect(storiesService.createStory).toHaveBeenCalledWith({
        imageUrl: 'https://x/uploaded.png',
        caption: 'Morning harvest',
      }),
    )
  })

  it('shows an error toast and keeps the composer open when creation fails', async () => {
    const user = userEvent.setup()
    const { storiesService } = await import('@/services')
    storiesService.createStory.mockRejectedValue('Failed to create story.')

    renderCreateStoryPage()
    await selectImage(user)
    await waitFor(() => expect(screen.getByRole('button', { name: /share story/i })).toBeEnabled())

    await user.click(screen.getByRole('button', { name: /share story/i }))

    expect(await screen.findByText(/failed to create story/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share story/i })).toBeInTheDocument()
  })
})
