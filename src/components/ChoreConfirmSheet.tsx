import { useState } from 'react'
import { Sheet } from './Sheet'
import type { Chore, TimeOfDay, LogMethod } from '../types'
import { supabase } from '../lib/supabase'

interface Props {
  chore: Chore | null
  householdId: string
  userId: string
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

export function ChoreConfirmSheet({ chore, householdId, userId, method = 'manual', photoUrl, onLogged, onClose }: Props) {
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
            <div className="text-center py-10 fade-in">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">🎉</div>
              <p className="text-2xl font-bold text-emerald-600">+{chore.points} pts!</p>
              <p className="text-gray-400 text-sm mt-1">Great job!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl flex-shrink-0">
                  {chore.emoji}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{chore.name}</p>
                  <p className="text-emerald-500 font-semibold">{chore.points} points</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2.5">When did you do this?</p>
                <div className="flex gap-2">
                  {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeOfDay(t)}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
                        timeOfDay === t
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500'
                      }`}
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
                {loading ? 'Logging…' : 'Mark as Done ✓'}
              </button>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}
