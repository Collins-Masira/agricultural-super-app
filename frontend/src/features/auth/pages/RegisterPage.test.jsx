import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import { RegisterPage } from './RegisterPage'

vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}))

function renderRegisterPage() {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { status: 'unauthenticated', user: null } },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('RegisterPage typing', () => {
  it('keeps the username field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const input = screen.getByLabelText(/username/i)
    await user.click(input)
    await user.type(input, 'jane_kamau')

    expect(input).toHaveValue('jane_kamau')
    expect(input).toHaveFocus()
  })

  it('keeps the email field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const input = screen.getByLabelText(/email/i)
    await user.click(input)
    await user.type(input, 'jane@example.com')

    expect(input).toHaveValue('jane@example.com')
    expect(input).toHaveFocus()
  })

  it('keeps the bio-adjacent free text fields focused while typing a full sentence', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const input = screen.getByLabelText(/first name/i)
    await user.click(input)
    await user.type(input, 'Jane Wanjiru Kamau')

    expect(input).toHaveValue('Jane Wanjiru Kamau')
    expect(input).toHaveFocus()
  })
})
