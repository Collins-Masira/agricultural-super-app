import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, Tabs } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchFollowersCount, fetchMyFollowing } from '@/store/slices/expertsSlice'
import { fetchSavedPosts, fetchUserPosts } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostGrid } from '@/features/posts/components/PostGrid'
import { GridSkeleton } from '@/features/posts/components/GridSkeleton'
import { FollowingListModal } from '../components/FollowingListModal'
import { ProfileHero } from '../components/ProfileHero'
import '../profile.css'

const TABS = [
  { value: 'posts', label: 'Your posts' },
  { value: 'reels', label: 'Reels' },
  { value: 'saved', label: 'Saved' },
]

export function ProfilePage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState('posts')
  const [followingModalOpen, setFollowingModalOpen] = useState(false)

  const posts = useAppSelector((state) => state.posts.userPosts)
  const postsStatus = useAppSelector((state) => state.posts.userPostsStatus)
  const savedPosts = useAppSelector((state) => state.posts.savedPosts)
  const savedPostsStatus = useAppSelector((state) => state.posts.savedPostsStatus)
  const followersCount = useAppSelector((state) => state.experts.followersCounts[user?.user.id] ?? 0)
  const followingIds = useAppSelector((state) => state.experts.followingIds)

  const textPosts = useMemo(() => posts.filter((p) => !p.videoUrl), [posts])
  const reels = useMemo(() => posts.filter((p) => p.videoUrl), [posts])

  useEffect(() => {
    if (user) {
      dispatch(fetchUserPosts(user.user.id))
      dispatch(fetchFollowersCount(user.user.id))
      dispatch(fetchMyFollowing())
    }
  }, [dispatch, user])

  useEffect(() => {
    if (user && tab === 'saved') dispatch(fetchSavedPosts())
  }, [dispatch, user, tab])

  if (!user) return null

  return (
    <>
      <ProfileHero
        profile={user}
        postsCount={posts.length}
        followersCount={followersCount}
        followingCount={followingIds.length}
        onFollowingClick={() => setFollowingModalOpen(true)}
        actions={
          <>
            <Button to="/profile/edit">Edit profile</Button>
            <Button variant="secondary" to="/profile/change-password">
              Change password
            </Button>
          </>
        }
      />

      <FollowingListModal
        open={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        userIds={followingIds}
      />

      <Tabs items={TABS} value={tab} onChange={setTab} className="asa-profile-tabs" />

      {tab === 'posts' && (
        <>
          {postsStatus === 'loading' && <GridSkeleton />}
          {postsStatus === 'ready' && textPosts.length === 0 && (
            <EmptyState
              title="You have not posted yet"
              description="Share your first agricultural post with the community."
              action={<Button to="/create">Write a post</Button>}
            />
          )}
          {postsStatus === 'ready' && textPosts.length > 0 && <PostGrid posts={textPosts} />}
        </>
      )}

      {tab === 'reels' && (
        <>
          {postsStatus === 'loading' && <GridSkeleton />}
          {postsStatus === 'ready' && reels.length === 0 && (
            <EmptyState
              title="No Reels yet"
              description="Share a short farm video to see it here."
              action={<Button to="/create/reel">Create a Reel</Button>}
              icon="🎬"
            />
          )}
          {postsStatus === 'ready' && reels.length > 0 && <PostGrid posts={reels} />}
        </>
      )}

      {tab === 'saved' && (
        <>
          {savedPostsStatus === 'loading' && <GridSkeleton />}
          {savedPostsStatus === 'ready' && savedPosts.length === 0 && (
            <EmptyState title="No saved posts yet" description="Save posts to come back to them later." icon="🔖" />
          )}
          {savedPostsStatus === 'ready' && savedPosts.length > 0 && <PostGrid posts={savedPosts} />}
        </>
      )}
    </>
  )
}
