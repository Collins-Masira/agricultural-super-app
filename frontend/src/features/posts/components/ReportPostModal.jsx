import { useState } from 'react'
import { Button, Modal, Textarea } from '@/components/ui'
import { errorMessage } from '@/features/auth/AuthContext'
import { postsService } from '@/services'

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'scam', label: 'Scam' },
  { value: 'misleading', label: 'Misleading information' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
]

export function ReportPostModal({ postId, open, onClose }) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  function handleClose() {
    setReason('spam')
    setDetails('')
    setError(null)
    setDone(false)
    onClose()
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await postsService.reportPost(postId, reason, details.trim())
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} title="Report post" onClose={handleClose}>
      {done ? (
        <>
          <p>Thanks for letting us know. Our moderators will review this post.</p>
          <div className="asa-post-menu__actions">
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </>
      ) : (
        <>
          <p>Why are you reporting this post?</p>
          <div className="asa-report-modal__reasons" role="radiogroup" aria-label="Reason">
            {REASONS.map((option) => (
              <label key={option.value} className="asa-report-modal__reason">
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <Textarea
            label="Additional details (optional)"
            name="report-details"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything else moderators should know?"
          />
          {error && <p className="asa-post-menu__error">{error}</p>}
          <div className="asa-post-menu__actions">
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={submitting}>
              Submit report
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
