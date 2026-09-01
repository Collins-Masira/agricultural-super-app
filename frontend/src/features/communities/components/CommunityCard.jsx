import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { UsersIcon } from '@/components/icons'
import { formatCount } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleMembership } from '@/store/slices/communitiesSlice'
import '../communities.css'

export function CommunityCard({ community }) {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.communities.membershipLoadingId === community.id)
  const [imageFailed, setImageFailed] = useState(false)

  const isMember = community.members.some((m) => m.userId === user?.user.id)
  const isCreator = community.createdBy === user?.user.id

  function handleToggle() {
    if (loading) return
    dispatch(toggleMembership({ communityId: community.id, userId: user.user.id }))
  }

  return (
    <Card className="asa-community-card">
      {community.imageUrl && !imageFailed ? (
        <img
          className="asa-community-card__image"
          src={community.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
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
            {formatCount(community.members.length)} member{community.members.length === 1 ? '' : 's'}
          </span>
          {isCreator ? (
            <span className="asa-community-card__meta">Your community</span>
          ) : (
            <Button
              variant={isMember ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleToggle}
              loading={loading}
              aria-pressed={isMember}
            >
              {isMember ? 'Joined' : 'Join'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
