import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import communitiesReducer from '@/store/slices/communitiesSlice'
import { CommunitiesPage } from './CommunitiesPage'

vi.mock('@/services', () => ({
  communitiesService: {
    listCommunities: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 50 }),
    createCommunity: vi.fn(),
  },
}))

function renderCommunitiesPage() {
  const store = configureStore({
    reducer: { auth: authReducer, communities: communitiesReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: {
          user: { id: 1, username: 'amina', role: 'farmer' },
          profile: { firstName: 'Amina', lastName: 'Wanjiru' },
        },
      },
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <CommunitiesPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('CommunitiesPage new-community modal typing', () => {
  it('keeps the community name field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderCommunitiesPage()

    await user.click(screen.getByRole('button', { name: /new community/i }))
    const input = await screen.findByLabelText(/^name$/i)
    await user.click(input)
    await user.type(input, 'Maize Farmers Kenya')

    expect(input).toHaveValue('Maize Farmers Kenya')
    expect(input).toHaveFocus()
  })

  it('keeps the description field focused while typing a full sentence', async () => {
    const user = userEvent.setup()
    renderCommunitiesPage()

    await user.click(screen.getByRole('button', { name: /new community/i }))
    const textarea = await screen.findByLabelText(/description/i)
    const sentence = 'Helping maize farmers share knowledge, experience and advice.'
    await user.click(textarea)
    await user.type(textarea, sentence)

    expect(textarea).toHaveValue(sentence)
    expect(textarea).toHaveFocus()
  })

  it('keeps the search field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderCommunitiesPage()

    const input = screen.getByLabelText(/search communities/i)
    await user.click(input)
    await user.type(input, 'maize')

    expect(input).toHaveValue('maize')
    expect(input).toHaveFocus()
  })
})
