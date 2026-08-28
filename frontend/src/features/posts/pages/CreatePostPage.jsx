import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ImageUploader, Input, PageHeader } from '@/components/ui'
import { createPost } from '@/store/slices/postsSlice'
import { fetchCommunity } from '@/store/slices/communitiesSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { errorMessage } from '@/features/auth/AuthContext'
import { PostContentEditor } from '../components/PostContentEditor'
import '../components/posts.css'

export function CreatePostPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const communityId = searchParams.get('communityId') ? Number(searchParams.get('communityId')) : null

  const community = useAppSelector((state) => state.communities.current)
  const communityStatus = useAppSelector((state) => state.communities.currentStatus)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [imagesUploading, setImagesUploading] = useState(false)
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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

  const pageTitle = communityId ? (canPostAnnouncement && isAnnouncement ? 'New announcement' : 'New community post') : 'Create a post'
  const pageSubtitle = communityId
    ? `Share something with ${activeCommunity?.name ?? 'this community'}.`
    : 'Share something with the farming community.'

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
          placeholder="What is your post about?"
        />

        <PostContentEditor content={content} onChange={setContent} error={fieldErrors.content} />

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

        <div className="asa-composer__submit-row">
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => navigate(communityId ? `/communities/${communityId}` : '/', { replace: true })}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={submitting || imagesUploading}>
            {imagesUploading ? 'Waiting for photos to finish uploading…' : 'Publish post'}
          </Button>
        </div>
      </form>
    </>
  )
}
