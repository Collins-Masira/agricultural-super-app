import { useState } from 'react'
import { Button, Dropdown, Input, Modal } from '@/components/ui'
import { MoreIcon } from '@/components/icons'
import { errorMessage, useAuth } from '@/features/auth/AuthContext'
import { deletePost, updatePost } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostContentEditor } from './PostContentEditor'
import { ReportPostModal } from './ReportPostModal'

function canModifyPost(post, user) {
  if (!user) return false
  return post.author.user.id === user.user.id || user.user.role === 'admin'
}

function canDeletePost(post, user, community) {
  if (canModifyPost(post, user)) return true
  if (post.communityId && community?.id === post.communityId && community.myRole === 'admin') return true
  return false
}

function EditPostModal({ post, open, onClose }) {
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const saving = useAppSelector((state) => state.posts.updateLoadingPostId === post.id)

  function handleClose() {
    setTitle(post.title)
    setContent(post.content)
    setFieldErrors({})
    setError(null)
    onClose()
  }

  async function handleSave() {
    const errors = {}
    if (!title.trim()) errors.title = 'Please add a title.'
    if (!content.trim()) errors.content = 'Please add some content.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setError(null)
    try {
      await dispatch(
        updatePost({ postId: post.id, title: title.trim(), content: content.trim() }),
      ).unwrap()
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Modal open={open} title="Edit post" onClose={handleClose}>
      <Input
        label="Title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title}
      />
      <PostContentEditor content={content} onChange={setContent} error={fieldErrors.content} rows={6} />
      {error && <p className="asa-post-menu__error">{error}</p>}
      <div className="asa-post-menu__actions">
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>
    </Modal>
  )
}

export function PostMenu({ post, onDeleted }) {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const community = useAppSelector((state) => state.communities.current)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [error, setError] = useState(null)
  const deleting = useAppSelector((state) => state.posts.deleteLoadingPostId === post.id)

  const canEdit = canModifyPost(post, user)
  const canDelete = canDeletePost(post, user, community)
  const canReport = Boolean(user) && post.author.user.id !== user.user.id
  if (!canEdit && !canDelete && !canReport) return null

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

  const items = []
  if (canEdit) items.push({ label: 'Edit', onSelect: () => setEditOpen(true) })
  if (canDelete) items.push({ label: 'Delete', danger: true, onSelect: () => setConfirmOpen(true) })
  if (canReport) items.push({ label: 'Report', onSelect: () => setReportOpen(true) })

  return (
    <>
      <Dropdown label="Post options" trigger={<MoreIcon width={18} height={18} />} items={items} />
      {canEdit && <EditPostModal post={post} open={editOpen} onClose={() => setEditOpen(false)} />}
      {canReport && <ReportPostModal postId={post.id} open={reportOpen} onClose={() => setReportOpen(false)} />}
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
