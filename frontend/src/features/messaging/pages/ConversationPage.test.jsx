import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import { ConversationPage } from './ConversationPage'

vi.mock('@/services', () => ({
  messagesService: {
    getConversation: vi.fn().mockResolvedValue({
      id: 5,
      participants: [
        { userId: 1, participant: { user: { id: 1, username: 'amina' }, profile: { firstName: 'Amina', lastName: 'W' } } },
        { userId: 2, participant: { user: { id: 2, username: 'brian' }, profile: { firstName: 'Brian', lastName: 'K' } } },
      ],
      messages: [],
    }),
    markRead: vi.fn(),
    sendMessage: vi.fn(),
  },
}))

function renderConversationPage() {
  const store = configureStore({
    reducer: { auth: authReducer, messages: messagesReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: { user: { id: 1, username: 'amina', role: 'farmer' }, profile: { firstName: 'Amina', lastName: 'W' } },
      },
    },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/messages/5']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<ConversationPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ConversationPage typing', () => {
  it('keeps the message composer focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderConversationPage()

    const textarea = await screen.findByRole('textbox', { name: /message/i })
    const message = 'Are you free to discuss the maize order tomorrow morning?'
    await user.click(textarea)
    await user.type(textarea, message)

    expect(textarea).toHaveValue(message)
    expect(textarea).toHaveFocus()
  })
})
