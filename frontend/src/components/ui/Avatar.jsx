import { useState } from 'react'
import { initials } from '@/lib/format'
import './ui.css'

export function Avatar({ imageUrl, name, username = '', size = 'md', alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  const classes = ['asa-avatar', `asa-avatar--${size}`, className].filter(Boolean).join(' ')

  if (imageUrl && !failed) {
    return (
      <span className={classes} role="img" aria-label={alt ?? name ?? username}>
        <img src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
      </span>
    )
  }

  return (
    <span className={classes} aria-hidden="true">
      {initials(name?.split(' ')[0], name?.split(' ')[1], username)}
    </span>
  )
}
