import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Household, HouseholdMember, Chore } from '../types'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/Avatar'

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
  chores: Chore[]
  onRefresh: () => void
}

type Tab = 'chores' | 'members' | 'prizes' | 'rules'

export function AdminPage({ household, member, members, chores, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('chores')
  const navigate = useNavigate()

  const tabLabels: Record<Tab, string> = {
    chores: 'Chores',
    members: 'Members',
    prizes: 'Prizes',
    rules: 'Rules',
  }

  return (
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Admin</h1>
            <p className="text-[15px] mt-1 tracking-[-0.01em]" style={{ color: '#86868B' }}>{household.name}</p>
          </div>
          <button
            onClick={() => navigate('/admin/qr')}
            className="mt-1 px-4 py-2 rounded-xl text-[13px] font-semibold active:opacity-70 transition-opacity"
            style={{ backgroundColor: 'white', color: '#1D1D1F', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            QR Codes
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex rounded-xl p-1" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {(['chores', 'members', 'prizes', 'rules'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-[12px] font-semibold capitalize transition-all active:opacity-70"
              style={{
                backgroundColor: tab === t ? '#1D1D1F' : 'transparent',
                color: tab === t ? 'white' : '#86868B',
              }}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {tab === 'chores' && <ChoresTab household={household} chores={chores} onRefresh={onRefresh} />}
        {tab === 'members' && <MembersTab household={household} members={members} currentMember={member} onRefresh={onRefresh} />}
        {tab === 'prizes' && <PrizesTab household={household} />}
        {tab === 'rules' && <RulesTab household={household} />}
      </div>
    </div>
  )
}

function ChoresTab({ household, chores, onRefresh }: { household: Household; chores: Chore[]; onRefresh: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [points, setPoints] = useState(10)
  const [loading, setLoading] = useState(false)

  async function addChore() {
    if (!name.trim()) return
    setLoading(true)
    await supabase.from('chores').insert({
      household_id: household.id,
      name: name.trim(),
      emoji,
      points,
      time_of_day: null,
      active: true,
    })
    setName('')
    setPoints(10)
    onRefresh()
    setLoading(false)
  }

  async function toggleChore(chore: Chore) {
    await supabase.from('chores').update({ active: !chore.active }).eq('id', chore.id)
    onRefresh()
  }

  async function deleteChore(id: string) {
    await supabase.from('chores').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Add chore form */}
      <div className="card p-4 space-y-3">
        <p className="section-label">New Chore</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Chore name"
          className="input"
        />
        {/* Emoji input */}
        <div>
          <p className="section-label mb-2">Emoji</p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: '#F5F5F7' }}
            >
              {emoji}
            </div>
            <input
              value={emoji}
              onChange={e => {
                const chars = [...e.target.value]
                const filtered = chars.filter(c => c.trim())
                if (filtered.length) setEmoji(filtered[filtered.length - 1])
              }}
              placeholder="Type or paste any emoji…"
              className="input flex-1"
            />
          </div>
        </div>
        {/* Points slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label">Points</p>
            <span className="text-[15px] font-bold text-emerald-500">{points}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={points}
            onChange={e => setPoints(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        <button
          onClick={addChore}
          disabled={loading || !name.trim()}
          className="btn-primary"
        >
          Add Chore
        </button>
      </div>

      {/* Chore list */}
      {chores.length > 0 && (
        <>
          <p className="section-label px-1">All Chores</p>
          <div className="card overflow-hidden">
            {chores.map((chore, idx) => (
              <div
                key={chore.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${idx < chores.length - 1 ? 'border-b border-black/[0.04]' : ''} ${!chore.active ? 'opacity-40' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: '#F5F5F7' }}
                >
                  {chore.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold tracking-[-0.01em] truncate" style={{ color: '#1D1D1F' }}>{chore.name}</p>
                  <p className="text-[12px] font-semibold text-emerald-500">{chore.points} pts</p>
                </div>
                <button
                  onClick={() => toggleChore(chore)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg active:opacity-70 transition-opacity"
                  style={{ backgroundColor: '#F5F5F7', color: '#86868B' }}
                >
                  {chore.active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => deleteChore(chore.id)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg active:opacity-70 transition-opacity"
                  style={{ backgroundColor: '#FFF2F2', color: '#FF3B30' }}
                >
                  Del
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MembersTab({ household, members, currentMember, onRefresh }: { household: Household; members: HouseholdMember[]; currentMember: HouseholdMember; onRefresh: () => void }) {
  async function toggleRole(m: HouseholdMember) {
    if (m.id === currentMember.id) return
    const newRole = m.role === 'admin' ? 'member' : 'admin'
    await supabase.from('household_members').update({ role: newRole }).eq('id', m.id)
    onRefresh()
  }

  async function removeMember(m: HouseholdMember) {
    if (m.id === currentMember.id) return
    await supabase.from('household_members').delete().eq('id', m.id)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Invite code */}
      <div className="card p-4">
        <p className="section-label mb-2">Invite Code</p>
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[22px] font-bold tracking-widest"
            style={{ color: '#1D1D1F' }}
          >
            {household.join_code}
          </span>
          <span className="text-[13px]" style={{ color: '#86868B' }}>Share to invite</span>
        </div>
      </div>

      {/* Members list */}
      <p className="section-label px-1">Members</p>
      <div className="card overflow-hidden">
        {members.map((m, idx) => (
          <div
            key={m.id}
            className={`flex items-center gap-3 px-4 py-3.5 ${idx < members.length - 1 ? 'border-b border-black/[0.04]' : ''}`}
          >
            <Avatar name={m.display_name} colour={m.avatar_colour} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold tracking-[-0.01em] truncate" style={{ color: '#1D1D1F' }}>{m.display_name}</p>
              <p className="text-[12px] capitalize" style={{ color: '#86868B' }}>{m.role}</p>
            </div>
            {m.id !== currentMember.id && (
              <>
                <button
                  onClick={() => toggleRole(m)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg active:opacity-70 transition-opacity"
                  style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F' }}
                >
                  {m.role === 'admin' ? '→ Member' : '→ Admin'}
                </button>
                <button
                  onClick={() => removeMember(m)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg active:opacity-70 transition-opacity"
                  style={{ backgroundColor: '#FFF2F2', color: '#FF3B30' }}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PrizesTab({ household }: { household: Household }) {
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    if (!desc.trim()) return
    setLoading(true)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    await supabase.from('prizes').upsert({
      household_id: household.id,
      week_start: weekStartStr,
      description: desc.trim(),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <p className="section-label">This Week's Prize</p>
        <p className="text-[13px]" style={{ color: '#86868B' }}>
          Set the reward for this week's top performer. Revealed Sunday night 🎉
        </p>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="e.g. Choose the movie tonight, Skip one chore next week…"
          rows={4}
          className="input resize-none"
        />
        <button
          onClick={save}
          disabled={loading || !desc.trim()}
          className="btn-primary"
        >
          {saved ? '✓ Prize Saved' : 'Save Prize'}
        </button>
      </div>
    </div>
  )
}

function RulesTab({ household }: { household: Household }) {
  const [multiplier, setMultiplier] = useState(1.5)
  const [streakBonus, setStreakBonus] = useState(2)
  const [earlyBird, setEarlyBird] = useState(5)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setLoading(true)
    await supabase.from('point_rules').upsert({
      household_id: household.id,
      weekend_multiplier: multiplier,
      streak_bonus_per_day: streakBonus,
      early_bird_bonus: earlyBird,
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const rules = [
    { label: 'Weekend Multiplier', value: multiplier, setter: setMultiplier, min: 1, max: 3, step: 0.1, hint: 'Weekend chores earn this many × base points' },
    { label: 'Streak Bonus', value: streakBonus, setter: setStreakBonus, min: 0, max: 20, step: 1, hint: 'Extra pts per consecutive day active' },
    { label: 'Early Bird Bonus', value: earlyBird, setter: setEarlyBird, min: 0, max: 20, step: 1, hint: 'Extra pts for chores done before 9am' },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-4">
        <p className="section-label">Point Rules</p>
        {rules.map(({ label, value, setter, min, max, step, hint }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>{label}</p>
              <span className="text-[15px] font-bold text-emerald-500">{value}</span>
            </div>
            <p className="text-[12px] mb-2" style={{ color: '#86868B' }}>{hint}</p>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={e => setter(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        ))}
        <button
          onClick={save}
          disabled={loading}
          className="btn-primary"
        >
          {saved ? '✓ Rules Saved' : 'Save Rules'}
        </button>
      </div>
    </div>
  )
}
