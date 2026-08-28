import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown } from '@/components/ui'
import { BellIcon, SearchIcon } from '@/components/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchUnreadCount } from '@/store/slices/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { headerNavItems } from './nav'
import './layout.css'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const isAdmin = user?.user.role === 'admin'
  const visibleNavItems = headerNavItems.filter((item) => !item.adminOnly || isAdmin)

  useEffect(() => {
    if (user) dispatch(fetchUnreadCount())
  }, [dispatch, user])

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
          <NavLink to="/search" className="asa-header__search" aria-label="Search users">
            <SearchIcon width={20} height={20} />
          </NavLink>
        )}
        {user && (
          <NavLink to="/notifications" className="asa-header__search" aria-label="Notifications">
            <BellIcon width={20} height={20} />
            {unreadCount > 0 && (
              <span className="asa-header__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </NavLink>
        )}
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