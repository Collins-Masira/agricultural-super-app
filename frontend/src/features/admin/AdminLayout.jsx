import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import {
  CommunityIcon,
  HomeIcon,
  LogOutIcon,
  MessageIcon,
  SparkleIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons'
import './admin.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: <SparkleIcon width={18} height={18} />, end: true },
  { to: '/admin/users', label: 'Users', icon: <UsersIcon width={18} height={18} /> },
  { to: '/admin/posts', label: 'Content moderation', icon: <MessageIcon width={18} height={18} /> },
  { to: '/admin/communities', label: 'Communities', icon: <CommunityIcon width={18} height={18} /> },
]

/**
 * Distinct visual identity from the normal app shell (dark sidebar vs.
 * the light card-based main app) -- deliberately, so it always reads as
 * "you are in the administrative control center", not just another page
 * of the regular product.
 */
export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName =
    user?.profile.firstName && user?.profile.lastName
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.user.username

  return (
    <div className="asa-admin">
      <aside className="asa-admin__sidebar">
        <NavLink to="/" className="asa-admin__brand">
          Agri<span>Connect</span>
          <span className="asa-admin__brand-badge">Admin</span>
        </NavLink>

        <nav className="asa-admin__nav" aria-label="Admin">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `asa-admin__link ${isActive ? 'asa-admin__link--active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="asa-admin__footer">
          <NavLink to="/" className="asa-admin__link">
            <HomeIcon width={18} height={18} />
            Back to app
          </NavLink>
          <div className="asa-admin__profile">
            <Avatar imageUrl={user?.profile.profileImageUrl} name={displayName} username={user?.user.username} size="sm" />
            <div className="asa-admin__profile-info">
              <span className="asa-admin__profile-name">{displayName}</span>
              <span className="asa-admin__profile-role">
                <UserIcon width={12} height={12} /> Administrator
              </span>
            </div>
            <button
              type="button"
              className="asa-admin__logout"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              aria-label="Log out"
            >
              <LogOutIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="asa-admin__main">
        <Outlet />
      </main>
    </div>
  )
}
