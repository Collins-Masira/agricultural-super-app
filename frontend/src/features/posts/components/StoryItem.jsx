import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { PlusIcon } from '@/components/icons'

/** A single circular avatar tile in the home feed's StoryBar. Renders as a
 * link when `to` is given (the "Your story" add tile, into the real
 * composer) or as a button when `onClick` is given (opens the StoryViewer
 * over that person's real recent posts). */
export function StoryItem({ to, onClick, imageUrl, name, username, label, isAdd = false }) {
  const content = (
    <>
      <span className={`asa-story-item__ring ${isAdd ? 'asa-story-item__ring--add' : ''}`}>
        <Avatar imageUrl={imageUrl} name={name} username={username} size="lg" />
        {isAdd && (
          <span className="asa-story-item__plus" aria-hidden="true">
            <PlusIcon width={12} height={12} />
          </span>
        )}
      </span>
      <span className="asa-story-item__label">{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="asa-story-item">
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className="asa-story-item" onClick={onClick}>
      {content}
    </button>
  )
}
