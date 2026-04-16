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
        <div className="p-4 space-y-4">
          {done ? (
            <div className="text-center py-8 fade-in">
              <div className="text-5xl mb-2">🎉</div>
              <p className="text-lg font-semibold text-green-600">+{chore.points} pts!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-3xl">{chore.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900">{chore.name}</p>
                  <p className="text-sm text-gray-500">{chore.points} points</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">When did you do this?</p>
                <div className="flex gap-2">
                  {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeOfDay(t)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        timeOfDay === t
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-600 border-gray-200'
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
                className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-50"
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
