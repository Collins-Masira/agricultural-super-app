import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, ErrorState, Tabs } from '@/components/ui'
import { fetchFeed } from '@/store/slices/postsSlice'
import { fetchMyFollowing } from '@/store/slices/expertsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostCard } from '../components/PostCard'
import { StoryBar } from '../components/StoryBar'
import { SuggestedPanel } from '../components/SuggestedPanel'
import { FeedSkeleton } from '../components/PostCardSkeleton'
import '../components/posts.css'

const FEED_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'following', label: 'Following' },
]

const FARMING_TIPS = [
  'Rotate your crops each season to keep the soil healthy and reduce pest build-up.',
  'Test your soil before planting so you add exactly the nutrients it needs.',
  'Mulching around plants helps retain moisture and suppress weeds.',
  'Water early in the morning to reduce evaporation loss.',
  'Isolate a sick animal right away to stop disease spreading through your herd.',
  'Space seedlings properly — overcrowding invites pests and disease.',
]

function tipOfTheDay() {
  return FARMING_TIPS[new Date().getDate() % FARMING_TIPS.length]
}

export function FeedPage() {
  const dispatch = useAppDispatch()
  const posts = useAppSelector((state) => state.posts.feed)
  const status = useAppSelector((state) => state.posts.feedStatus)
  const error = useAppSelector((state) => state.posts.feedError)
  const followingIds = useAppSelector((state) => state.experts.followingIds)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    dispatch(fetchFeed({ page: 1, pageSize: 10 }))
    dispatch(fetchMyFollowing())
  }, [dispatch])

  const visiblePosts = useMemo(() => {
    if (filter === 'announcements') return posts.filter((post) => post.isAnnouncement)
    if (filter === 'following') return posts.filter((post) => followingIds.includes(post.author.user.id))
    return posts
  }, [posts, filter, followingIds])

  const emptyCopy = {
    all: {
      title: 'No posts yet',
      description: 'Be the first person to share something with the community.',
    },
    announcements: {
      title: 'No announcements yet',
      description: 'Community announcements will show up here.',
    },
    following: {
      title: 'No posts from people you follow',
      description: 'Follow farmers and experts to see their posts here.',
    },
  }[filter]

  return (
    <div className="asa-feed-layout">
      <div className="asa-feed-layout__main">
        <p className="asa-feed-tip">
          <strong>🌱 Farming tip:</strong> {tipOfTheDay()}
        </p>

        {status === 'ready' && <StoryBar posts={posts} />}

        <Tabs items={FEED_FILTERS} value={filter} onChange={setFilter} className="asa-feed-filters" />

        {status === 'loading' && <FeedSkeleton />}
        {status === 'error' && <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchFeed({ page: 1, pageSize: 10 }))} />}
        {status === 'ready' && visiblePosts.length === 0 && (
          <EmptyState
            title={emptyCopy.title}
            description={emptyCopy.description}
            action={filter === 'all' ? <Button to="/create">Write a post</Button> : undefined}
          />
        )}
        {status === 'ready' &&
          visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      <SuggestedPanel />
    </div>
  )
}
