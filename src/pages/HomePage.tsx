import { useState } from 'react'
import type { Household, HouseholdMember, Chore, ChoreLog } from '../types'
import { ChoreConfirmSheet } from '../components/ChoreConfirmSheet'
import { Avatar } from '../components/Avatar'
import { rankMembers } from '../utils/points'
import { buildStreakMap } from '../utils/streaks'
import { usePointRules } from '../hooks/usePointRules'

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
  chores: Chore[]
  weeklyLogs: ChoreLog[]
  onLogged: () => void
}

export function HomePage({ household, member, members, chores, weeklyLogs, onLogged }: Props) {
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null)
  const rules = usePointRules(household.id)

  const streaks = buildStreakMap(weeklyLogs, members.map(m => m.user_id))
  const ranked = rankMembers(members, weeklyLogs, streaks)
  const myPoints = ranked.find(r => r.member.user_id === member.user_id)?.points ?? 0
  const myStreak = streaks.get(member.user_id) ?? 0
  const myRank = ranked.findIndex(r => r.member.user_id === member.user_id) + 1

  const recentLogs = weeklyLogs
    .filter(l => l.user_id === member.user_id)
    .slice(0, 3)

  const choreMap = new Map(chores.map(c => [c.id, c]))
  void rules

  return (
    <div className="pb-20 pt-4">
      {/* Header */}
      <div className="px-4 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{household.name}</h1>
          <p className="text-sm text-gray-500">Welcome back, {member.display_name}!</p>
        </div>
        <Avatar name={member.display_name} colour={member.avatar_colour} size="md" />
      </div>

      {/* My stats */}
      <div className="mx-4 mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-4 text-white">
        <div className="flex justify-between">
          <div>
            <p className="text-sm opacity-80">This week</p>
            <p className="text-3xl font-bold">{myPoints} pts</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Rank #{myRank}</p>
            {myStreak > 0 && <p className="text-lg font-semibold">🔥 {myStreak} day streak</p>}
          </div>
        </div>
      </div>

      {/* Quick log */}
      <div className="px-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Quick Log</h2>
        <div className="grid grid-cols-2 gap-2">
          {chores.slice(0, 6).map(chore => (
            <button
              key={chore.id}
              onClick={() => setSelectedChore(chore)}
              className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl text-left shadow-sm active:scale-95 transition-transform"
            >
              <span className="text-2xl">{chore.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{chore.name}</p>
                <p className="text-xs text-gray-400">{chore.points} pts</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Weekly Leaderboard</h2>
        <div className="space-y-2">
          {ranked.map((entry, i) => (
            <div
              key={entry.member.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${entry.member.user_id === member.user_id ? 'bg-green-50 border border-green-100' : 'bg-white border border-gray-100'}`}
            >
              <span className="text-lg w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <Avatar name={entry.member.display_name} colour={entry.member.avatar_colour} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{entry.member.display_name}</p>
                {entry.streak > 0 && <p className="text-xs text-orange-500">🔥 {entry.streak} day streak</p>}
              </div>
              <p className="font-bold text-green-600">{entry.points}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <div className="px-4">
          <h2 className="font-semibold text-gray-700 mb-3">Your Recent Activity</h2>
          <div className="space-y-2">
            {recentLogs.map(log => {
              const chore = choreMap.get(log.chore_id)
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                  <span className="text-xl">{chore?.emoji ?? '✅'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{chore?.name ?? 'Chore'}</p>
                    <p className="text-xs text-gray-400">{new Date(log.logged_at).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+{log.points_earned}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ChoreConfirmSheet
        chore={selectedChore}
        householdId={household.id}
        userId={member.user_id}
        method="manual"
        onLogged={onLogged}
        onClose={() => setSelectedChore(null)}
      />
    </div>
  )
}
