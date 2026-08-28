import { useState } from 'react'
import { Button, Textarea } from '@/components/ui'
import { errorMessage } from '@/features/auth/AuthContext'
import { createPost } from '@/store/slices/postsSlice'
import { useAppDispatch } from '@/store/hooks'
import './posts.css'

function deriveTitle(content) {
  const trimmed = content.trim()
  if (trimmed.length <= 60) return trimmed
  return `${trimmed.slice(0, 57).trimEnd()}...`
}

export function QuickComposer({ communityId, placeholder = "What's on your mind?", allowAnnouncement = false, onPosted }) {
  const dispatch = useAppDispatch()
  const [content, setContent] = useState('')
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const post = await dispatch(
        createPost({ title: deriveTitle(trimmed), content: trimmed, communityId, isAnnouncement }),
      ).unwrap()
      setContent('')
      setIsAnnouncement(false)
      onPosted?.(post)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="asa-quick-composer" onSubmit={handleSubmit}>
      <Textarea
        label=""
        name="quick-post"
        rows={2}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {allowAnnouncement && (
        <label className="asa-quick-composer__announcement">
          <input
            type="checkbox"
            checked={isAnnouncement}
            onChange={(event) => setIsAnnouncement(event.target.checked)}
          />
          <span>📢 Post as announcement</span>
        </label>
      )}
      {error && (
        <p className="asa-form-error" role="alert">
          {error}
        </p>
      )}
      <div className="asa-quick-composer__actions">
        <Button
          variant="ghost"
          size="sm"
          to={communityId ? `/create?communityId=${communityId}` : '/create'}
        >
          Add photos
        </Button>
        <Button type="submit" size="sm" loading={submitting} disabled={!content.trim()}>
          Post
        </Button>
      </div>
    </form>
  )
}
