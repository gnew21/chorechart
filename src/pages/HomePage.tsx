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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="pb-24 bg-[#F5F5F7] min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 bg-[#F5F5F7]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#86868B] text-[13px] font-medium">{household.name}</p>
            <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#1D1D1F] leading-tight">
              {greeting},<br />{member.display_name.split(' ')[0]}
            </h1>
          </div>
          <Avatar name={member.display_name} colour={member.avatar_colour} size="md" />
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Points', value: myPoints, color: 'text-emerald-500' },
            { label: 'Rank', value: `#${myRank}`, color: 'text-[#1D1D1F]' },
            { label: 'Streak 🔥', value: myStreak, color: 'text-orange-400' },
          ].map(stat => (
            <div key={stat.label} className="card p-3.5 text-center">
              <p className={`text-[22px] font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-[#86868B] font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Latest update */}
      {latestUpdate && (
        <div className="px-4 mt-4">
          <button
            onClick={() => navigate('/updates')}
            className="w-full card p-4 text-left active:opacity-70 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#F5F5F7] rounded-xl flex items-center justify-center text-lg flex-shrink-0">📢</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-0.5">Update</p>
                <p className="font-semibold text-[#1D1D1F] text-[14px] truncate">{latestUpdate.title}</p>
              </div>
              <span className="text-[#86868B] text-lg">›</span>
            </div>
          </button>
        </div>
      )}

      {/* Quick log */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#1D1D1F] font-bold text-[17px]">Quick Log</p>
          <span className="text-[13px] text-[#86868B]">{chores.length} chores</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {chores.slice(0, 6).map(chore => (
            <button
              key={chore.id}
              onClick={() => setSelectedChore(chore)}
              className="card flex items-center gap-3 p-3.5 text-left active:opacity-70 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-2xl flex-shrink-0">
                {chore.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">{chore.name}</p>
                <p className="text-[12px] text-emerald-500 font-medium">{chore.points} pts</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 mt-6">
        <p className="text-[#1D1D1F] font-bold text-[17px] mb-3">Leaderboard</p>
        <div className="card overflow-hidden">
          {ranked.map((entry, i) => (
            <div
              key={entry.member.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < ranked.length - 1 ? 'border-b border-black/[0.04]' : ''} ${entry.member.user_id === member.user_id ? 'bg-emerald-50/50' : ''}`}
            >
              <span className="text-lg w-7 text-center flex-shrink-0">
                {i < 3 ? medals[i] : <span className="text-[13px] text-[#86868B] font-semibold">{i + 1}</span>}
              </span>
              <Avatar name={entry.member.display_name} colour={entry.member.avatar_colour} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-[#1D1D1F] truncate">{entry.member.display_name}</p>
                {entry.streak > 0 && <p className="text-[11px] text-orange-400">🔥 {entry.streak} day streak</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-500 text-[15px]">{entry.points}</p>
                <p className="text-[11px] text-[#86868B]">pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <div className="px-4 mt-6">
          <p className="text-[#1D1D1F] font-bold text-[17px] mb-3">Recent Activity</p>
          <div className="card overflow-hidden">
            {recentLogs.map((log, i) => {
              const chore = choreMap.get(log.chore_id)
              return (
                <div key={log.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < recentLogs.length - 1 ? 'border-b border-black/[0.04]' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-xl flex-shrink-0">
                    {chore?.emoji ?? '✅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1D1D1F] truncate">{chore?.name ?? 'Chore'}</p>
                    <p className="text-[12px] text-[#86868B]">{new Date(log.logged_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <span className="text-[14px] font-bold text-emerald-500">+{log.points_earned}</span>
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
        displayName={member.display_name}
        method="manual"
        onLogged={onLogged}
        onClose={() => setSelectedChore(null)}
      />
    </div>
  )
}
