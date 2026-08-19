import { useState } from 'react'
import { Button } from '@/components/ui'
import { expertsService } from '@/services'

interface FollowButtonProps {
  userId: number
  isFollowing: boolean
  onFollowChange: (following: boolean) => void
}

export function FollowButton({ userId, isFollowing, onFollowChange }: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (loading) return
    setLoading(true)
    try {
      const summary = await expertsService.toggleFollow(userId)
      const nowFollowing = summary.followingIds.includes(userId)
      setFollowing(nowFollowing)
      onFollowChange(nowFollowing)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      onClick={handleToggle}
      loading={loading}
      aria-pressed={following}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}