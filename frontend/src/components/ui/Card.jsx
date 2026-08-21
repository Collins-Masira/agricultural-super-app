import './ui.css'

export function Card({ padded = false, interactive = false, className = '', children, ...rest }) {
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