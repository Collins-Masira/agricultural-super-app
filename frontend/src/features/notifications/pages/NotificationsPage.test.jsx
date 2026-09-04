import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import notificationsReducer from '@/store/slices/notificationsSlice'
import { NotificationsPage } from './NotificationsPage'

vi.mock('@/services', () => ({
  notificationsService: {
    listNotifications: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

function notificationFixture(overrides = {}) {
  return {
    id: 1,
    type: 'post_like',
    isRead: false,
    createdAt: '2026-08-28T00:00:00Z',
    postId: 7,
    commentId: null,
    postTitle: 'Preparing the soil',
    actor: {
      user: { id: 10, username: 'johnkamau', role: 'farmer' },
      profile: { firstName: 'John', lastName: 'Kamau', profileImageUrl: null },
    },
    ...overrides,
  }
}

function renderPage() {
  const store = configureStore({ reducer: { notifications: notificationsReducer } })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    </Provider>,
  )
  return store
}

describe('NotificationsPage', () => {
  it('shows an empty state when there are no notifications', async () => {
    const { notificationsService } = await import('@/services')
    notificationsService.listNotifications.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument()
  })

  it('renders a like notification with the actor and post title', async () => {
    const { notificationsService } = await import('@/services')
    notificationsService.listNotifications.mockResolvedValue([notificationFixture()])

    renderPage()

    expect(await screen.findByText(/john kamau liked your post/i)).toBeInTheDocument()
    expect(screen.getByText('Preparing the soil')).toBeInTheDocument()
  })

  it('marks a notification read when clicked', async () => {
    const { notificationsService } = await import('@/services')
    notificationsService.listNotifications.mockResolvedValue([notificationFixture()])
    notificationsService.markRead.mockResolvedValue(notificationFixture({ isRead: true }))
    const user = userEvent.setup()

    renderPage()
    const item = await screen.findByText(/john kamau liked your post/i)
    await user.click(item)

    await waitFor(() => expect(notificationsService.markRead).toHaveBeenCalledWith(1))
  })

  it('marks all notifications read', async () => {
    const { notificationsService } = await import('@/services')
    notificationsService.listNotifications.mockResolvedValue([
      notificationFixture(),
      notificationFixture({ id: 2, postTitle: 'A different post' }),
    ])
    notificationsService.markAllRead.mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()
    await screen.findByText('A different post')
    await user.click(screen.getByRole('button', { name: /mark all as read/i }))

    await waitFor(() => expect(notificationsService.markAllRead).toHaveBeenCalled())
  })
})
