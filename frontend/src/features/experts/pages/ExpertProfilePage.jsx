import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { fetchExpert, fetchFollowersCount, fetchMyFollowing } from '@/store/slices/expertsSlice'
import { fetchUserPosts } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostCard } from '@/features/posts/components/PostCard'
import { ProfileHero } from '@/features/profile/components/ProfileHero'
import { useAuth } from '@/features/auth/AuthContext'
import { FollowButton } from '../components/FollowButton'
import { MessageButton } from '../components/MessageButton'
import '@/features/experts/experts.css'

export function ExpertProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAuth()

  const expert = useAppSelector((state) => state.experts.expert)
  const status = useAppSelector((state) => state.experts.expertStatus)
  const error = useAppSelector((state) => state.experts.expertError)
  const posts = useAppSelector((state) => state.posts.userPosts)
  const followersCount = useAppSelector((state) => state.experts.followersCounts[Number(userId)] ?? 0)
  const followingIds = useAppSelector((state) => state.experts.followingIds)

  useEffect(() => {
    if (!userId) return
    const id = Number(userId)
    dispatch(fetchExpert(id))
    dispatch(fetchUserPosts(id))
    dispatch(fetchFollowersCount(id))
    dispatch(fetchMyFollowing())
  }, [dispatch, userId])

  if (status === 'loading') return <LoadingState label="Loading profile…" />
  if (status === 'error' || !expert) return <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchExpert(Number(userId)))} />

  return (
    <>
      <ProfileHero
        profile={expert}
        postsCount={posts.length}
        followersCount={followersCount}
        actions={
          expert.user.id === user?.user.id ? null : (
            <>
              <FollowButton
                userId={expert.user.id}
                isFollowing={followingIds.includes(expert.user.id)}
              />
              <MessageButton userId={expert.user.id} variant="secondary" size="md" />
            </>
          )
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