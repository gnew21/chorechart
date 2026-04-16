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
    <div className="pb-20">
      <div className="px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-800">Your Profile</h2>
          <div className="flex items-center gap-3">
            <Avatar name={name || member.display_name} colour={colour} size="lg" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Display name</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Avatar colour</p>
            <div className="flex flex-wrap gap-2">
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
            className="w-full py-2.5 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-50 text-sm"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {/* Household */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Household</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{household.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Join Code</span>
              <span className="font-mono font-bold text-gray-900 tracking-widest">{household.join_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium text-green-600">{planLabel[household.plan]}</span>
            </div>
          </div>
        </div>

        {/* Upgrade */}
        {household.plan !== 'family_plus' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800">Upgrade Plan</h2>
            {(['family', 'family_plus'] as const)
              .filter(p => household.plan === 'free' || p === 'family_plus')
              .map(planKey => (
                <div key={planKey} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{PLANS[planKey].name}</p>
                      <p className="text-green-600 font-bold">{PLANS[planKey].price}</p>
                    </div>
                    <button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={upgrading}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                    >
                      Upgrade
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {PLANS[planKey].features.map(f => (
                      <li key={f} className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
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
          className="w-full py-3 border border-red-200 text-red-500 font-semibold rounded-xl text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
