import type { ChoreLog, Chore, PointRules, HouseholdMember, LeaderboardEntry } from '../types'
import { isWeekend, isBeforeNineAM } from './dates'

export function calculatePoints(
  chore: Chore,
  log: Pick<ChoreLog, 'logged_at' | 'time_of_day'>,
  rules: PointRules | null,
  streakDays: number = 0
): number {
  let pts = chore.points
  const logDate = new Date(log.logged_at)

  if (rules) {
    if (isWeekend(logDate)) {
      pts = Math.round(pts * rules.weekend_multiplier)
    }
    if (streakDays > 0) {
      pts += rules.streak_bonus_per_day * streakDays
    }
    if (isBeforeNineAM(logDate)) {
      pts += rules.early_bird_bonus
    }
  }

  return Math.max(1, pts)
}

export function sumPoints(logs: ChoreLog[], userId: string): number {
  return logs.filter(l => l.user_id === userId).reduce((acc, l) => acc + l.points_earned, 0)
}

export function rankMembers(
  members: HouseholdMember[],
  logs: ChoreLog[],
  streaks: Map<string, number>
): LeaderboardEntry[] {
  return members
    .map(member => ({
      member,
      points: sumPoints(logs, member.user_id),
      streak: streaks.get(member.user_id) ?? 0,
    }))
    .sort((a, b) => b.points - a.points)
}
