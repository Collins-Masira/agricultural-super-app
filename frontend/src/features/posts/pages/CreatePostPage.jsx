import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, PageHeader, Textarea } from '@/components/ui'
import { createPost } from '@/store/slices/postsSlice'
import { useAppDispatch } from '@/store/hooks'
import { errorMessage } from '@/features/auth/AuthContext'
import '../components/posts.css'

export function CreatePostPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function addImage() {
    const trimmed = imageUrl.trim()
    if (!trimmed) return
    if (imageUrls.includes(trimmed)) return
    setImageUrls((prev) => [...prev, trimmed])
    setImageUrl('')
  }

  function removeImage(url) {
    setImageUrls((prev) => prev.filter((u) => u !== url))
  }

  function validate() {
    const errors = {}
    if (!title.trim()) errors.title = 'Please add a title.'
    if (!content.trim()) errors.content = 'Please add some content.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate() || submitting) return
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

        <div className="asa-post-create__images">
          <label className="asa-field__label">Images (optional)</label>
          <div className="asa-post-create__image-input">
            <Input
              label=""
              name="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste an image URL"
              aria-label="Image URL"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addImage} disabled={!imageUrl.trim()}>
              Add
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <ul className="asa-post-create__image-list">
              {imageUrls.map((url) => (
                <li key={url} className="asa-post-create__image-item">
                  <img src={url} alt="" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(url)} aria-label="Remove image">
                    &times;
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {formError && <p className="asa-form-error" role="alert">{formError}</p>}

        <Button type="submit" loading={submitting} disabled={submitting}>
          Publish post
        </Button>
      </form>
    </>
  )
}