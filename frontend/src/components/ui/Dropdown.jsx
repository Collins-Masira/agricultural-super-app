import { useCallback, useEffect, useRef, useState } from 'react'
import './ui.css'

export function Dropdown({ trigger, items, label }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close()
      }
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

  return (
    <div className="asa-dropdown" ref={rootRef}>
      <button
        type="button"
        className="asa-btn asa-btn--ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        <ul className="asa-dropdown__menu" role="menu">
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                className={`asa-dropdown__item ${item.danger ? 'asa-dropdown__item--danger' : ''}`}
                onClick={() => {
                  item.onSelect()
                  close()
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}