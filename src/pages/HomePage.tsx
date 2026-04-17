import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Household, HouseholdMember, Chore, ChoreLog } from '../types'
import { ChoreConfirmSheet } from '../components/ChoreConfirmSheet'
import { Avatar } from '../components/Avatar'
import { rankMembers } from '../utils/points'
import { buildStreakMap } from '../utils/streaks'
import { usePointRules } from '../hooks/usePointRules'
import { supabase } from '../lib/supabase'

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
  chores: Chore[]
  weeklyLogs: ChoreLog[]
  onLogged: () => void
}

interface Update {
  id: string
  title: string
  body: string | null
  created_at: string
  posted_by: string
}

export function HomePage({ household, member, members, chores, weeklyLogs, onLogged }: Props) {
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null)
  const [latestUpdate, setLatestUpdate] = useState<Update | null>(null)
  const navigate = useNavigate()
  const rules = usePointRules(household.id)
  void rules

  useEffect(() => {
    supabase
      .from('updates')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLatestUpdate(data))
  }, [household.id])

  const streaks = buildStreakMap(weeklyLogs, members.map(m => m.user_id))
  const ranked = rankMembers(members, weeklyLogs, streaks)
  const myEntry = ranked.find(r => r.member.user_id === member.user_id)
  const myPoints = myEntry?.points ?? 0
  const myStreak = streaks.get(member.user_id) ?? 0
  const myRank = ranked.findIndex(r => r.member.user_id === member.user_id) + 1

  const recentLogs = weeklyLogs.filter(l => l.user_id === member.user_id).slice(0, 3)
  const choreMap = new Map(chores.map(c => [c.id, c]))

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 px-5 pt-14 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium">{household.name}</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">Hey, {member.display_name.split(' ')[0]}! 👋</h1>
          </div>
          <Avatar name={member.display_name} colour={member.avatar_colour} size="md" />
        </div>
      </div>

      {/* Stats card — overlapping header */}
      <div className="px-4 -mt-12">
        <div className="card p-4 flex gap-3">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{myPoints}</p>
            <p className="text-xs text-gray-500 mt-0.5">Points this week</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">#{myRank}</p>
            <p className="text-xs text-gray-500 mt-0.5">Your rank</p>
          </div>
          <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{myStreak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Day streak 🔥</p>
          </div>
        </div>
      </div>

      {/* Quick log */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Quick Log</h2>
          <span className="text-xs text-gray-400">{chores.length} chores</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {chores.slice(0, 6).map(chore => (
            <button
              key={chore.id}
              onClick={() => setSelectedChore(chore)}
              className="card flex items-center gap-3 p-3.5 text-left active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                {chore.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{chore.name}</p>
                <p className="text-xs text-emerald-500 font-medium">{chore.points} pts</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 mt-5">
        <h2 className="font-bold text-gray-900 mb-3">Weekly Leaderboard</h2>
        <div className="card overflow-hidden">
          {ranked.map((entry, i) => (
            <div
              key={entry.member.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < ranked.length - 1 ? 'border-b border-gray-50' : ''} ${entry.member.user_id === member.user_id ? 'bg-emerald-50' : ''}`}
            >
              <span className="text-lg w-7 text-center flex-shrink-0">
                {i < 3 ? medals[i] : <span className="text-sm text-gray-400 font-semibold">{i + 1}</span>}
              </span>
              <Avatar name={entry.member.display_name} colour={entry.member.avatar_colour} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{entry.member.display_name}</p>
                {entry.streak > 0 && <p className="text-xs text-orange-400">🔥 {entry.streak} day streak</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{entry.points}</p>
                <p className="text-xs text-gray-400">pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest update */}
      {latestUpdate && (
        <div className="px-4 mt-5">
          <button
            onClick={() => navigate('/updates')}
            className="w-full card p-4 bg-indigo-50 border-indigo-100 text-left active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0">📢</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-indigo-400 mb-0.5">LATEST UPDATE</p>
                <p className="font-bold text-gray-900 truncate">{latestUpdate.title}</p>
                {latestUpdate.body && <p className="text-sm text-gray-500 truncate mt-0.5">{latestUpdate.body}</p>}
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </div>
          </button>
        </div>
      )}

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <div className="px-4 mt-5">
          <h2 className="font-bold text-gray-900 mb-3">Recent Activity</h2>
          <div className="card overflow-hidden">
            {recentLogs.map((log, i) => {
              const chore = choreMap.get(log.chore_id)
              return (
                <div key={log.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < recentLogs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    {chore?.emoji ?? '✅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{chore?.name ?? 'Chore'}</p>
                    <p className="text-xs text-gray-400">{new Date(log.logged_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">+{log.points_earned}</span>
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
