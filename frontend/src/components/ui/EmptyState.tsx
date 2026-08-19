import type { ReactNode } from 'react'
import './ui.css'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon = '🌱', action }: EmptyStateProps) {
  return (
    <div className="asa-state">
      <span className="asa-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h3 className="asa-state__title">{title}</h3>
      {description && <p className="asa-state__description">{description}</p>}
      {action}
    </div>
  )
}