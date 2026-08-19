import type { Profile } from '@/types/domain'
import { Badge } from './Badge'

interface VerifiedBadgeProps {
  profile: Pick<Profile, 'isVerified'>
}

/** Shows the expert verification badge only when the profile is verified. */
export function VerifiedBadge({ profile }: VerifiedBadgeProps) {
  if (!profile.isVerified) return null
  return <Badge variant="verified">✓ Verified</Badge>
}