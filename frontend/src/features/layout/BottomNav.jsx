import { NavLink } from 'react-router-dom'
import { bottomNavItems } from './nav'
import './layout.css'

export function BottomNav() {
  return (
    <nav className="asa-bottom-nav" aria-label="Main">
      {bottomNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `asa-bottom-nav__link ${isActive ? 'asa-bottom-nav__link--active' : ''}`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}