import { useCallback, useEffect, useRef, useState } from 'react'
import './ui.css'

export const REACTIONS = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'funny', emoji: '😂', label: 'Funny' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'fire', emoji: '🔥', label: 'Useful' },
]

const REACTIONS_BY_TYPE = Object.fromEntries(REACTIONS.map((reaction) => [reaction.type, reaction]))

export function ReactionPicker({ reactionCounts = {}, myReaction, onReact, onRemove, loading = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) close()
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, close])

  const totalCount = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)
  const current = myReaction ? REACTIONS_BY_TYPE[myReaction] : null

  function handlePick(type) {
    close()
    if (loading) return
    if (type === myReaction) {
      onRemove()
    } else {
      onReact(type)
    }
  }

  return (
    <div className="asa-reaction-picker" ref={rootRef}>
      <button
        type="button"
        className={`asa-btn asa-btn--ghost asa-btn--sm asa-post__action ${current ? 'asa-reaction-picker__trigger--active' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={loading}
      >
        <span aria-hidden="true">{current ? current.emoji : '🤍'}</span>
        <span>{totalCount}</span>
        <span className="visually-hidden">{current ? `Your reaction: ${current.label}` : 'React to this post'}</span>
      </button>

      {open && (
        <ul className="asa-reaction-picker__menu" role="menu">
          {REACTIONS.map((reaction) => (
            <li key={reaction.type} role="none">
              <button
                type="button"
                role="menuitem"
                className={`asa-reaction-picker__option ${myReaction === reaction.type ? 'asa-reaction-picker__option--active' : ''}`}
                onClick={() => handlePick(reaction.type)}
                aria-label={reaction.label}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
