import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { bottomNavItems } from './nav'
import './layout.css'

export function BottomNav() {
  const { user } = useAuth()
  const isAdmin = user?.user.role === 'admin'
  const visibleItems = bottomNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <nav className="asa-bottom-nav" aria-label="Main">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `asa-bottom-nav__link ${isActive ? 'asa-bottom-nav__link--active' : ''}`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
