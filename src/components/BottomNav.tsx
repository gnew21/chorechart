import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import type { HouseholdMember } from '../types'

interface Props {
  member: HouseholdMember | null
}

export function BottomNav({ member }: Props) {
  const isAdmin = member?.role === 'admin'
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const base = 'flex flex-col items-center gap-0.5 text-xs py-2 px-3 text-gray-400'
  const active = 'text-green-500'

  const moreRoutes = ['/tracking', '/calendar', '/photos', '/updates', '/messages', ...(isAdmin ? ['/admin'] : [])]
  const moreIsActive = moreRoutes.includes(location.pathname)

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 left-0 right-0 max-w-lg mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <NavLink to="/tracking" onClick={() => setMoreOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-700'}`}>
                <span className="text-xl">📊</span>
                <span className="font-medium">Tracking & Streaks</span>
              </NavLink>
              <NavLink to="/calendar" onClick={() => setMoreOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-700'}`}>
                <span className="text-xl">📅</span>
                <span className="font-medium">Family Calendar</span>
              </NavLink>
              <NavLink to="/photos" onClick={() => setMoreOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-700'}`}>
                <span className="text-xl">📷</span>
                <span className="font-medium">Family Photos</span>
              </NavLink>
              <NavLink to="/updates" onClick={() => setMoreOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 ${isAdmin ? 'border-b border-gray-50' : ''} ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-700'}`}>
                <span className="text-xl">📢</span>
                <span className="font-medium">Updates</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-700'}`}>
                  <span className="text-xl">⚙️</span>
                  <span className="font-medium">Admin Panel</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50 max-w-lg mx-auto">
        <div className="flex justify-around">
          <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-xl">🏡</span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/log" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-xl">✅</span>
            <span>Log</span>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-xl">💬</span>
            <span>Chat</span>
          </NavLink>
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={`${base} ${moreIsActive || moreOpen ? active : ''}`}
          >
            <span className="text-xl">☰</span>
            <span>More</span>
          </button>
          <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-xl">👤</span>
            <span>Me</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}
