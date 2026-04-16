import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Household, HouseholdMember } from '../types'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/Avatar'
import { PLANS, createCheckoutSession } from '../lib/stripe'

const AVATAR_COLOURS = [
  '#a8d5a2', '#f7b2b7', '#b8d4e8', '#f9d89c', '#c5b8e8', '#f4b8a0',
  '#a0d4d4', '#f4d4a0', '#d4a0f4', '#a0f4d4',
]

interface Props {
  household: Household
  member: HouseholdMember
  onRefresh: () => void
}

export function SettingsPage({ household, member, onRefresh }: Props) {
  const [name, setName] = useState(member.display_name)
  const [colour, setColour] = useState(member.avatar_colour)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const navigate = useNavigate()

  async function saveProfile() {
    setSaving(true)
    await supabase.from('household_members').update({
      display_name: name.trim(),
      avatar_colour: colour,
    }).eq('id', member.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onRefresh()
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleUpgrade(planKey: 'family' | 'family_plus') {
    setUpgrading(true)
    try {
      await createCheckoutSession(PLANS[planKey].priceId, household.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upgrade failed')
    }
    setUpgrading(false)
  }

  const planLabel: Record<string, string> = {
    free: 'Free',
    family: 'Family',
    family_plus: 'Family+',
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-gray-600 px-5 pt-14 pb-16">
        <div className="flex items-center gap-4">
          <Avatar name={name || member.display_name} colour={colour} size="lg" />
          <div>
            <h1 className="text-white text-xl font-bold">{member.display_name}</h1>
            <p className="text-slate-300 text-sm">{household.name} · {planLabel[household.plan]}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Profile card */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Your Profile</h2>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Display name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Avatar colour</label>
            <div className="flex flex-wrap gap-2.5">
              {AVATAR_COLOURS.map(c => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className={`w-9 h-9 rounded-full border-4 transition-all ${colour === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-primary"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {/* Household info */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4">Household</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Name</span>
              <span className="font-semibold text-gray-900">{household.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Join Code</span>
              <span className="font-mono font-bold text-gray-900 tracking-widest bg-gray-100 px-3 py-1 rounded-lg">{household.join_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="font-semibold text-emerald-600">{planLabel[household.plan]}</span>
            </div>
          </div>
        </div>

        {/* Upgrade */}
        {household.plan !== 'family_plus' && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900 px-1">Upgrade Plan</h2>
            {(['family', 'family_plus'] as const)
              .filter(p => household.plan === 'free' || p === 'family_plus')
              .map(planKey => (
                <div key={planKey} className="card p-4 border-2 border-emerald-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{PLANS[planKey].name}</p>
                      <p className="text-emerald-600 font-bold text-lg">{PLANS[planKey].price}</p>
                    </div>
                    <button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={upgrading}
                      className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                    >
                      Upgrade
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {PLANS[planKey].features.map(f => (
                      <li key={f} className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full py-3.5 border-2 border-red-100 text-red-400 font-semibold rounded-2xl text-sm active:scale-95 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
