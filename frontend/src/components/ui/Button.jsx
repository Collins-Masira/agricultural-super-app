import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from './Spinner'
import './ui.css'

export const Button = forwardRef(function Button(
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