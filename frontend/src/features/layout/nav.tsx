import { HomeIcon, PlusIcon, UserIcon, UsersIcon } from '@/components/icons'
import type { ReactElement } from 'react'

interface NavItem {
  to: string
  label: string
  icon: ReactElement
}

/** Top-level navigation for the app shell. */
export const headerNavItems: NavItem[] = [
  { to: '/', label: 'Feed', icon: <HomeIcon /> },
  { to: '/experts', label: 'Experts', icon: <UsersIcon /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon /> },
]

/** Bottom navigation shown on small screens (mobile-first per design). */
export const bottomNavItems: NavItem[] = [
  { to: '/', label: 'Feed', icon: <HomeIcon /> },
  { to: '/create', label: 'Create', icon: <PlusIcon /> },
  { to: '/experts', label: 'Experts', icon: <UsersIcon /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon /> },
]