import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from './Spinner'
import './ui.css'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
  /** Render the button as a react-router Link when provided. */
  to?: string
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block = false, loading = false, to, className = '', children, disabled, ...rest },
  ref,
) {
  const classes = [
    'asa-btn',
    `asa-btn--${variant}`,
    `asa-btn--${size}`,
    block ? 'asa-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link className={classes} to={to} aria-disabled={disabled || loading}>
        {loading ? <Spinner size="sm" className="asa-btn__spinner" /> : null}
        {children}
      </Link>
    )
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner size="sm" className="asa-btn__spinner" /> : null}
      {children}
    </button>
  )
})