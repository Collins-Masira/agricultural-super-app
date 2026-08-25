import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import './ui.css'

export function Modal({ open, title, onClose, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="asa-modal__overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="asa-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="asa-modal__header">
          <h2 className="asa-modal__title">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            &times;
          </Button>
        </div>
        <div className="asa-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}