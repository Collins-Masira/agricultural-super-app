import type { HTMLAttributes, ReactNode } from 'react'
import './ui.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  interactive?: boolean
  children: ReactNode
}

export function Card({ padded = false, interactive = false, className = '', children, ...rest }: CardProps) {
  const classes = [
    'asa-card',
    padded ? 'asa-card--padded' : '',
    interactive ? 'asa-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}