import { Spinner } from './Spinner'
import './ui.css'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="asa-state" role="status" aria-live="polite">
      <Spinner size="lg" />
      <p className="asa-state__description">{label}</p>
    </div>
  )
}