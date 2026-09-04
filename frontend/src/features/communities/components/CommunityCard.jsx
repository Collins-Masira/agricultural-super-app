import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { UsersIcon } from '@/components/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleCommunityFollow, toggleMembership } from '@/store/slices/communitiesSlice'
import '../communities.css'

export function CommunityCard({ community }) {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.communities.membershipLoadingId === community.id)
  const followLoading = useAppSelector((state) => state.communities.followLoadingId === community.id)

  const isMember = community.members.some((m) => m.userId === user?.user.id)
  const isCreator = community.createdBy === user?.user.id
  const isFollowing = community.isFollowing ?? false

  function handleToggle() {
    if (loading) return
    dispatch(toggleMembership({ communityId: community.id, userId: user.user.id }))
  }

  function handleFollowToggle() {
    if (followLoading) return
    dispatch(toggleCommunityFollow({ communityId: community.id, userId: user.user.id }))
  }

  return (
    <Card className="asa-community-card">
      {community.imageUrl ? (
        <img className="asa-community-card__image" src={community.imageUrl} alt="" loading="lazy" />
      ) : (
        <div className="asa-community-card__image asa-community-card__image--placeholder" aria-hidden="true">
          <UsersIcon width={28} height={28} />
        </div>
      )}
      <div className="asa-community-card__body">
        <Link to={`/communities/${community.id}`} className="asa-community-card__name">
          {community.name}
        </Link>
        {community.description && <p className="asa-community-card__description">{community.description}</p>}
        <div className="asa-community-card__footer">
          <span className="asa-community-card__meta">
            {community.members.length} member{community.members.length === 1 ? '' : 's'}
          </span>
          <div className="asa-community-card__actions">
            {!isCreator && (
              <>
                <Button
                  variant={isFollowing ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={handleFollowToggle}
                  loading={followLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button
                  variant={isMember ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleToggle}
                  loading={loading}
                  aria-pressed={isMember}
                >
                  {isMember ? 'Joined' : 'Join'}
                </Button>
              </>
            )}
            {isCreator && <span className="asa-community-card__meta">Your community</span>}
          </div>
        </div>
      </div>
    </Card>
  )
}
