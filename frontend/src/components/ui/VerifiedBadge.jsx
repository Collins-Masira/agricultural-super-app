import { Badge } from './Badge'

/** Shows the expert verification badge only when the profile is verified. */
export function VerifiedBadge({ profile }) {
  if (!profile.isVerified) return null
  return <Badge variant="verified">✓ Verified</Badge>
}