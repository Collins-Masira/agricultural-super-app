import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import communitiesReducer from '@/store/slices/communitiesSlice'
import postsReducer from '@/store/slices/postsSlice'
import { CommunityDetailPage } from './CommunityDetailPage'

vi.mock('@/services', () => ({
  communitiesService: {
    getCommunity: vi.fn(),
  },
  postsService: {
    listCommunityPosts: vi.fn().mockResolvedValue([]),
  },
}))

function communityFixture({ myRole, postingPermission = 'everyone', includeOtherMember = false }) {
  const members = [
    {
      id: 1,
      userId: 999,
      role: 'admin',
      joinedAt: new Date().toISOString(),
      member: { user: { id: 999, username: 'founder', role: 'farmer' }, profile: { firstName: 'Founder', lastName: 'User' } },
    },
    {
      id: 2,
      userId: 1,
      role: myRole,
      joinedAt: new Date().toISOString(),
      member: { user: { id: 1, username: 'viewer', role: 'farmer' }, profile: { firstName: 'Viewer', lastName: 'One' } },
    },
  ]

  if (includeOtherMember) {
    members.push({
      id: 3,
      userId: 2,
      role: 'member',
      joinedAt: new Date().toISOString(),
      member: { user: { id: 2, username: 'brian', role: 'farmer' }, profile: { firstName: 'Brian', lastName: 'K' } },
    })
  }

  return {
    id: 10,
    name: 'Maize Farmers',
    description: 'A community for maize farmers.',
    imageUrl: null,
    createdBy: 999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    creator: {
      user: { id: 999, username: 'founder', role: 'farmer' },
      profile: { firstName: 'Founder', lastName: 'User' },
    },
    members,
    postingPermission,
    messagingPermission: 'everyone',
    commentsEnabled: true,
    myRole,
  }
}

async function renderCommunityDetailPage({ community, userRole }) {
  const { communitiesService } = await import('@/services')
  communitiesService.getCommunity.mockResolvedValue(community)

  const store = configureStore({
    reducer: { auth: authReducer, communities: communitiesReducer, posts: postsReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: {
          user: { id: 1, username: 'viewer', role: userRole },
          profile: { firstName: 'Viewer', lastName: 'One' },
        },
      },
    },
  })

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/communities/10']}>
        <Routes>
          <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  await screen.findByText('Maize Farmers')
}

describe('CommunityDetailPage admin visibility', () => {
  it('shows an admin the settings button and the announcement option', async () => {
    await renderCommunityDetailPage({
      community: communityFixture({ myRole: 'admin', postingPermission: 'everyone' }),
      userRole: 'farmer',
    })

    expect(screen.getByRole('button', { name: /community settings/i })).toBeInTheDocument()
    await screen.findByPlaceholderText(/share something with/i)
    expect(screen.getByText(/post as announcement/i)).toBeInTheDocument()
  })

  it('lets an admin open member management with promote/demote and remove controls', async () => {
    const user = userEvent.setup()
    await renderCommunityDetailPage({
      community: communityFixture({ myRole: 'admin', includeOtherMember: true }),
      userRole: 'farmer',
    })

    await user.click(screen.getByRole('tab', { name: /^members$/i }))

    expect(screen.getByRole('button', { name: /promote/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /demote/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /remove/i }).length).toBeGreaterThan(0)
  })

  it('allows an expert to post when experts_only is set, without showing admin controls', async () => {
    await renderCommunityDetailPage({
      community: communityFixture({ myRole: 'member', postingPermission: 'experts_only' }),
      userRole: 'expert',
    })

    expect(screen.queryByRole('button', { name: /community settings/i })).not.toBeInTheDocument()
    expect(await screen.findByPlaceholderText(/share something with/i)).toBeInTheDocument()
    expect(screen.queryByText(/post as announcement/i)).not.toBeInTheDocument()
  })

  it('does not let an expert see admin member-management controls', async () => {
    const user = userEvent.setup()
    await renderCommunityDetailPage({
      community: communityFixture({ myRole: 'member', postingPermission: 'experts_only', includeOtherMember: true }),
      userRole: 'expert',
    })

    await user.click(screen.getByRole('tab', { name: /^members$/i }))

    expect(screen.queryByRole('button', { name: /promote/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /demote/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('blocks an ordinary member from posting when experts_only is set, and hides admin controls', async () => {
    await renderCommunityDetailPage({
      community: communityFixture({ myRole: 'member', postingPermission: 'experts_only' }),
      userRole: 'farmer',
    })

    expect(screen.queryByRole('button', { name: /community settings/i })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/share something with/i)).not.toBeInTheDocument()
    expect(await screen.findByText(/only experts can post/i)).toBeInTheDocument()
  })

  it('never shows the announcement checkbox to a non-admin member', async () => {
    await renderCommunityDetailPage({
      community: communityFixture({ myRole: 'member', postingPermission: 'everyone' }),
      userRole: 'farmer',
    })

    await screen.findByPlaceholderText(/share something with/i)
    expect(screen.queryByText(/post as announcement/i)).not.toBeInTheDocument()
  })
})
