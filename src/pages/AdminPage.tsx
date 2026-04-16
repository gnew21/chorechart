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

  return (
    <div className="pb-20">
      <div className="px-4 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <button onClick={() => navigate('/admin/qr')} className="text-sm text-blue-600 font-medium">QR Codes</button>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['chores', 'members', 'prizes', 'rules'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
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
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Add Chore</h3>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Chore name"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Points</label>
            <input
              type="number"
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Emoji</label>
          <div className="flex flex-wrap gap-1">
            {emojis.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-1.5 rounded-lg ${emoji === e ? 'bg-green-100' : ''}`}>{e}</button>
            ))}
          </div>
        </div>
        <button
          onClick={addChore}
          disabled={loading || !name.trim()}
          className="w-full py-2.5 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40 text-sm"
        >
          Add Chore
        </button>
      </div>

      <div className="space-y-2">
        {chores.map(chore => (
          <div key={chore.id} className={`flex items-center gap-3 p-3 bg-white border rounded-xl ${chore.active ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
            <span className="text-2xl">{chore.emoji}</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{chore.name}</p>
              <p className="text-xs text-gray-400">{chore.points} pts</p>
            </div>
            <button onClick={() => toggleChore(chore)} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
              {chore.active ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => deleteChore(chore.id)} className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500">
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
      <div className="bg-blue-50 rounded-xl p-3">
        <p className="text-sm text-blue-700 font-medium">Join Code</p>
        <p className="text-2xl font-bold text-blue-900 tracking-widest">{household.join_code}</p>
        <p className="text-xs text-blue-500">Share this to invite family members</p>
      </div>

      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: m.avatar_colour }}>
            {m.display_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-gray-900">{m.display_name}</p>
            <p className="text-xs text-gray-400 capitalize">{m.role}</p>
          </div>
          {m.id !== currentMember.id && (
            <>
              <button onClick={() => toggleRole(m)} className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                {m.role === 'admin' ? '→ Member' : '→ Admin'}
              </button>
              <button onClick={() => removeMember(m)} className="text-xs px-2 py-1 bg-red-50 rounded-lg text-red-500">
                Remove
              </button>
            </>
          )}
        </div>
      ))}
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
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
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
      <p className="text-sm text-gray-500">Set the prize for this week's winner. It'll be revealed on Sunday night.</p>
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="e.g. Choose the movie tonight, Skip one chore next week…"
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <button
        onClick={save}
        disabled={loading || !desc.trim()}
        className="w-full py-2.5 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40 text-sm"
      >
        {saved ? '✓ Saved!' : 'Save Prize 🎁'}
      </button>
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
      <p className="text-sm text-gray-500">Customise how points are calculated for your household.</p>

      {[
        { label: 'Weekend Multiplier', value: multiplier, setter: setMultiplier, min: 1, max: 3, step: 0.1, hint: 'Weekend chores earn this many × base points' },
        { label: 'Streak Bonus (pts/day)', value: streakBonus, setter: setStreakBonus, min: 0, max: 20, step: 1, hint: 'Extra pts per consecutive day active' },
        { label: 'Early Bird Bonus (pts)', value: earlyBird, setter: setEarlyBird, min: 0, max: 20, step: 1, hint: 'Extra pts for chores done before 9am' },
      ].map(({ label, value, setter, min, max, step, hint }) => (
        <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm text-gray-900">{label}</p>
            <p className="text-green-600 font-bold">{value}</p>
          </div>
          <p className="text-xs text-gray-400 mb-2">{hint}</p>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => setter(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>
      ))}

      <button
        onClick={save}
        disabled={loading}
        className="w-full py-2.5 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40 text-sm"
      >
        {saved ? '✓ Saved!' : 'Save Rules'}
      </button>
    </div>
  )
}
