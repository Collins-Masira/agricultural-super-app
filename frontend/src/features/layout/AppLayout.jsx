import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import './layout.css'

/**
 * The authenticated application shell: sticky header with navigation on
 * desktop, bottom navigation on mobile, and a centered content container.
 */
export function AppLayout() {
  return (
    <div className="asa-shell">
      <Header />
      <main className="asa-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}