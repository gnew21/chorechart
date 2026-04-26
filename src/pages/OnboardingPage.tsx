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
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F7' }}>
        {/* Top area with icon + title */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
          <div className="text-center mb-2">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
              style={{ backgroundColor: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
            >
              👋
            </div>
            <h1 className="page-title text-center">Set up your profile</h1>
            <p className="text-[15px] mt-2 tracking-[-0.01em]" style={{ color: '#86868B' }}>
              How should your family know you?
            </p>
          </div>
        </div>

        {/* Bottom card */}
        <div
          className="rounded-t-3xl px-5 pt-8 pb-10 space-y-5"
          style={{ backgroundColor: 'white', boxShadow: '0 -1px 0 rgba(0,0,0,0.06)' }}
        >
          <div>
            <label className="section-label mb-1.5 block">Your Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Mum, Dad, Emma…"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="section-label mb-2.5 block">Pick a Colour</label>
            <div className="flex flex-wrap gap-2.5">
              {AVATAR_COLOURS.map(c => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className={`w-10 h-10 rounded-full transition-all active:opacity-70 ${
                    colour === c ? 'ring-2 ring-offset-2 ring-[#1D1D1F]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Avatar preview */}
          <div
            className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ backgroundColor: '#F5F5F7' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: colour }}
            >
              {displayName
                ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                : '?'}
            </div>
            <p className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>
              {displayName || 'Your name'}
            </p>
          </div>

          <button
            onClick={() => setStep('household')}
            disabled={!displayName.trim()}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Top area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <div className="text-center mb-2">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
            style={{ backgroundColor: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
          >
            🏡
          </div>
          <h1 className="page-title text-center">Your household</h1>
          <p className="text-[15px] mt-2 tracking-[-0.01em]" style={{ color: '#86868B' }}>
            Create or join a family group
          </p>
        </div>
      </div>

      {/* Bottom card */}
      <div
        className="rounded-t-3xl px-5 pt-8 pb-10 space-y-5"
        style={{ backgroundColor: 'white', boxShadow: '0 -1px 0 rgba(0,0,0,0.06)' }}
      >
        {/* Segmented control */}
        <div
          className="flex rounded-2xl p-1"
          style={{ backgroundColor: '#F5F5F7' }}
        >
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:opacity-70 ${
              mode === 'create' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: mode === 'create' ? 'white' : 'transparent',
              color: mode === 'create' ? '#1D1D1F' : '#86868B',
            }}
          >
            Create New
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:opacity-70 ${
              mode === 'join' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: mode === 'join' ? 'white' : 'transparent',
              color: mode === 'join' ? '#1D1D1F' : '#86868B',
            }}
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
          <div
            className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#FFF2F2', border: '1px solid #FFD5D5' }}
          >
            <p className="text-[13px]" style={{ color: '#FF3B30' }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleHousehold}
          disabled={loading || (mode === 'create' ? !householdName.trim() : joinCode.length < 6)}
          className="btn-primary"
        >
          {loading ? '…' : mode === 'create' ? 'Create Household' : 'Join Household'}
        </button>

        <button
          onClick={() => setStep('profile')}
          className="w-full text-[13px] py-1 active:opacity-70 transition-opacity"
          style={{ color: '#86868B' }}
        >
          Back
        </button>
      </div>
    </div>
  )
}
