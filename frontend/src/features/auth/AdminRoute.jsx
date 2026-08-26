import { Navigate, Outlet } from 'react-router-dom'
import { LoadingState } from '@/components/ui'
import { useAuth } from './AuthContext'

/**
 * Guards the /admin/* subtree. This is a UX nicety, NOT the security
 * boundary -- every admin API call is independently re-checked
 * server-side (see backend/app/auth/decorators.py's admin_required),
 * which is what actually stops a non-admin from reaching admin data or
 * actions. This component only controls what renders in the browser.
 */
export function AdminRoute() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <LoadingState label="Checking your session…" />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (user?.user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
