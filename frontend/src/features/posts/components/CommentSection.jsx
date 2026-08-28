import { useState } from 'react'
import { Avatar, Button, Modal, Textarea, VerifiedBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { addComment } from '@/store/slices/postsSlice'
import { useAppDispatch } from '@/store/hooks'
import { errorMessage } from '@/features/auth/AuthContext'
import './posts.css'

export function CommentSection({ post }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await dispatch(addComment({ postId: post.id, content })).unwrap()
      setContent('')
      setOpen(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="asa-comments" aria-label="Comments">
        <h3 className="asa-comments__title">Comments ({post.comments.length})</h3>
        {post.comments.length === 0 ? (
          <p className="asa-comments__empty">No comments yet — be the first to respond.</p>
        ) : (
          <ul className="asa-comments__list">
            {post.comments.map((comment) => {
              const name =
                comment.author.profile.firstName && comment.author.profile.lastName
                  ? `${comment.author.profile.firstName} ${comment.author.profile.lastName}`
                  : comment.author.user.username
              return (
                <li key={comment.id} className="asa-comment">
                  <Avatar
                    imageUrl={comment.author.profile.profileImageUrl}
                    name={name}
                    username={comment.author.user.username}
                    size="sm"
                  />
                  <div className="asa-comment__body">
                    <div className="asa-comment__meta">
                      <strong>{name}</strong>
                      <VerifiedBadge profile={comment.author.profile} />
                      <span className="asa-comment__time">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="asa-comment__content">{comment.content}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {post.commentsOpen === false ? (
          <p className="asa-comments__closed">🔒 Comments are closed by the community admin.</p>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Add a comment
          </Button>
        )}
      </section>

      <Modal open={open} title="Add a comment" onClose={() => setOpen(false)}>
        <Textarea
          label="Your comment"
          name="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={error ?? undefined}
          placeholder="Share your thoughts…"
          autoFocus
        />
        <Button onClick={handleSubmit} loading={submitting} disabled={!content.trim()}>
          Post comment
        </Button>
      </Modal>
    </>
  )
}
