import { NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { headerNavItems } from './nav'
import './layout.css'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.user.role === 'admin'
  const visibleNavItems = headerNavItems.filter((item) => !item.adminOnly || isAdmin)

  const displayName =
    user?.profile.firstName && user?.profile.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.user.username

  return (
    <header className="asa-header">
      <NavLink to="/" className="asa-header__brand">
        Agri<span className="asa-header__brand-accent">Connect</span>
      </NavLink>

      <nav className="asa-header__nav" aria-label="Main">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `asa-header__link ${isActive ? 'asa-header__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="asa-header__actions">
        {user && (
          <Dropdown
            label="Account menu"
            trigger={
              <span className="asa-header__user">
                <Avatar
                  imageUrl={user.profile.profileImageUrl}
                  name={displayName}
                  username={user.user.username}
                  size="sm"
                />
              </span>
            }
            items={[
              {
                label: 'My profile',
                onSelect: () => navigate('/profile'),
              },
              {
                label: 'Log out',
                danger: true,
                onSelect: () => {
                  logout()
                  navigate('/login')
                },
              },
            ]}
          />
        )}
      </div>
    </header>
  )
}