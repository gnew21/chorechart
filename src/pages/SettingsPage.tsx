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
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Page header */}
      <div className="px-5 pt-14 pb-6" style={{ backgroundColor: '#F5F5F7' }}>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Avatar + identity hero */}
      <div className="mx-4 mb-3 card p-5">
        <div className="flex items-center gap-4">
          <Avatar name={name || member.display_name} colour={colour} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>
              {name || member.display_name}
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: '#86868B' }}>
              {household.name} · {planLabel[household.plan]}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Profile section */}
        <p className="section-label px-1">Your Profile</p>
        <div className="card overflow-hidden">
          {/* Name row */}
          <div className="px-4 py-3.5 border-b border-black/[0.04]">
            <label className="section-label mb-1 block">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="input mt-1"
            />
          </div>
          {/* Colour picker row */}
          <div className="px-4 py-3.5">
            <label className="section-label mb-2.5 block">Avatar Colour</label>
            <div className="flex flex-wrap gap-2.5">
              {AVATAR_COLOURS.map(c => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className={`w-9 h-9 rounded-full transition-all active:opacity-70 ${
                    colour === c ? 'ring-2 ring-offset-2 ring-[#1D1D1F]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="btn-primary"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Profile'}
        </button>

        {/* Household section */}
        <p className="section-label px-1 pt-2">Household</p>
        <div className="card overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3.5 border-b border-black/[0.04]">
            <span className="text-[15px]" style={{ color: '#86868B' }}>Name</span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>
              {household.name}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3.5 border-b border-black/[0.04]">
            <span className="text-[15px]" style={{ color: '#86868B' }}>Join Code</span>
            <span
              className="font-mono text-[13px] font-bold tracking-widest px-3 py-1 rounded-lg"
              style={{ backgroundColor: '#F5F5F7', color: '#1D1D1F' }}
            >
              {household.join_code}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3.5">
            <span className="text-[15px]" style={{ color: '#86868B' }}>Plan</span>
            <span className="text-[15px] font-semibold text-emerald-500">
              {planLabel[household.plan]}
            </span>
          </div>
        </div>

        {/* Upgrade section */}
        {household.plan !== 'family_plus' && (
          <>
            <p className="section-label px-1 pt-2">Upgrade Plan</p>
            <div className="space-y-3">
              {(['family', 'family_plus'] as const)
                .filter(p => household.plan === 'free' || p === 'family_plus')
                .map(planKey => (
                  <div key={planKey} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>
                          {PLANS[planKey].name}
                        </p>
                        <p className="text-[17px] font-bold text-emerald-500 mt-0.5">
                          {PLANS[planKey].price}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUpgrade(planKey)}
                        disabled={upgrading}
                        className="btn-green"
                        style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, fontSize: 13 }}
                      >
                        Upgrade
                      </button>
                    </div>
                    <ul className="space-y-1.5">
                      {PLANS[planKey].features.map(f => (
                        <li key={f} className="text-[13px] flex items-center gap-2" style={{ color: '#86868B' }}>
                          <span className="text-emerald-500 font-bold">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Sign out */}
        <div className="pt-2 pb-2">
          <button
            onClick={signOut}
            className="w-full py-3.5 text-[15px] font-semibold active:opacity-70 transition-opacity"
            style={{ color: '#FF3B30' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
