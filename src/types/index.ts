export type Plan = 'free' | 'family' | 'family_plus'
export type Role = 'admin' | 'member'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'
export type LogMethod = 'manual' | 'qr' | 'ai_vision'

export interface Household {
  id: string
  name: string
  join_code: string
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  display_name: string
  avatar_colour: string
  role: Role
  push_token: string | null
  created_at: string
}

export interface Chore {
  id: string
  household_id: string
  name: string
  emoji: string
  points: number
  time_of_day: TimeOfDay | null
  active: boolean
  created_at: string
}

export interface ChoreLog {
  id: string
  household_id: string
  chore_id: string
  user_id: string
  points_earned: number
  time_of_day: TimeOfDay
  method: LogMethod
  photo_url: string | null
  logged_at: string
}

export interface PointRules {
  weekend_multiplier: number
  streak_bonus_per_day: number
  early_bird_bonus: number
}

export interface Prize {
  id: string
  household_id: string
  week_start: string
  description: string
  created_at: string
}

export interface LeaderboardEntry {
  member: HouseholdMember
  points: number
  streak: number
}
