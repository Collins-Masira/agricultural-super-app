import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { sidebarNavItems } from './nav'
import { CreateButton } from './CreateButton'
import './layout.css'

export function Sidebar() {
  const { user } = useAuth()
  const isAdmin = user?.user.role === 'admin'
  const visibleItems = sidebarNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="asa-sidebar" aria-label="Primary">
      <nav className="asa-sidebar__nav">
        {visibleItems.map((item) =>
          item.to === '/create' ? (
            <CreateButton key={item.to} variant="sidebar" />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `asa-sidebar__link ${isActive ? 'asa-sidebar__link--active' : ''}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>
    </aside>
  )
}
