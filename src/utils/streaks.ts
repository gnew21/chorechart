import { formatDateKey } from './dates'
import { subDays } from 'date-fns'
import type { ChoreLog } from '../types'

export function calculateStreak(logs: ChoreLog[], userId: string): number {
  const userLogs = logs.filter(l => l.user_id === userId)
  if (!userLogs.length) return 0

  const logDays = new Set(userLogs.map(l => formatDateKey(new Date(l.logged_at))))

  let streak = 0
  let current = new Date()

  while (true) {
    const key = formatDateKey(current)
    if (!logDays.has(key)) break
    streak++
    current = subDays(current, 1)
  }

  return streak
}

export function buildStreakMap(logs: ChoreLog[], userIds: string[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const uid of userIds) {
    map.set(uid, calculateStreak(logs, uid))
  }
  return map
}
