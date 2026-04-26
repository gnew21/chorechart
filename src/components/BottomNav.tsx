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
  const base = 'flex flex-col items-center gap-1 text-[10px] font-medium py-2 px-3 text-[#86868B] transition-colors'
  const active = 'text-[#1D1D1F]'

  const moreRoutes = ['/tracking', '/calendar', '/photos', '/updates', '/messages', ...(isAdmin ? ['/admin'] : [])]
  const moreIsActive = moreRoutes.includes(location.pathname)

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-20 left-0 right-0 max-w-lg mx-auto px-4">
            <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-xl shadow-black/10">
              {[
                { to: '/tracking', icon: '📊', label: 'Tracking & Streaks' },
                { to: '/calendar', icon: '📅', label: 'Family Calendar' },
                { to: '/photos', icon: '📷', label: 'Family Photos' },
                { to: '/updates', icon: '📢', label: 'Updates' },
                { to: '/messages', icon: '💬', label: 'Messages' },
              ].map((item, i, arr) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-5 py-4 ${i < arr.length - 1 || isAdmin ? 'border-b border-black/[0.04]' : ''} ${isActive ? 'text-emerald-500' : 'text-[#1D1D1F]'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-[15px]">{item.label}</span>
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-5 py-4 ${isActive ? 'text-emerald-500' : 'text-[#1D1D1F]'}`}>
                  <span className="text-xl">⚙️</span>
                  <span className="font-medium text-[15px]">Admin Panel</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-black/[0.06] safe-bottom z-50 max-w-lg mx-auto">
        <div className="flex justify-around py-1">
          <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-[22px]">🏡</span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/log" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-[22px]">✅</span>
            <span>Log</span>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-[22px]">💬</span>
            <span>Chat</span>
          </NavLink>
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={`${base} ${moreIsActive || moreOpen ? active : ''}`}
          >
            <span className="text-[22px]">☰</span>
            <span>More</span>
          </button>
          <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : ''}`}>
            <span className="text-[22px]">👤</span>
            <span>Me</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}
