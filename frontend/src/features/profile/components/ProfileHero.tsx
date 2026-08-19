import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui'
import { VerifiedBadge } from '@/components/ui'
import { UserProfile } from '@/types/domain'
import '@/features/experts/experts.css'

interface ProfileHeroProps {
  profile: UserProfile
  followersCount?: number
  actions?: ReactNode
}

export function ProfileHero({ profile, followersCount, actions }: ProfileHeroProps) {
  const name =
    profile.profile.firstName && profile.profile.lastName
      ? `${profile.profile.firstName} ${profile.profile.lastName}`
      : profile.user.username

  return (
    <section className="asa-profile-hero">
      <div className="asa-profile-hero__row">
        <Avatar
          imageUrl={profile.profile.profileImageUrl}
          name={name}
          username={profile.user.username}
          size="xl"
        />
        <div>
          <div className="asa-profile-hero__name-row">
            <h1 className="asa-profile-hero__name">{name}</h1>
            <VerifiedBadge profile={profile.profile} />
          </div>
          <span className="asa-profile-hero__username">@{profile.user.username}</span>
          {profile.profile.location && (
            <span className="asa-profile-hero__location">{profile.profile.location}</span>
          )}
          {profile.profile.bio && <p className="asa-profile-hero__bio">{profile.profile.bio}</p>}
          <div className="asa-profile-hero__stats">
            {typeof followersCount === 'number' && (
              <span>
                <span className="asa-profile-hero__stat">{followersCount}</span> followers
              </span>
            )}
            <span>
              <span className="asa-profile-hero__stat">{profile.user.role}</span>
            </span>
          </div>
        </div>
      </div>
      {actions && <div className="asa-profile-hero__actions">{actions}</div>}
    </section>
  )
}