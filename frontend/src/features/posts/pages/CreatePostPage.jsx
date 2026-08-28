import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ImageUploader, Input, PageHeader, PostContent, Tabs, Textarea } from '@/components/ui'
import { createPost } from '@/store/slices/postsSlice'
import { fetchCommunity } from '@/store/slices/communitiesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { errorMessage } from '@/features/auth/AuthContext'
import '../components/posts.css'

const CONTENT_TABS = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
]

function wrapSelection(content, textarea, prefix, suffix, placeholder) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = content.slice(0, start)
  const selected = content.slice(start, end) || placeholder
  const after = content.slice(end)
  return {
    next: `${before}${prefix}${selected}${suffix}${after}`,
    selectionStart: before.length + prefix.length,
    selectionEnd: before.length + prefix.length + selected.length,
  }
}

function prefixSelectedLines(content, textarea, placeholder, makePrefix) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = content.slice(0, start)
  const selected = content.slice(start, end) || placeholder
  const after = content.slice(end)
  const prefixed = selected.split('\n').map((line, index) => `${makePrefix(index)}${line}`).join('\n')
  return {
    next: `${before}${prefixed}${after}`,
    selectionStart: before.length,
    selectionEnd: before.length + prefixed.length,
  }
}

export function CreatePostPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const communityId = searchParams.get('communityId') ? Number(searchParams.get('communityId')) : null

  const community = useAppSelector((state) => state.communities.current)
  const communityStatus = useAppSelector((state) => state.communities.currentStatus)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentMode, setContentMode] = useState('write')
  const [imageUrls, setImageUrls] = useState([])
  const [imagesUploading, setImagesUploading] = useState(false)
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)

  function applyFormatting(transform) {
    const textarea = textareaRef.current
    if (!textarea) return
    const result = transform(content, textarea)
    setContent(result.next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  useEffect(() => {
    if (communityId) dispatch(fetchCommunity(communityId))
  }, [dispatch, communityId])

  const activeCommunity = communityId && community?.id === communityId ? community : null
  const canPostAnnouncement = Boolean(activeCommunity && activeCommunity.myRole === 'admin')

  function validate() {
    const errors = {}
    if (!title.trim()) errors.title = 'Please add a title.'
    if (!content.trim()) errors.content = 'Please add some content.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate() || submitting || imagesUploading) return
    setSubmitting(true)
    setFormError(null)
    try {
      const post = await dispatch(
        createPost({
          title: title.trim(),
          content: content.trim(),
          imageUrls,
          communityId,
          isAnnouncement: canPostAnnouncement && isAnnouncement,
        }),
      ).unwrap()
      navigate(communityId ? `/communities/${communityId}` : `/posts/${post.id}`, { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
      setSubmitting(false)
    }
  }

  const pageTitle = communityId ? (canPostAnnouncement && isAnnouncement ? 'New announcement' : 'New community post') : 'New post'
  const pageSubtitle = communityId
    ? `Share knowledge with ${activeCommunity?.name ?? 'this community'}.`
    : 'Share knowledge with the community.'

  return (
    <>
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          placeholder="e.g. Preparing your soil before the rains"
        />
        <div className="asa-composer__content">
          <Tabs items={CONTENT_TABS} value={contentMode} onChange={setContentMode} className="asa-composer__tabs" />

          {contentMode === 'write' ? (
            <>
              <div className="asa-composer-toolbar" role="toolbar" aria-label="Formatting">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Bold"
                  onClick={() => applyFormatting((c, t) => wrapSelection(c, t, '**', '**', 'bold text'))}
                >
                  B
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Italic"
                  onClick={() => applyFormatting((c, t) => wrapSelection(c, t, '*', '*', 'italic text'))}
                >
                  I
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Bullet list"
                  onClick={() =>
                    applyFormatting((c, t) => prefixSelectedLines(c, t, 'List item', () => '- '))
                  }
                >
                  • List
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Numbered list"
                  onClick={() =>
                    applyFormatting((c, t) => prefixSelectedLines(c, t, 'List item', (i) => `${i + 1}. `))
                  }
                >
                  1. List
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Link"
                  onClick={() =>
                    applyFormatting((c, t) => wrapSelection(c, t, '[', '](https://example.com)', 'link text'))
                  }
                >
                  🔗
                </Button>
              </div>
              <Textarea
                ref={textareaRef}
                label="Content"
                name="content"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                error={fieldErrors.content}
                placeholder="What would you like to share? Markdown is supported: **bold**, *italic*, - lists, [links](https://…)."
              />
            </>
          ) : (
            <div className="asa-field">
              <span className="asa-field__label">Content preview</span>
              <div className="asa-composer__preview">
                {content.trim() ? (
                  <PostContent content={content} />
                ) : (
                  <p className="asa-field__hint">Nothing to preview yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <ImageUploader
          label="Photos (optional)"
          multiple
          maxFiles={6}
          onChange={setImageUrls}
          onBusyChange={setImagesUploading}
        />

        {communityId && communityStatus === 'ready' && canPostAnnouncement && (
          <label className="asa-quick-composer__announcement">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(event) => setIsAnnouncement(event.target.checked)}
            />
            <span>📢 Post as community announcement</span>
          </label>
        )}

        {formError && <p className="asa-form-error" role="alert">{formError}</p>}

        <Button type="submit" loading={submitting} disabled={submitting || imagesUploading}>
          {imagesUploading ? 'Waiting for photos to finish uploading…' : 'Publish post'}
        </Button>
      </form>
    </>
  )
}
