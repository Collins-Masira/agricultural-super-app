import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { expertsService, postsService } from '@/services'
import { PostDetail, UserProfile } from '@/types/domain'
import { errorMessage } from '@/features/auth/AuthContext'
import { PostCard } from '@/features/posts/components/PostCard'
import { ProfileHero } from '@/features/profile/components/ProfileHero'
import { FollowButton } from '../components/FollowButton'
import '@/features/experts/experts.css'

export function ExpertProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [expert, setExpert] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<PostDetail[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingIds, setFollowingIds] = useState<number[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setStatus('loading')
    setError(null)
    try {
      const id = Number(userId)
      const [profile, postsList, followers, following] = await Promise.all([
        expertsService.getExpert(id),
        postsService.listUserPosts(id),
        expertsService.getFollowersCount(id),
        expertsService.getMyFollowing(),
      ])
      setExpert(profile)
      setPosts(postsList)
      setFollowersCount(followers)
      setFollowingIds(following.followingIds)
      setStatus('ready')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  if (status === 'loading') return <LoadingState label="Loading profile…" />
  if (status === 'error' || !expert) return <ErrorState message={error ?? undefined} onRetry={load} />

  return (
    <>
      <ProfileHero
        profile={expert}
        followersCount={followersCount}
        actions={
          <FollowButton
            userId={expert.user.id}
            isFollowing={followingIds.includes(expert.user.id)}
            onFollowChange={(following) =>
              setFollowingIds((prev) =>
                following ? [...prev, expert.user.id] : prev.filter((id) => id !== expert.user.id),
              )
            }
          />
        }
      />

      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        &larr; Back
      </Button>

      <h2 className="asa-profile-section-title">Posts by {expert.user.username}</h2>
      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description="This expert has not published any posts." />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </>
  )
}