import { Button } from './Button'
import './ui.css'

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
}) {
  return (
    <div className="asa-state asa-state--error" role="alert">
      <span className="asa-state__icon" aria-hidden="true">
        ⚠️
      </span>
      <h3 className="asa-state__title">{title}</h3>
      <p className="asa-state__description">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}