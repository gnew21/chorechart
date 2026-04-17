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
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 px-5 pt-14 pb-8">
        <h1 className="text-white text-2xl font-bold">Log a Chore</h1>
        <p className="text-blue-100 text-sm mt-0.5">What did you accomplish today?</p>
      </div>

      <div className="px-4 -mt-4">
        {/* Search */}
        <div className="card p-3 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chores…"
            className="input"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigate('/log/qr')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl text-sm active:scale-95 transition-all"
            >
              <span>📷</span> Scan QR
            </button>
            <button
              onClick={() => navigate('/log/ai')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 font-semibold rounded-xl text-sm active:scale-95 transition-all"
            >
              <span>🤖</span> AI Vision
            </button>
          </div>
        </div>

        {/* Chore list */}
        <div className="space-y-2">
          {filtered.map(chore => (
            <button
              key={chore.id}
              onClick={() => setSelected(chore)}
              className="card w-full flex items-center gap-4 p-4 text-left active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                {chore.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{chore.name}</p>
                {chore.time_of_day && <p className="text-xs text-gray-400 capitalize mt-0.5">{chore.time_of_day}</p>}
              </div>
              <span className="text-emerald-500 font-bold text-sm">{chore.points} pts</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400 font-medium">No chores found</p>
            </div>
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
