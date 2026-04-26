import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-6">
        <div className="text-center max-w-sm fade-in">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">📬</div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1D1D1F] mb-2">Check your email</h1>
          <p className="text-[#6E6E73] text-[15px]">We sent a link to <strong className="text-[#1D1D1F]">{email}</strong></p>
          <button onClick={() => setSent(false)} className="mt-8 px-6 py-2.5 bg-[#F5F5F7] border border-black/10 text-[#1D1D1F] rounded-xl text-[15px] font-medium">
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7]">
      {/* Branding */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pb-0">
        <div className="fade-in text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-[22px] flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-emerald-500/20">🏡</div>
          <h1 className="text-[40px] font-bold tracking-[-0.03em] text-[#1D1D1F]">FamilyApp</h1>
          <p className="text-[#6E6E73] mt-2 text-[17px]">Chores, points and family life</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-t-3xl p-6 pt-8 mt-8 border-t border-black/[0.06]">
        {/* Toggle */}
        <div className="flex bg-[#F5F5F7] rounded-xl p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${mode === m ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B]'}`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} required className="input" />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6} className="input" />

          {error && (
            <p className="text-red-500 text-[13px] px-1">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[12px] text-[#86868B] mt-6">
          By continuing you agree to our terms of service
        </p>
      </div>
    </div>
  )
}
