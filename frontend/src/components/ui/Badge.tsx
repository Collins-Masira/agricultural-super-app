import type { ReactNode } from 'react'
import './ui.css'

export type BadgeVariant = 'default' | 'verified' | 'success' | 'danger' | 'warning' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const classes = ['asa-badge', `asa-badge--${variant}`, className].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}