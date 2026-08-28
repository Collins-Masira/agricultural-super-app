import { useState } from 'react'
import { Button, Dropdown, Modal } from '@/components/ui'
import { MoreIcon } from '@/components/icons'
import { errorMessage, useAuth } from '@/features/auth/AuthContext'
import { deletePost } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

function canDeletePost(post, user, community) {
  if (!user) return false
  if (post.author.user.id === user.user.id) return true
  if (user.user.role === 'admin') return true
  if (post.communityId && community?.id === post.communityId && community.myRole === 'admin') return true
  return false
}

export function PostMenu({ post, onDeleted }) {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const community = useAppSelector((state) => state.communities.current)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState(null)
  const deleting = useAppSelector((state) => state.posts.deleteLoadingPostId === post.id)

  if (!canDeletePost(post, user, community)) return null

  async function handleConfirmDelete() {
    setError(null)
    try {
      await dispatch(deletePost(post.id)).unwrap()
      setConfirmOpen(false)
      onDeleted?.()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <>
      <Dropdown
        label="Post options"
        trigger={<MoreIcon width={18} height={18} />}
        items={[{ label: 'Delete', danger: true, onSelect: () => setConfirmOpen(true) }]}
      />
      <Modal open={confirmOpen} title="Delete post?" onClose={() => setConfirmOpen(false)}>
        <p>This action cannot be undone.</p>
        {error && <p className="asa-post-menu__error">{error}</p>}
        <div className="asa-post-menu__actions">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} loading={deleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
