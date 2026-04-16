export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          join_code: string
          plan: 'free' | 'family' | 'family_plus'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['households']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['households']['Insert']>
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          display_name: string
          avatar_colour: string
          role: 'admin' | 'member'
          push_token: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['household_members']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['household_members']['Insert']>
      }
      chores: {
        Row: {
          id: string
          household_id: string
          name: string
          emoji: string
          points: number
          time_of_day: 'morning' | 'afternoon' | 'evening' | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chores']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chores']['Insert']>
      }
      chore_logs: {
        Row: {
          id: string
          household_id: string
          chore_id: string
          user_id: string
          points_earned: number
          time_of_day: 'morning' | 'afternoon' | 'evening'
          method: 'manual' | 'qr' | 'ai_vision'
          photo_url: string | null
          logged_at: string
        }
        Insert: Omit<Database['public']['Tables']['chore_logs']['Row'], 'id' | 'logged_at'>
        Update: Partial<Database['public']['Tables']['chore_logs']['Insert']>
      }
      point_rules: {
        Row: {
          id: string
          household_id: string
          weekend_multiplier: number
          streak_bonus_per_day: number
          early_bird_bonus: number
        }
        Insert: Omit<Database['public']['Tables']['point_rules']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['point_rules']['Insert']>
      }
      prizes: {
        Row: {
          id: string
          household_id: string
          week_start: string
          description: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['prizes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['prizes']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      plan_type: 'free' | 'family' | 'family_plus'
      role_type: 'admin' | 'member'
      time_of_day_type: 'morning' | 'afternoon' | 'evening'
      log_method_type: 'manual' | 'qr' | 'ai_vision'
    }
  }
}
