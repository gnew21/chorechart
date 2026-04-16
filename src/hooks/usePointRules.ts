import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { PointRules } from '../types'

export function usePointRules(householdId: string | undefined) {
  const [rules, setRules] = useState<PointRules | null>(null)

  useEffect(() => {
    if (!householdId) return
    supabase
      .from('point_rules')
      .select('*')
      .eq('household_id', householdId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRules({
            weekend_multiplier: data.weekend_multiplier,
            streak_bonus_per_day: data.streak_bonus_per_day,
            early_bird_bonus: data.early_bird_bonus,
          })
        }
      })
  }, [householdId])

  return rules
}
