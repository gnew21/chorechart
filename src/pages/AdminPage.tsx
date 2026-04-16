import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Household, HouseholdMember, Chore } from '../types'
import { supabase } from '../lib/supabase'

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
  chores: Chore[]
  onRefresh: () => void
}

type Tab = 'chores' | 'members' | 'prizes' | 'rules'

const EMOJIS = ['🍽️','🧹','🗑️','👕','🚿','🪣','🐾','🍳','🛏️','🪟','🌿','🧺','🧴','🚗','📦']

export function AdminPage({ household, member, members, chores, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('chores')
  const navigate = useNavigate()

  const tabLabels: Record<Tab, string> = {
    chores: '🧹 Chores',
    members: '👥 Members',
    prizes: '🎁 Prizes',
    rules: '⚡ Rules',
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-400 px-5 pt-14 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
            <p className="text-amber-100 text-sm mt-0.5">{household.name}</p>
          </div>
          <button
            onClick={() => navigate('/admin/qr')}
            className="px-4 py-2 bg-white/20 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all"
          >
            QR Codes
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Tab switcher */}
        <div className="card p-1.5">
          <div className="grid grid-cols-4 gap-1">
            {(['chores', 'members', 'prizes', 'rules'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500'}`}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {tab === 'chores' && <ChoresTab household={household} chores={chores} onRefresh={onRefresh} emojis={EMOJIS} />}
        {tab === 'members' && <MembersTab household={household} members={members} currentMember={member} onRefresh={onRefresh} />}
        {tab === 'prizes' && <PrizesTab household={household} />}
        {tab === 'rules' && <RulesTab household={household} />}
      </div>
    </div>
  )
}

function ChoresTab({ household, chores, onRefresh, emojis }: { household: Household; chores: Chore[]; onRefresh: () => void; emojis: string[] }) {
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
      <div className="card p-4 space-y-3">
        <h3 className="font-bold text-gray-900">Add Chore</h3>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Chore name"
          className="input"
        />
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Points: <span className="text-amber-500 font-bold">{points}</span></label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={points}
            onChange={e => setPoints(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Emoji</label>
          <div className="flex flex-wrap gap-1.5">
            {emojis.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-2 rounded-xl transition-all ${emoji === e ? 'bg-amber-100 scale-110' : 'bg-gray-50'}`}>{e}</button>
            ))}
          </div>
        </div>
        <button
          onClick={addChore}
          disabled={loading || !name.trim()}
          className="btn-primary"
        >
          Add Chore
        </button>
      </div>

      <div className="space-y-2">
        {chores.map(chore => (
          <div key={chore.id} className={`card flex items-center gap-3 p-3.5 ${!chore.active ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
              {chore.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{chore.name}</p>
              <p className="text-xs text-gray-400">{chore.points} pts</p>
            </div>
            <button onClick={() => toggleChore(chore)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
              {chore.active ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => deleteChore(chore.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 font-medium">
              Del
            </button>
          </div>
        ))}
      </div>
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
    <div className="space-y-3">
      <div className="card p-4 bg-blue-50 border-blue-100">
        <p className="text-xs font-semibold text-blue-500 mb-1">INVITE CODE</p>
        <p className="text-3xl font-bold text-blue-900 tracking-widest">{household.join_code}</p>
        <p className="text-xs text-blue-400 mt-1">Share this code to invite family members</p>
      </div>

      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="card flex items-center gap-3 p-3.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: m.avatar_colour }}>
              {m.display_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{m.display_name}</p>
              <p className="text-xs text-gray-400 capitalize">{m.role}</p>
            </div>
            {m.id !== currentMember.id && (
              <>
                <button onClick={() => toggleRole(m)} className="text-xs px-2.5 py-1.5 bg-gray-100 rounded-lg text-gray-600 font-medium">
                  {m.role === 'admin' ? '→ Member' : '→ Admin'}
                </button>
                <button onClick={() => removeMember(m)} className="text-xs px-2.5 py-1.5 bg-red-50 rounded-lg text-red-500 font-medium">
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
      <div className="card p-4">
        <p className="text-sm text-gray-500 mb-4">Set the prize for this week's winner. Revealed on Sunday night 🎉</p>
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
          className="btn-primary mt-3"
        >
          {saved ? '✓ Prize Saved!' : 'Save Prize 🎁'}
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

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-4">
        <p className="text-sm text-gray-500">Customise how points are calculated for your household.</p>
        {[
          { label: 'Weekend Multiplier', value: multiplier, setter: setMultiplier, min: 1, max: 3, step: 0.1, hint: 'Weekend chores earn this many × base points' },
          { label: 'Streak Bonus (pts/day)', value: streakBonus, setter: setStreakBonus, min: 0, max: 20, step: 1, hint: 'Extra pts per consecutive day active' },
          { label: 'Early Bird Bonus (pts)', value: earlyBird, setter: setEarlyBird, min: 0, max: 20, step: 1, hint: 'Extra pts for chores done before 9am' },
        ].map(({ label, value, setter, min, max, step, hint }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-sm text-gray-900">{label}</p>
              <p className="text-amber-500 font-bold">{value}</p>
            </div>
            <p className="text-xs text-gray-400 mb-2">{hint}</p>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={e => setter(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        ))}
        <button
          onClick={save}
          disabled={loading}
          className="btn-primary"
        >
          {saved ? '✓ Rules Saved!' : 'Save Rules'}
        </button>
      </div>
    </div>
  )
}
