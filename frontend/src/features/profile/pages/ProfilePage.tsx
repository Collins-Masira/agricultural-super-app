import { useCallback, useEffect, useState } from 'react'
import { Button, EmptyState, LoadingState } from '@/components/ui'
import { expertsService, postsService } from '@/services'
import { PostDetail } from '@/types/domain'
import { useAuth } from '@/features/auth/AuthContext'
import { PostCard } from '@/features/posts/components/PostCard'
import { ProfileHero } from '../components/ProfileHero'
import '../profile.css'

export function ProfilePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<PostDetail[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const load = useCallback(async () => {
    if (!user) return
    setStatus('loading')
    try {
      const [myPosts, followers] = await Promise.all([
        postsService.listUserPosts(user.user.id),
        expertsService.getFollowersCount(user.user.id),
      ])
      setPosts(myPosts)
      setFollowersCount(followers)
      setStatus('ready')
    } finally {
      setStatus('ready')
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  if (!user) return null
  if (status === 'loading') return <LoadingState label="Loading your profile…" />

  return (
    <>
      <ProfileHero
        profile={user}
        followersCount={followersCount}
        actions={<Button to="/profile/edit">Edit profile</Button>}
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