import { NavLink } from 'react-router-dom'
import type { HouseholdMember } from '../types'

interface Props {
  member: HouseholdMember | null
}

export function BottomNav({ member: _member }: Props) {
  const base = 'flex flex-col items-center gap-0.5 text-xs py-2 px-3 text-gray-400'
  const active = 'text-green-500'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40 max-w-lg mx-auto">
      <div className="flex justify-around">
        <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
          <span className="text-xl">🏡</span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/log" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
          <span className="text-xl">✅</span>
          <span>Log</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
          <span className="text-xl">📅</span>
          <span>Calendar</span>
        </NavLink>
        <NavLink to="/photos" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
          <span className="text-xl">📷</span>
          <span>Photos</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
          <span className="text-xl">👤</span>
          <span>Me</span>
        </NavLink>
      </div>
    </nav>
  )
}
