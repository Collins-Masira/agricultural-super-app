import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import './auth.css'

/** Centered card layout shared by login/registration. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="asa-auth">
      <div className="asa-auth__brand">
        <Link to="/" className="asa-auth__brand-link">
          Agri<span>Connect</span>
        </Link>
        <p className="asa-auth__tagline">
          Connect with farmers, experts and agricultural communities.
        </p>
      </div>
      <Card className="asa-auth__card" padded>
        <h1 className="asa-auth__title">{title}</h1>
        {subtitle && <p className="asa-auth__subtitle">{subtitle}</p>}
        {children}
      </Card>
      <p className="asa-auth__footer">{footer}</p>
    </div>
  )
}