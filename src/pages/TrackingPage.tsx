import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, eachMonthOfInterval, endOfYear } from 'date-fns'
import type { Household, HouseholdMember, Chore, ChoreLog } from '../types'
import { supabase } from '../lib/supabase'
import { getWeekStart, getWeekDays, formatDateKey } from '../utils/dates'
import { Avatar } from '../components/Avatar'

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
  chores: Chore[]
}

type View = 'weekly' | 'monthly' | 'yearly'

export function TrackingPage({ household, member, members, chores }: Props) {
  const [view, setView] = useState<View>('weekly')
  const [logs, setLogs] = useState<ChoreLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(member.user_id)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let start: string
      let end: string
      const now = new Date()

      if (view === 'weekly') {
        start = getWeekStart(now).toISOString()
        end = new Date().toISOString()
      } else if (view === 'monthly') {
        start = startOfMonth(now).toISOString()
        end = endOfMonth(now).toISOString()
      } else {
        start = startOfYear(now).toISOString()
        end = endOfYear(now).toISOString()
      }

      const { data } = await supabase
        .from('chore_logs')
        .select('*')
        .eq('household_id', household.id)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at')

      setLogs(data ?? [])
      setLoading(false)
    }
    load()
  }, [view, household.id])

  const userLogs = logs.filter(l => l.user_id === selectedUser)
  const choreMap = new Map(chores.map(c => [c.id, c]))
  const selectedMember = members.find(m => m.user_id === selectedUser)

  function renderWeekly() {
    const days = getWeekDays()
    return (
      <div className="space-y-3">
        {days.map(day => {
          const key = formatDateKey(day)
          const dayLogs = userLogs.filter(l => formatDateKey(new Date(l.logged_at)) === key)
          const dayPoints = dayLogs.reduce((s, l) => s + l.points_earned, 0)
          return (
            <div key={key} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm text-gray-700">{format(day, 'EEE, MMM d')}</p>
                {dayPoints > 0 && <span className="text-green-600 font-semibold text-sm">{dayPoints} pts</span>}
              </div>
              {dayLogs.length > 0 ? (
                <div className="space-y-1">
                  {dayLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{choreMap.get(log.chore_id)?.emoji ?? '✅'}</span>
                      <span>{choreMap.get(log.chore_id)?.name ?? 'Chore'}</span>
                      <span className="ml-auto text-xs text-gray-400 capitalize">{log.time_of_day}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300">No chores</p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderMonthly() {
    const now = new Date()
    const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })
    const maxPts = Math.max(...days.map(d => {
      const key = formatDateKey(d)
      return userLogs.filter(l => formatDateKey(new Date(l.logged_at)) === key).reduce((s, l) => s + l.points_earned, 0)
    }), 1)

    return (
      <div className="grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
        {/* Offset for month start */}
        {Array.from({ length: (startOfMonth(now).getDay() + 6) % 7 }).map((_, i) => (
          <div key={`off-${i}`} />
        ))}
        {days.map(day => {
          const key = formatDateKey(day)
          const pts = userLogs.filter(l => formatDateKey(new Date(l.logged_at)) === key).reduce((s, l) => s + l.points_earned, 0)
          const intensity = pts > 0 ? Math.max(0.2, pts / maxPts) : 0
          return (
            <div
              key={key}
              title={`${format(day, 'MMM d')}: ${pts} pts`}
              className="aspect-square rounded-md flex items-center justify-center text-xs"
              style={{ backgroundColor: pts > 0 ? `rgba(74,222,128,${intensity})` : '#f3f4f6' }}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    )
  }

  function renderYearly() {
    const now = new Date()
    const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })

    return (
      <div className="grid grid-cols-3 gap-3">
        {months.map(month => {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          const monthLogs = userLogs.filter(l => {
            const d = new Date(l.logged_at)
            return d >= start && d <= end
          })
          const pts = monthLogs.reduce((s, l) => s + l.points_earned, 0)
          const days = monthLogs.length > 0 ? new Set(monthLogs.map(l => formatDateKey(new Date(l.logged_at)))).size : 0
          return (
            <div key={month.toISOString()} className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="font-medium text-sm text-gray-700 mb-1">{format(month, 'MMM')}</p>
              <p className="text-xl font-bold text-green-600">{pts}</p>
              <p className="text-xs text-gray-400">{days} days active</p>
            </div>
          )
        })}
      </div>
    )
  }

  const totalPoints = userLogs.reduce((s, l) => s + l.points_earned, 0)
  const totalChores = userLogs.length

  return (
    <div className="pb-20">
      <div className="px-4 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Tracking</h1>
        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
          {(['weekly', 'monthly', 'yearly'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Member selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedUser(m.user_id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm flex-shrink-0 border transition-all ${selectedUser === m.user_id ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}
            >
              <Avatar name={m.display_name} colour={m.avatar_colour} size="sm" />
              <span className="font-medium">{m.display_name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Summary */}
        {selectedMember && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-green-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600">{totalChores}</p>
              <p className="text-xs text-gray-500">Chores done</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">Loading…</p>
          </div>
        ) : (
          <>
            {view === 'weekly' && renderWeekly()}
            {view === 'monthly' && renderMonthly()}
            {view === 'yearly' && renderYearly()}
          </>
        )}
      </div>
    </div>
  )
}
