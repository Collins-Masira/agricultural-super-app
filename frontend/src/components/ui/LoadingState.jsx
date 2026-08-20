import { Spinner } from './Spinner'
import './ui.css'

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="asa-state" role="status" aria-live="polite">
      <Spinner size="lg" />
      <p className="asa-state__description">{label}</p>
    </div>
  )
}