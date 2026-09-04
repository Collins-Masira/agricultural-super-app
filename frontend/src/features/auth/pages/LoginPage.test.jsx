import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import { LoginPage } from './LoginPage'

vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}))

function renderLoginPage() {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { status: 'unauthenticated', user: null } },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('LoginPage typing', () => {
  it('keeps the username field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    const input = screen.getByLabelText(/username or email/i)
    await user.click(input)
    await user.type(input, 'jane_kamau')

    expect(input).toHaveValue('jane_kamau')
    expect(input).toHaveFocus()
  })

  it('keeps the password field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    const input = screen.getByLabelText(/^password$/i)
    await user.click(input)
    await user.type(input, 'SuperSecret123!')

    expect(input).toHaveValue('SuperSecret123!')
    expect(input).toHaveFocus()
  })
})
