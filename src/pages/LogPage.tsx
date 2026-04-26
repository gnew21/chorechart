import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Household, HouseholdMember, Chore } from '../types'
import { ChoreConfirmSheet } from '../components/ChoreConfirmSheet'

interface Props {
  household: Household
  member: HouseholdMember
  chores: Chore[]
  onLogged: () => void
}

export function LogPage({ household, member, chores, onLogged }: Props) {
  const [selected, setSelected] = useState<Chore | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = chores.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Page header */}
      <div className="px-5 pt-14 pb-6" style={{ backgroundColor: '#F5F5F7' }}>
        <h1 className="page-title">Log a Chore</h1>
        <p className="text-[15px] mt-1 tracking-[-0.01em]" style={{ color: '#86868B' }}>
          What did you accomplish today?
        </p>
      </div>

      <div className="px-4 space-y-3">
        {/* Search + quick actions */}
        <div className="card p-4 space-y-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chores…"
            className="input"
          />
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/log/qr')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold active:opacity-70 transition-opacity"
              style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F' }}
            >
              <span>📷</span>
              Scan QR
            </button>
            <button
              onClick={() => navigate('/log/ai')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold active:opacity-70 transition-opacity"
              style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F' }}
            >
              <span>🤖</span>
              AI Vision
            </button>
          </div>
        </div>

        {/* Section label */}
        {filtered.length > 0 && (
          <p className="section-label px-1">All Chores</p>
        )}

        {/* Chore list */}
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-[15px] font-medium" style={{ color: '#86868B' }}>No chores found</p>
            </div>
          ) : (
            filtered.map((chore, idx) => (
              <button
                key={chore.id}
                onClick={() => setSelected(chore)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 text-left active:opacity-70 transition-opacity bg-white${
                  idx < filtered.length - 1 ? ' border-b border-black/[0.04]' : ''
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: '#F5F5F7' }}
                >
                  {chore.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>
                    {chore.name}
                  </p>
                  {chore.time_of_day && (
                    <p className="text-[13px] capitalize mt-0.5" style={{ color: '#86868B' }}>
                      {chore.time_of_day}
                    </p>
                  )}
                </div>
                <span className="text-[13px] font-semibold text-emerald-500">
                  {chore.points} pts
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <ChoreConfirmSheet
        chore={selected}
        householdId={household.id}
        userId={member.user_id}
        displayName={member.display_name}
        method="manual"
        onLogged={onLogged}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
