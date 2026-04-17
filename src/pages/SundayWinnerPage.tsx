import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import type { Household, HouseholdMember, ChoreLog, Chore, Prize } from '../types'
import { rankMembers } from '../utils/points'
import { buildStreakMap } from '../utils/streaks'
import { Avatar } from '../components/Avatar'

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
  chores: Chore[]
  weeklyLogs: ChoreLog[]
  currentPrize: Prize | null
  onDismiss: () => void
}

export function SundayWinnerPage({ members, weeklyLogs, currentPrize, onDismiss }: Props) {
  const streaks = buildStreakMap(weeklyLogs, members.map(m => m.user_id))
  const ranked = rankMembers(members, weeklyLogs, streaks)
  const winner = ranked[0]

  useEffect(() => {
    if (!winner || winner.points === 0) return
    const end = Date.now() + 3000
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [winner])

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 via-orange-400 to-pink-500 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center mb-8 fade-in">
        <p className="text-lg opacity-80 mb-2">Week Ending</p>
        <h1 className="text-4xl font-bold mb-1">🏆 Winner!</h1>
        <p className="opacity-80">FamilyApp Weekly Champion</p>
      </div>

      {winner && winner.points > 0 ? (
        <div className="text-center mb-8">
          <Avatar name={winner.member.display_name} colour={winner.member.avatar_colour} size="lg" />
          <h2 className="text-3xl font-bold mt-4">{winner.member.display_name}</h2>
          <p className="text-5xl font-black mt-2">{winner.points}</p>
          <p className="text-xl opacity-80">points this week</p>
          {winner.streak > 0 && (
            <p className="mt-2 text-lg">🔥 {winner.streak} day streak!</p>
          )}
        </div>
      ) : (
        <div className="text-center mb-8">
          <p className="text-xl">No chores logged this week 😴</p>
        </div>
      )}

      {currentPrize && (
        <div className="bg-white/20 rounded-2xl p-4 mb-8 text-center w-full max-w-xs">
          <p className="text-sm opacity-80 mb-1">This week's prize</p>
          <p className="text-xl font-bold">🎁 {currentPrize.description}</p>
        </div>
      )}

      {/* All rankings */}
      <div className="w-full max-w-xs space-y-2 mb-8">
        {ranked.map((entry, i) => (
          <div key={entry.member.id} className="flex items-center gap-3 bg-white/20 rounded-xl p-3">
            <span className="text-xl w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
            <Avatar name={entry.member.display_name} colour={entry.member.avatar_colour} size="sm" />
            <p className="flex-1 font-medium">{entry.member.display_name}</p>
            <p className="font-bold">{entry.points}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onDismiss}
        className="py-3 px-8 bg-white text-orange-500 font-bold rounded-full text-lg"
      >
        See you next week! 👋
      </button>
    </div>
  )
}
