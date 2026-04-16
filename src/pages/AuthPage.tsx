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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 p-6">
        <div className="text-center max-w-sm fade-in">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">📬</div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-white/70">We sent a confirmation link to <strong className="text-white">{email}</strong></p>
          <button onClick={() => setSent(false)} className="mt-8 px-6 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium">
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500">
      {/* Top branding */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-0">
        <div className="fade-in text-center mb-8">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center text-5xl mx-auto mb-5 shadow-lg">🏡</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">ChoreChart</h1>
          <p className="text-white/70 mt-2 text-lg">Make chores a family adventure</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-3xl p-6 pt-8 shadow-2xl">
        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
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
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? '…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          By continuing you agree to our terms of service
        </p>
      </div>
    </div>
  )
}
