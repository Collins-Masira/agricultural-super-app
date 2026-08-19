import type { ReactNode } from 'react'
import './ui.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="asa-page-header">
      <div>
        <h1 className="asa-page-header__title">{title}</h1>
        {subtitle && <p className="asa-page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="asa-page-header__actions">{actions}</div>}
    </header>
  )
}