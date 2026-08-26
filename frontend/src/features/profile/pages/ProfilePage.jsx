import { useEffect } from 'react'
import { Button, EmptyState, LoadingState } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchFollowersCount } from '@/store/slices/expertsSlice'
import { fetchUserPosts } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostCard } from '@/features/posts/components/PostCard'
import { ProfileHero } from '../components/ProfileHero'
import '../profile.css'

export function ProfilePage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()

  const posts = useAppSelector((state) => state.posts.userPosts)
  const postsStatus = useAppSelector((state) => state.posts.userPostsStatus)
  const followersCount = useAppSelector((state) => state.experts.followersCounts[user?.user.id] ?? 0)

  useEffect(() => {
    if (user) {
      dispatch(fetchUserPosts(user.user.id))
      dispatch(fetchFollowersCount(user.user.id))
    }
  }, [dispatch, user])

  if (!user) return null
  if (postsStatus === 'loading') return <LoadingState label="Loading your profile…" />

  return (
    <>
      <ProfileHero
        profile={user}
        followersCount={followersCount}
        actions={
          <>
            <Button to="/profile/edit">Edit profile</Button>
            <Button variant="secondary" to="/profile/change-password">
              Change password
            </Button>
          </>
        }
      />

      <h2 className="asa-profile-section-title">Your posts</h2>
      {posts.length === 0 ? (
        <EmptyState
          title="You have not posted yet"
          description="Share your first agricultural post with the community."
          action={<Button to="/create">Write a post</Button>}
        />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </>
  )
}