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
        // For join, we need to allow anonymous select by join_code
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-2">👋</div>
            <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Your name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Mum, Dad, Emma…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Pick a colour</label>
            <div className="flex flex-wrap gap-2">
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

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ backgroundColor: colour }}>
              {displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
            </div>
            <p className="font-medium text-gray-900">{displayName || 'Your name'}</p>
          </div>

          <button
            onClick={() => setStep('household')}
            disabled={!displayName.trim()}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-2">🏡</div>
          <h1 className="text-2xl font-bold text-gray-900">Your household</h1>
        </div>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 text-sm font-medium ${mode === 'create' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
          >
            Create new
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 text-sm font-medium ${mode === 'join' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
          >
            Join existing
          </button>
        </div>

        {mode === 'create' ? (
          <input
            value={householdName}
            onChange={e => setHouseholdName(e.target.value)}
            placeholder="e.g. The Smith Family"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        ) : (
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Enter 6-letter join code"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 uppercase tracking-widest"
            maxLength={6}
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleHousehold}
          disabled={loading || (mode === 'create' ? !householdName.trim() : joinCode.length < 6)}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40"
        >
          {loading ? '…' : mode === 'create' ? 'Create Household 🎉' : 'Join Household →'}
        </button>

        <button onClick={() => setStep('profile')} className="w-full text-sm text-gray-400">
          ← Back
        </button>
      </div>
    </div>
  )
}
