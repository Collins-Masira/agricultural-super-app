import { useCallback, useEffect, useState } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { Button } from '@/components/ui'
import { postsService } from '@/services'
import { PostDetail } from '@/types/domain'
import { PostCard } from '../components/PostCard'
import { errorMessage } from '@/features/auth/AuthContext'

export function FeedPage() {
  const [posts, setPosts] = useState<PostDetail[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await postsService.listPosts(1, 10)
      setPosts(result.items)
      setStatus('ready')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={load} />}
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