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
      const now = new Date()
      let start: string, end: string
      if (view === 'weekly') { start = getWeekStart(now).toISOString(); end = new Date().toISOString() }
      else if (view === 'monthly') { start = startOfMonth(now).toISOString(); end = endOfMonth(now).toISOString() }
      else { start = startOfYear(now).toISOString(); end = endOfYear(now).toISOString() }
      const { data } = await supabase.from('chore_logs').select('*').eq('household_id', household.id).gte('logged_at', start).lte('logged_at', end).order('logged_at')
      setLogs(data ?? [])
      setLoading(false)
    }
    load()
  }, [view, household.id])

  const userLogs = logs.filter(l => l.user_id === selectedUser)
  const choreMap = new Map(chores.map(c => [c.id, c]))
  const totalPoints = userLogs.reduce((s, l) => s + l.points_earned, 0)
  const totalChores = userLogs.length

  function renderWeekly() {
    const days = getWeekDays()
    return (
      <div className="card overflow-hidden">
        {days.map((day, i) => {
          const key = formatDateKey(day)
          const dayLogs = userLogs.filter(l => formatDateKey(new Date(l.logged_at)) === key)
          const dayPoints = dayLogs.reduce((s, l) => s + l.points_earned, 0)
          return (
            <div key={key} className={`px-4 py-3.5 ${i < days.length - 1 ? 'border-b border-black/[0.04]' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[14px] font-semibold text-[#1D1D1F]">{format(day, 'EEE, MMM d')}</p>
                {dayPoints > 0 && <span className="text-[13px] font-bold text-emerald-500">{dayPoints} pts</span>}
              </div>
              {dayLogs.length > 0 ? (
                <div className="space-y-1">
                  {dayLogs.map(log => (
                    <div key={log.id} className="flex items-center gap-2 text-[13px]">
                      <span>{choreMap.get(log.chore_id)?.emoji ?? '✅'}</span>
                      <span className="text-[#1D1D1F] flex-1">{choreMap.get(log.chore_id)?.name ?? 'Chore'}</span>
                      <span className="text-[#86868B] capitalize">{log.time_of_day}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#86868B]">No chores logged</p>
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
    const maxPts = Math.max(...days.map(d => userLogs.filter(l => formatDateKey(new Date(l.logged_at)) === formatDateKey(d)).reduce((s, l) => s + l.points_earned, 0)), 1)
    return (
      <div className="card p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="text-center text-[11px] font-semibold text-[#86868B] py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (startOfMonth(now).getDay() + 6) % 7 }).map((_, i) => <div key={`off-${i}`} />)}
          {days.map(day => {
            const key = formatDateKey(day)
            const pts = userLogs.filter(l => formatDateKey(new Date(l.logged_at)) === key).reduce((s, l) => s + l.points_earned, 0)
            const intensity = pts > 0 ? Math.max(0.15, pts / maxPts) : 0
            return (
              <div key={key} className="aspect-square rounded-xl flex items-center justify-center text-[11px] font-medium"
                style={{ backgroundColor: pts > 0 ? `rgba(16,185,129,${intensity})` : '#F5F5F7', color: intensity > 0.5 ? 'white' : '#86868B' }}>
                {format(day, 'd')}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderYearly() {
    const now = new Date()
    const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })
    return (
      <div className="grid grid-cols-3 gap-2">
        {months.map(month => {
          const start = startOfMonth(month), end = endOfMonth(month)
          const ml = userLogs.filter(l => { const d = new Date(l.logged_at); return d >= start && d <= end })
          const pts = ml.reduce((s, l) => s + l.points_earned, 0)
          const days = ml.length > 0 ? new Set(ml.map(l => formatDateKey(new Date(l.logged_at)))).size : 0
          return (
            <div key={month.toISOString()} className="card p-3.5">
              <p className="text-[12px] font-semibold text-[#86868B] mb-1">{format(month, 'MMM')}</p>
              <p className="text-[22px] font-bold text-emerald-500">{pts}</p>
              <p className="text-[11px] text-[#86868B]">{days}d active</p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="px-5 pt-14 pb-6" style={{ backgroundColor: '#F5F5F7' }}>
        <h1 className="page-title">Tracking</h1>
        <p className="text-[15px] mt-1 tracking-[-0.01em]" style={{ color: '#86868B' }}>Your progress over time</p>
      </div>

      <div className="px-4 space-y-4">
        {/* View + member selector */}
        <div className="card p-4 space-y-3">
          <div className="flex rounded-xl p-1" style={{ backgroundColor: '#F5F5F7' }}>
            {(['weekly', 'monthly', 'yearly'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all active:opacity-70"
                style={{ backgroundColor: view === v ? 'white' : 'transparent', color: view === v ? '#1D1D1F' : '#86868B', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {members.map(m => (
              <button key={m.id} onClick={() => setSelectedUser(m.user_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] flex-shrink-0 font-semibold transition-all active:opacity-70"
                style={{ backgroundColor: selectedUser === m.user_id ? '#1D1D1F' : '#F5F5F7', color: selectedUser === m.user_id ? 'white' : '#86868B' }}>
                <Avatar name={m.display_name} colour={m.avatar_colour} size="sm" />
                {m.display_name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="card p-4 text-center">
            <p className="text-[28px] font-bold text-emerald-500">{totalPoints}</p>
            <p className="text-[12px] text-[#86868B] font-medium mt-0.5">Points</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-[28px] font-bold text-[#1D1D1F]">{totalChores}</p>
            <p className="text-[12px] text-[#86868B] font-medium mt-0.5">Chores done</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: '#86868B' }}>Loading…</p>
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
