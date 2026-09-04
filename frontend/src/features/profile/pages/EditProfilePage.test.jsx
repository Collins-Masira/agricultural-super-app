import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import profileReducer from '@/store/slices/profileSlice'
import { EditProfilePage } from './EditProfilePage'

vi.mock('@/services', () => ({
  profileService: {
    updateProfile: vi.fn(),
  },
}))

function renderEditProfilePage() {
  const store = configureStore({
    reducer: { auth: authReducer, profile: profileReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: {
          user: { id: 1, username: 'amina', role: 'farmer' },
          profile: { firstName: '', lastName: '', bio: '', location: '', phoneNumber: '', profileImageUrl: null },
        },
      },
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <EditProfilePage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('EditProfilePage typing', () => {
  it('keeps the bio textarea focused while typing a full paragraph', async () => {
    const user = userEvent.setup()
    renderEditProfilePage()

    const textarea = screen.getByLabelText(/bio/i)
    const bio = 'I grow maize and beans on a five acre farm in Nakuru County.'
    await user.click(textarea)
    await user.type(textarea, bio)

    expect(textarea).toHaveValue(bio)
    expect(textarea).toHaveFocus()
  })

  it('keeps the location field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderEditProfilePage()

    const input = screen.getByLabelText(/location/i)
    await user.click(input)
    await user.type(input, 'Nakuru, Kenya')

    expect(input).toHaveValue('Nakuru, Kenya')
    expect(input).toHaveFocus()
  })
})
