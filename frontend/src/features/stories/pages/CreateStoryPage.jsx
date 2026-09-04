import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ImageUploader, Toast, useToast } from '@/components/ui'
import { ClapperIcon, LeafIcon } from '@/components/icons'
import '../stories.css'

export function CreateStoryPage() {
  const navigate = useNavigate()
  const [imageUrls, setImageUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const { message, showToast } = useToast(3200)

  const previewUrl = imageUrls[0]

  function handleShare() {
    showToast("Stories aren't saved yet -- this preview isn't backed by the server.")
  }

  return (
    <div className="asa-story-composer">
      <header className="asa-story-composer__header">
        <button type="button" className="asa-story-composer__close" onClick={() => navigate(-1)} aria-label="Close">
          ✕
        </button>
        <h1>Create story</h1>
        <span />
      </header>

      <div className="asa-story-composer__preview">
        {previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : (
          <div className="asa-story-composer__placeholder">
            <LeafIcon width={32} height={32} />
            <p>Your story preview will appear here</p>
          </div>
        )}
        {caption.trim() && <p className="asa-story-composer__caption-overlay">{caption}</p>}
      </div>

      <div className="asa-story-composer__uploader">
        <ImageUploader multiple={false} maxFiles={1} onChange={setImageUrls} onBusyChange={setUploading} />
        <button type="button" className="asa-social-composer__attachment" onClick={() => showToast('Video stories are not supported yet.')}>
          <ClapperIcon width={18} height={18} />
          Add video
        </button>
      </div>

      <input
        type="text"
        className="asa-story-composer__caption-input"
        placeholder="Add a short caption…"
        aria-label="Story caption"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        maxLength={120}
      />

      <div className="asa-composer__submit-row">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="button" onClick={handleShare} disabled={!previewUrl || uploading}>
          Share story
        </Button>
      </div>

      <Toast message={message} />
    </div>
  )
}
