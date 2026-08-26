import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ImageUploader, Input, PageHeader, Textarea } from '@/components/ui'
import { createPost } from '@/store/slices/postsSlice'
import { useAppDispatch } from '@/store/hooks'
import { errorMessage } from '@/features/auth/AuthContext'
import '../components/posts.css'

export function CreatePostPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [imagesUploading, setImagesUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
        createPost({ title: title.trim(), content: content.trim(), imageUrls }),
      ).unwrap()
      navigate(`/posts/${post.id}`, { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="New post" subtitle="Share knowledge with the community." />
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          placeholder="e.g. Preparing your soil before the rains"
        />
        <Textarea
          label="Content"
          name="content"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={fieldErrors.content}
          placeholder="What would you like to share?"
        />

        <ImageUploader
          label="Photos (optional)"
          multiple
          maxFiles={6}
          onChange={setImageUrls}
          onBusyChange={setImagesUploading}
        />

        {formError && <p className="asa-form-error" role="alert">{formError}</p>}

        <Button type="submit" loading={submitting} disabled={submitting || imagesUploading}>
          {imagesUploading ? 'Waiting for photos to finish uploading…' : 'Publish post'}
        </Button>
      </form>
    </>
  )
}
