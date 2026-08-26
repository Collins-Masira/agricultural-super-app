import {
  CommunityIcon,
  HomeIcon,
  MessageIcon,
  PlusIcon,
  ShieldIcon,
  SparkleIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons'

/** Top-level navigation for the app shell. `adminOnly` items are filtered
 * out for non-admins in Header.jsx/BottomNav.jsx -- this is the UX layer
 * only; the real access control is server-side (admin_required). */
export const headerNavItems = [
  { to: '/', label: 'Feed', icon: <HomeIcon /> },
  { to: '/experts', label: 'Experts', icon: <UsersIcon /> },
  { to: '/communities', label: 'Communities', icon: <CommunityIcon /> },
  { to: '/messages', label: 'Messages', icon: <MessageIcon /> },
  { to: '/assistant', label: 'Assistant', icon: <SparkleIcon /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon /> },
  { to: '/admin', label: 'Admin', icon: <ShieldIcon />, adminOnly: true },
]

/**
 * Bottom navigation shown on small screens (mobile-first per design).
 * The header nav (`headerNavItems`) is desktop-only (see layout.css), so
 * every destination has to be reachable from here on mobile too -- there
 * is no separate "more" menu.
 */
export const bottomNavItems = [
  { to: '/', label: 'Feed', icon: <HomeIcon /> },
  { to: '/create', label: 'Create', icon: <PlusIcon /> },
  { to: '/experts', label: 'Experts', icon: <UsersIcon /> },
  { to: '/communities', label: 'Groups', icon: <CommunityIcon /> },
  { to: '/messages', label: 'Messages', icon: <MessageIcon /> },
  { to: '/assistant', label: 'AI', icon: <SparkleIcon /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon /> },
  { to: '/admin', label: 'Admin', icon: <ShieldIcon />, adminOnly: true },
]
