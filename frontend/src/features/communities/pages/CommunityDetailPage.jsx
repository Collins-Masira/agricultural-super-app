import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Button, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { VerifiedBadge } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCommunity, toggleMembership } from '@/store/slices/communitiesSlice'
import '../communities.css'

export function CommunityDetailPage() {
  const { communityId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAuth()

  const community = useAppSelector((state) => state.communities.current)
  const status = useAppSelector((state) => state.communities.currentStatus)
  const error = useAppSelector((state) => state.communities.currentError)
  const loading = useAppSelector((state) => state.communities.membershipLoadingId === Number(communityId))

  useEffect(() => {
    if (communityId) dispatch(fetchCommunity(Number(communityId)))
  }, [dispatch, communityId])

  if (status === 'loading') return <LoadingState label="Loading community…" />
  if (status === 'error' || !community) {
    return <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchCommunity(Number(communityId)))} />
  }

  const isMember = community.members.some((m) => m.userId === user?.user.id)
  const isCreator = community.createdBy === user?.user.id

  function handleToggle() {
    if (loading) return
    dispatch(toggleMembership({ communityId: community.id, userId: user.user.id }))
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/communities')}>
        &larr; Back to communities
      </Button>

      <section className="asa-community-hero">
        {community.imageUrl && <img className="asa-community-hero__image" src={community.imageUrl} alt="" />}
        <div className="asa-community-hero__header">
          <div>
            <h1 className="asa-community-hero__name">{community.name}</h1>
            <p className="asa-community-hero__meta">
              {community.members.length} member{community.members.length === 1 ? '' : 's'} · created by{' '}
              {community.creator?.profile.firstName || community.creator?.user.username}
            </p>
          </div>
          {!isCreator && (
            <Button variant={isMember ? 'secondary' : 'primary'} onClick={handleToggle} loading={loading} aria-pressed={isMember}>
              {isMember ? 'Leave community' : 'Join community'}
            </Button>
          )}
        </div>
        {community.description && <p>{community.description}</p>}
      </section>

      <h2 className="asa-profile-section-title">Members</h2>
      {community.members.length === 0 ? (
        <EmptyState title="No members yet" icon="👥" />
      ) : (
        <ul className="asa-community-members">
          {community.members.map((membership) => {
            const member = membership.member
            const name =
              member?.profile.firstName && member?.profile.lastName
                ? `${member.profile.firstName} ${member.profile.lastName}`
                : member?.user.username
            return (
              <li key={membership.id} className="asa-community-member">
                <Avatar imageUrl={member?.profile.profileImageUrl} name={name} username={member?.user.username} size="sm" />
                <span className="asa-community-member__name">{name}</span>
                <VerifiedBadge profile={member?.profile ?? { isVerified: false }} />
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
