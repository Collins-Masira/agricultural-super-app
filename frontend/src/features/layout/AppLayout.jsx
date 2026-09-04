import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { FloatingAssistant } from '@/features/assistant/components/FloatingAssistant'
import './layout.css'

export function AppLayout() {
  return (
    <div className="asa-shell">
      <Header />
      <div className="asa-shell__body">
        <Sidebar />
        <main className="asa-main">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FloatingAssistant />
    </div>
  )
}