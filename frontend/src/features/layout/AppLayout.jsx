import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { FloatingAssistant } from '@/features/assistant/components/FloatingAssistant'
import './layout.css'

export function AppLayout() {
  return (
    <div className="asa-shell">
      <Header />
      <main className="asa-main">
        <Outlet />
      </main>
      <BottomNav />
      <FloatingAssistant />
    </div>
  )
}