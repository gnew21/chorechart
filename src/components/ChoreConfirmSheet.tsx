import { useState } from 'react'
import { Sheet } from './Sheet'
import type { Chore, TimeOfDay, LogMethod } from '../types'
import { supabase } from '../lib/supabase'

interface Props {
  chore: Chore | null
  householdId: string
  userId: string
  displayName?: string
  method?: LogMethod
  photoUrl?: string
  onLogged: () => void
  onClose: () => void
}

const timeLabels: Record<TimeOfDay, string> = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening: '🌙 Evening',
}

function guessTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function ChoreConfirmSheet({ chore, householdId, userId, displayName, method = 'manual', photoUrl, onLogged, onClose }: Props) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(guessTimeOfDay())
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleLog() {
    if (!chore) return
    setLoading(true)
    const { error } = await supabase.from('chore_logs').insert({
      household_id: householdId,
      chore_id: chore.id,
      user_id: userId,
      points_earned: chore.points,
      time_of_day: timeOfDay,
      method,
      photo_url: photoUrl ?? null,
    })
    setLoading(false)
    if (!error) {
      setDone(true)
      supabase.functions.invoke('send-push', {
        body: {
          household_id: householdId,
          title: `${chore.emoji} ${displayName ?? 'Someone'} completed ${chore.name}!`,
          body: `+${chore.points} points`,
          url: '/',
        },
      })
      setTimeout(() => {
        setDone(false)
        onLogged()
        onClose()
      }, 1200)
    }
  }

  return (
    <Sheet open={!!chore} onClose={onClose} title="Log Chore">
      {chore && (
        <div className="p-5 space-y-5">
          {done ? (
            /* Success state */
            <div className="text-center py-12 fade-in">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-5"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                {chore.emoji}
              </div>
              <p className="text-[34px] font-bold tracking-[-0.03em] text-emerald-500">
                +{chore.points} pts
              </p>
              <p className="text-[15px] mt-1.5 tracking-[-0.01em]" style={{ color: '#86868B' }}>
                Great job!
              </p>
            </div>
          ) : (
            <>
              {/* Chore row */}
              <div
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                style={{ backgroundColor: '#F5F5F7' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  {chore.emoji}
                </div>
                <div>
                  <p
                    className="text-[17px] font-semibold tracking-[-0.01em]"
                    style={{ color: '#1D1D1F' }}
                  >
                    {chore.name}
                  </p>
                  <p className="text-[13px] font-semibold text-emerald-500 mt-0.5">
                    {chore.points} points
                  </p>
                </div>
              </div>

              {/* Time picker */}
              <div>
                <p className="section-label mb-2.5">When did you do this?</p>
                <div className="flex gap-2">
                  {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeOfDay(t)}
                      className="flex-1 py-2.5 px-2 rounded-xl text-[13px] font-semibold transition-all active:opacity-70"
                      style={{
                        backgroundColor: timeOfDay === t ? '#1D1D1F' : '#F5F5F7',
                        color: timeOfDay === t ? 'white' : '#86868B',
                      }}
                    >
                      {timeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLog}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Logging…' : 'Mark as Done'}
              </button>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}
