import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown } from '@/components/ui'
import { HeartIcon, MessageIcon, SearchIcon } from '@/components/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchUnreadCount } from '@/store/slices/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import './layout.css'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const isAdmin = user?.user.role === 'admin'

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

      <div className="asa-header__actions">
        {user && (
          <NavLink to="/explore" className="asa-header__search" aria-label="Explore and search">
            <SearchIcon width={20} height={20} />
          </NavLink>
        )}
        {user && (
          <NavLink to="/messages" className="asa-header__search" aria-label="Messages">
            <MessageIcon width={20} height={20} />
          </NavLink>
        )}
        {user && (
          <NavLink to="/notifications" className="asa-header__search" aria-label="Notifications">
            <HeartIcon width={20} height={20} />
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
                label: 'Saved',
                onSelect: () => navigate('/saved'),
              },
              {
                label: 'Communities',
                onSelect: () => navigate('/communities'),
              },
              {
                label: 'FarmClips',
                onSelect: () => navigate('/farmclips'),
              },
              ...(isAdmin
                ? [{ label: 'Admin dashboard', onSelect: () => navigate('/admin') }]
                : []),
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