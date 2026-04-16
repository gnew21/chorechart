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
    <div className="pb-20">
      <div className="px-4 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Log a Chore</h1>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search chores…"
          className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate('/log/qr')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-medium rounded-xl text-sm"
          >
            <span>📷</span> Scan QR
          </button>
          <button
            onClick={() => navigate('/log/ai')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 font-medium rounded-xl text-sm"
          >
            <span>🤖</span> AI Vision
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {filtered.map(chore => (
          <button
            key={chore.id}
            onClick={() => setSelected(chore)}
            className="w-full flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl text-left shadow-sm active:scale-98 transition-transform"
          >
            <span className="text-3xl">{chore.emoji}</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{chore.name}</p>
              {chore.time_of_day && <p className="text-xs text-gray-400 capitalize">{chore.time_of_day}</p>}
            </div>
            <span className="text-green-600 font-semibold">{chore.points} pts</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No chores found</p>
        )}
      </div>

      <ChoreConfirmSheet
        chore={selected}
        householdId={household.id}
        userId={member.user_id}
        method="manual"
        onLogged={onLogged}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
