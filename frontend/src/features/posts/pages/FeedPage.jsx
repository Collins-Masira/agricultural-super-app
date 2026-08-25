import { useEffect } from 'react'
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { fetchFeed } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostCard } from '../components/PostCard'

export function FeedPage() {
  const dispatch = useAppDispatch()
  const posts = useAppSelector((state) => state.posts.feed)
  const status = useAppSelector((state) => state.posts.feedStatus)
  const error = useAppSelector((state) => state.posts.feedError)

  useEffect(() => {
    dispatch(fetchFeed({ page: 1, pageSize: 10 }))
  }, [dispatch])

  return (
    <>
      <PageHeader
        title="Feed"
        subtitle="Latest from farmers and experts."
        actions={
          <Button to="/create">New post</Button>
        }
      />

      {status === 'loading' && <LoadingState label="Loading posts…" />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchFeed({ page: 1, pageSize: 10 }))} />}
      {status === 'ready' && posts.length === 0 && (
        <EmptyState
          title="No posts yet"
          description="Share the first agricultural post with the community."
          action={<Button to="/create">Write a post</Button>}
        />
      )}
      {status === 'ready' &&
        posts.map((post) => <PostCard key={post.id} post={post} />)}
    </>
  )
}