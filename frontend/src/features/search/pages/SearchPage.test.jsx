import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import expertsReducer from '@/store/slices/expertsSlice'
import { SearchPage } from './SearchPage'

vi.mock('@/services', () => ({
  usersService: {
    searchUsers: vi.fn(),
  },
  expertsService: {
    getMyFollowing: vi.fn().mockResolvedValue({ followingIds: [] }),
  },
}))

function renderSearchPage() {
  const store = configureStore({
    reducer: { auth: authReducer, experts: expertsReducer },
    preloadedState: {
      auth: { status: 'authenticated', user: { user: { id: 1, username: 'me', role: 'farmer' }, profile: {} } },
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    </Provider>,
  )
}

function personFixture(overrides = {}) {
  return {
    user: { id: 10, username: 'johnkamau', role: 'farmer' },
    profile: { firstName: 'John', lastName: 'Kamau', location: 'Nakuru', bio: 'Maize farmer', profileImageUrl: null },
    ...overrides,
  }
}

describe('SearchPage', () => {
  it('shows an idle prompt before typing', () => {
    renderSearchPage()
    expect(screen.getByText(/search for farmers and experts/i)).toBeInTheDocument()
  })

  it('debounces input and shows matching users', async () => {
    const { usersService } = await import('@/services')
    usersService.searchUsers.mockResolvedValue({ items: [personFixture()], page: 1, pageSize: 20 })
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText(/search users/i), 'kamau')

    await waitFor(() => expect(usersService.searchUsers).toHaveBeenCalledWith('kamau'))
    expect(await screen.findByText('John Kamau')).toBeInTheDocument()
    expect(screen.getByText('@johnkamau')).toBeInTheDocument()
  })

  it('shows a no-results state when nothing matches', async () => {
    const { usersService } = await import('@/services')
    usersService.searchUsers.mockResolvedValue({ items: [], page: 1, pageSize: 20 })
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText(/search users/i), 'zzz')

    expect(await screen.findByText(/no farmers found/i)).toBeInTheDocument()
  })

  it('shows an error state when the search fails', async () => {
    const { usersService } = await import('@/services')
    usersService.searchUsers.mockRejectedValue({ message: 'Network error' })
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByLabelText(/search users/i), 'kamau')

    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })
})
