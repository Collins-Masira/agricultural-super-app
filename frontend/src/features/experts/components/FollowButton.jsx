import { Button, Toast, useToast } from '@/components/ui'
import { toggleFollow } from '@/store/slices/expertsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export function FollowButton({ userId, isFollowing, name }) {
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.experts.followLoadingUserId === userId)
  const { message, showToast } = useToast()

  async function handleToggle() {
    if (loading) return
    const result = await dispatch(toggleFollow(userId))
    if (toggleFollow.fulfilled.match(result) && name) {
      const nowFollowing = result.payload.summary.followingIds.includes(userId)
      showToast(nowFollowing ? `Following ${name}` : `Unfollowed ${name}`)
    }
  }

  return (
    <>
      <Button
        variant={isFollowing ? 'secondary' : 'primary'}
        size="sm"
        onClick={handleToggle}
        loading={loading}
        aria-pressed={isFollowing}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      <Toast message={message} />
    </>
  )
}