import './ui.css'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_STYLES = {
  sm: { width: '1rem', height: '1rem', borderWidth: '2px' },
  md: { width: '1.5rem', height: '1.5rem', borderWidth: '3px' },
  lg: { width: '2.5rem', height: '2.5rem', borderWidth: '4px' },
} as const

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <span className={`asa-spinner ${className}`} style={SIZE_STYLES[size]} role="status" aria-label="Loading" />
}