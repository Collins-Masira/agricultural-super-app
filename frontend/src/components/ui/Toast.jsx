import { useCallback, useRef, useState } from 'react'
import './ui.css'

/** Presentational toast bubble. Render this once per component that calls `useToast`. */
export function Toast({ message }) {
  if (!message) return null
  return (
    <div className="asa-toast" role="status">
      {message}
    </div>
  )
}

/** Local (non-global) toast state -- pairs with `<Toast message={message} />`.
 * Kept per-component (no app-wide provider) to match this codebase's existing
 * pattern of self-contained feedback (see ShareButton's old inline copy-link
 * message), just reusable and with a fade transition. */
export function useToast(duration = 2000) {
  const [message, setMessage] = useState(null)
  const timeoutRef = useRef(null)

  const showToast = useCallback(
    (text) => {
      clearTimeout(timeoutRef.current)
      setMessage(text)
      timeoutRef.current = setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )

  return { message, showToast }
}
