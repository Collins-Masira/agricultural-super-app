import { useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, PageHeader, Tabs } from '@/components/ui'
import { fetchSavedPosts } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostGrid } from '../components/PostGrid'
import { GridSkeleton } from '../components/GridSkeleton'

const TABS = [
  { value: 'posts', label: 'Posts' },
  { value: 'reels', label: 'Reels' },
]

export function SavedPostsPage() {
  const dispatch = useAppDispatch()
  const savedPosts = useAppSelector((state) => state.posts.savedPosts)
  const status = useAppSelector((state) => state.posts.savedPostsStatus)
  const error = useAppSelector((state) => state.posts.savedPostsError)
  const [tab, setTab] = useState('posts')

  useEffect(() => {
    dispatch(fetchSavedPosts())
  }, [dispatch])

  const savedReels = useMemo(() => savedPosts.filter((p) => p.videoUrl), [savedPosts])
  const savedTextPosts = useMemo(() => savedPosts.filter((p) => !p.videoUrl), [savedPosts])
  const visible = tab === 'reels' ? savedReels : savedTextPosts

  return (
    <>
      <PageHeader title="Saved" subtitle="Posts and Reels you've saved to come back to later." />

      {status === 'loading' && <GridSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchSavedPosts())} />}

      {status === 'ready' && (
        <>
          <Tabs items={TABS} value={tab} onChange={setTab} className="asa-profile-tabs" />
          {visible.length === 0 ? (
            <EmptyState
              title={tab === 'reels' ? 'No saved Reels yet' : 'No saved posts yet'}
              description="Save content to come back to it later."
              icon="🔖"
            />
          ) : (
            <PostGrid posts={visible} />
          )}
        </>
      )}
    </>
  )
}
