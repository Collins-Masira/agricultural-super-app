import { Button } from '@/components/ui'
import { toggleFollow } from '@/store/slices/expertsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function FollowButton({ userId, isFollowing }) {
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.experts.followLoadingUserId === userId)

  function handleToggle() {
    if (loading) return
    dispatch(toggleFollow(userId))
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      size="sm"
      onClick={handleToggle}
      loading={loading}
      aria-pressed={isFollowing}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}