import { Link } from 'react-router-dom'
import { Avatar, Card } from '@/components/ui'
import { VerifiedBadge } from '@/components/ui'
import { UserProfile } from '@/types/domain'
import { FollowButton } from './FollowButton'
import '../experts.css'

interface ExpertCardProps {
  expert: UserProfile
  isFollowing: boolean
  onFollowChange: (following: boolean) => void
}

export function ExpertCard({ expert, isFollowing, onFollowChange }: ExpertCardProps) {
  const name =
    expert.profile.firstName && expert.profile.lastName
      ? `${expert.profile.firstName} ${expert.profile.lastName}`
      : expert.user.username

  return (
    <Card className="asa-expert-card" padded>
      <div className="asa-expert-card__body">
        <Link to={`/experts/${expert.user.id}`} className="asa-expert-card__avatar">
          <Avatar
            imageUrl={expert.profile.profileImageUrl}
            name={name}
            username={expert.user.username}
            size="lg"
          />
        </Link>
        <div className="asa-expert-card__info">
          <div className="asa-expert-card__name-row">
            <Link to={`/experts/${expert.user.id}`} className="asa-expert-card__name">
              {name}
            </Link>
            <VerifiedBadge profile={expert.profile} />
          </div>
          <span className="asa-expert-card__username">@{expert.user.username}</span>
          {expert.profile.location && (
            <span className="asa-expert-card__location">{expert.profile.location}</span>
          )}
          {expert.profile.bio && <p className="asa-expert-card__bio">{expert.profile.bio}</p>}
        </div>
      </div>
      <div className="asa-expert-card__actions">
        <FollowButton
          userId={expert.user.id}
          isFollowing={isFollowing}
          onFollowChange={onFollowChange}
        />
      </div>
    </Card>
  )
}