import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const AVATAR_COLOURS = [
  '#a8d5a2', '#f7b2b7', '#b8d4e8', '#f9d89c', '#c5b8e8', '#f4b8a0',
  '#a0d4d4', '#f4d4a0', '#d4a0f4', '#a0f4d4',
]

const DEFAULT_CHORES = [
  { name: 'Wash dishes', emoji: '🍽️', points: 10 },
  { name: 'Vacuum', emoji: '🧹', points: 15 },
  { name: 'Take out trash', emoji: '🗑️', points: 10 },
  { name: 'Do laundry', emoji: '👕', points: 20 },
  { name: 'Clean bathroom', emoji: '🚿', points: 20 },
  { name: 'Mop floors', emoji: '🪣', points: 15 },
  { name: 'Feed pets', emoji: '🐾', points: 10 },
  { name: 'Cook dinner', emoji: '🍳', points: 25 },
]

type Step = 'profile' | 'household'

interface Props {
  user: User
  onComplete: () => void
}

export function OnboardingPage({ user, onComplete }: Props) {
  const [step, setStep] = useState<Step>('profile')
  const [displayName, setDisplayName] = useState('')
  const [colour, setColour] = useState(AVATAR_COLOURS[0])
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [householdName, setHouseholdName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleHousehold() {
    if (!displayName.trim()) return
    setLoading(true)
    setError(null)

    try {
      if (mode === 'create') {
        const hhId = crypto.randomUUID()
        const code = Math.random().toString(36).slice(2, 8).toUpperCase()

        const { error: hhErr } = await supabase
          .from('households')
          .insert({ id: hhId, name: householdName.trim(), join_code: code, plan: 'free' })
        if (hhErr) throw hhErr

        const { error: memErr } = await supabase.from('household_members').insert({
          household_id: hhId,
          user_id: user.id,
          display_name: displayName.trim(),
          avatar_colour: colour,
          role: 'admin',
        })
        if (memErr) throw memErr

        await supabase.from('chores').insert(
          DEFAULT_CHORES.map(c => ({ ...c, household_id: hhId, time_of_day: null, active: true }))
        )

        await supabase.from('point_rules').insert({
          household_id: hhId,
          weekend_multiplier: 1.5,
          streak_bonus_per_day: 2,
          early_bird_bonus: 5,
        })
      } else {
        const { data: hh, error: hhErr } = await supabase
          .from('households')
          .select('id')
          .eq('join_code', joinCode.trim().toUpperCase())
          .single()
        if (hhErr || !hh) throw new Error('Household not found. Check the join code.')

        const { error: memErr } = await supabase.from('household_members').insert({
          household_id: hh.id,
          user_id: user.id,
          display_name: displayName.trim(),
          avatar_colour: colour,
          role: 'member',
        })
        if (memErr) throw memErr
      }

      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500">
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-0">
          <div className="fade-in text-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">👋</div>
            <h1 className="text-3xl font-bold text-white">Set up your profile</h1>
            <p className="text-white/70 mt-1">How should your family know you?</p>
          </div>
        </div>

        <div className="bg-white rounded-t-3xl p-6 pt-8 shadow-2xl space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">YOUR NAME</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Mum, Dad, Emma…"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">PICK A COLOUR</label>
            <div className="flex flex-wrap gap-2.5">
              {AVATAR_COLOURS.map(c => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className={`w-10 h-10 rounded-full border-4 transition-all ${colour === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: colour }}>
              {displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
            </div>
            <p className="font-semibold text-gray-900">{displayName || 'Your name'}</p>
          </div>

          <button
            onClick={() => setStep('household')}
            disabled={!displayName.trim()}
            className="btn-primary"
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500">
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-0">
        <div className="fade-in text-center mb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">🏡</div>
          <h1 className="text-3xl font-bold text-white">Your household</h1>
          <p className="text-white/70 mt-1">Create or join a family group</p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl p-6 pt-8 shadow-2xl space-y-5">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === 'create' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Create New
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === 'join' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Join Existing
          </button>
        </div>

        {mode === 'create' ? (
          <input
            value={householdName}
            onChange={e => setHouseholdName(e.target.value)}
            placeholder="e.g. The Smith Family"
            className="input"
          />
        ) : (
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Enter 6-letter join code"
            className="input uppercase tracking-widest"
            maxLength={6}
          />
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleHousehold}
          disabled={loading || (mode === 'create' ? !householdName.trim() : joinCode.length < 6)}
          className="btn-primary"
        >
          {loading ? '…' : mode === 'create' ? 'Create Household 🎉' : 'Join Household →'}
        </button>

        <button onClick={() => setStep('profile')} className="w-full text-sm text-gray-400 py-1">
          ← Back
        </button>
      </div>
    </div>
  )
}
