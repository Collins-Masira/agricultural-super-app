import { useState } from 'react'
import { Button } from './Button'
import { ShareIcon } from '@/components/icons'

export function ShareButton({ postId }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/posts/${postId}`

    if (navigator.share) {
      try {
        await navigator.share({ url })
      } catch {
        return
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      return
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleShare} className="asa-post__action">
      <ShareIcon width={18} height={18} />
      <span className="visually-hidden">Share</span>
      {copied && <span className="asa-share-feedback">Link copied</span>}
    </Button>
  )
}
