import './ui.css'

export function Badge({ variant = 'default', children, className = '' }) {
  const classes = ['asa-badge', `asa-badge--${variant}`, className].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}