import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer from '@/store/slices/authSlice'
import communitiesReducer from '@/store/slices/communitiesSlice'
import postsReducer from '@/store/slices/postsSlice'
import { useAppSelector } from '@/store/hooks'
import { PostCard } from './PostCard'

vi.mock('@/services', () => ({
  postsService: {
    repostPost: vi.fn(),
    unrepostPost: vi.fn(),
  },
}))

function postFixture(overrides = {}) {
  return {
    id: 1,
    title: 'Pest control tips',
    content: 'Neem oil works great on tomatoes.',
    createdAt: new Date().toISOString(),
    author: {
      user: { id: 5, username: 'amina', role: 'farmer' },
      profile: { firstName: 'Amina', lastName: 'W', profileImageUrl: null },
    },
    images: [],
    comments: [],
    likeCount: 0,
    likedByMe: false,
    communityId: null,
    originalPostId: null,
    originalPost: null,
    reactionCounts: {},
    myReaction: null,
    saveCount: 0,
    savedByMe: false,
    repostCount: 0,
    repostedByMe: false,
    isAnnouncement: false,
    commentsOpen: true,
    ...overrides,
  }
}

function FeedPostFromStore({ postId }) {
  const post = useAppSelector((state) => state.posts.feed.find((p) => p.id === postId))
  if (!post) return null
  return <PostCard post={post} />
}

function renderPostCard(post) {
  const store = configureStore({
    reducer: { auth: authReducer, posts: postsReducer, communities: communitiesReducer },
    preloadedState: {
      auth: {
        status: 'authenticated',
        user: { user: { id: 5, username: 'amina', role: 'farmer' }, profile: { firstName: 'Amina', lastName: 'W' } },
      },
      posts: {
        feed: [post],
        feedStatus: 'ready',
        feedError: null,
        current: null,
        currentStatus: 'idle',
        currentError: null,
        userPosts: [],
        userPostsStatus: 'idle',
        userPostsError: null,
        communityPosts: [],
        communityPostsCommunityId: null,
        communityPostsStatus: 'idle',
        communityPostsError: null,
        savedPosts: [],
        savedPostsStatus: 'idle',
        savedPostsError: null,
        likeLoadingPostId: null,
        reactionLoadingPostId: null,
        saveLoadingPostId: null,
        repostLoadingPostId: null,
        deleteLoadingPostId: null,
        deleteError: null,
      },
      communities: {
        list: [],
        listStatus: 'idle',
        listError: null,
        current: null,
        currentStatus: 'idle',
        currentError: null,
        createStatus: 'idle',
        createError: null,
        membershipLoadingId: null,
        settingsStatus: 'idle',
        settingsError: null,
        memberActionLoadingUserId: null,
      },
    },
  })
  const { container } = render(
    <Provider store={store}>
      <MemoryRouter>
        <FeedPostFromStore postId={post.id} />
      </MemoryRouter>
    </Provider>,
  )
  return { store, container }
}

function deferred() {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('PostCard repost UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows Repost initially with the correct count', () => {
    renderPostCard(postFixture({ repostCount: 3 }))
    const button = screen.getByRole('button', { name: /repost/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveTextContent('3')
  })

  it('changes to Unrepost and increments the count immediately after a successful repost', async () => {
    const { postsService } = await import('@/services')
    const pending = deferred()
    postsService.repostPost.mockReturnValue(pending.promise)

    const user = userEvent.setup()
    renderPostCard(postFixture({ repostCount: 0 }))

    const button = screen.getByRole('button', { name: /repost/i })
    await user.click(button)

    pending.resolve({
      id: 2,
      originalPostId: 1,
      repostCount: 0,
      repostedByMe: false,
      author: { user: { id: 5, username: 'amina' }, profile: {} },
      images: [],
      comments: [],
    })
    const updated = await screen.findByRole('button', { name: /unrepost/i })

    expect(updated).toHaveAttribute('aria-pressed', 'true')
    expect(updated).toHaveTextContent('1')
  })

  it('changes back to Repost and decrements the count after unrepost', async () => {
    const { postsService } = await import('@/services')
    postsService.unrepostPost.mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderPostCard(postFixture({ repostCount: 1, repostedByMe: true }))

    await user.click(screen.getByRole('button', { name: /unrepost/i }))

    const updated = await screen.findByRole('button', { name: /repost/i })
    expect(updated).toHaveAttribute('aria-pressed', 'false')
    expect(updated).toHaveTextContent('0')
  })

  it('disables the button while a repost request is pending and does not send a second request from a second click', async () => {
    const { postsService } = await import('@/services')
    const pending = deferred()
    postsService.repostPost.mockReturnValue(pending.promise)

    const user = userEvent.setup()
    renderPostCard(postFixture({ repostCount: 0 }))

    const button = screen.getByRole('button', { name: /repost/i })
    await user.click(button)

    expect(button).toBeDisabled()
    await user.click(button)

    pending.resolve({
      id: 2,
      originalPostId: 1,
      repostCount: 0,
      repostedByMe: false,
      author: { user: { id: 5, username: 'amina' }, profile: {} },
      images: [],
      comments: [],
    })
    await screen.findByRole('button', { name: /unrepost/i })

    expect(postsService.repostPost).toHaveBeenCalledTimes(1)
  })
})

describe('PostCard content rendering', () => {
  it('renders plain-text content normally', () => {
    renderPostCard(postFixture({ content: 'Hello farmers, welcome to the community.' }))
    expect(screen.getByText('Hello farmers, welcome to the community.')).toBeInTheDocument()
  })

  it('renders bold markdown as emphasized text', () => {
    const { container } = renderPostCard(
      postFixture({ content: '**Clear Debris and Weeds**' }),
    )
    expect(container.querySelector('strong')).toHaveTextContent('Clear Debris and Weeds')
  })

  it('renders a bullet list as list items', () => {
    const { container } = renderPostCard(
      postFixture({ content: '* Remove rocks.\n* Remove weeds.' }),
    )
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Remove rocks.')
  })

  it('renders a numbered list as ordered list items', () => {
    const { container } = renderPostCard(
      postFixture({ content: '1. Dig into the ground.\n2. Break up compacted areas.' }),
    )
    expect(container.querySelector('ol')).toBeInTheDocument()
    expect(container.querySelectorAll('ol li')).toHaveLength(2)
  })

  it('renders a markdown link as a safe, clickable anchor', () => {
    const { container } = renderPostCard(
      postFixture({ content: '[Example website](https://example.com)' }),
    )
    const link = container.querySelector('.asa-post-card__excerpt a')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not execute or render unsafe script content', () => {
    const { container } = renderPostCard(
      postFixture({ content: 'Hello <script>window.__pwned = true</script> world' }),
    )
    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(window.__pwned).toBeUndefined()
  })

  it('preserves the original post formatting on a repost', () => {
    const { container } = renderPostCard(
      postFixture({
        id: 2,
        content: '',
        originalPostId: 1,
        originalPost: {
          id: 1,
          title: 'Soil prep',
          content: '**Loosen and Aerate the Soil**\n\n1. Dig into the ground.\n2. Rake the surface.',
          images: [],
          isAnnouncement: false,
          author: {
            user: { id: 9, username: 'brian', role: 'farmer' },
            profile: { firstName: 'Brian', lastName: 'K', profileImageUrl: null },
          },
        },
      }),
    )
    expect(container.querySelector('strong')).toHaveTextContent('Loosen and Aerate the Soil')
    expect(container.querySelectorAll('ol li')).toHaveLength(2)
  })

  it('renders formatted content for an announcement post the same way', () => {
    const { container } = renderPostCard(
      postFixture({ isAnnouncement: true, content: '**Heads up**\n\n* Meeting moved to Friday.' }),
    )
    expect(container.querySelector('strong')).toHaveTextContent('Heads up')
    expect(container.querySelector('li')).toHaveTextContent('Meeting moved to Friday.')
  })
})
