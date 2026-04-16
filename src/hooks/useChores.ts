import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Chore, ChoreLog } from '../types'
import { getWeekStart, getWeekEnd } from '../utils/dates'

export function useChores(householdId: string | undefined) {
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!householdId) return
    const { data } = await supabase
      .from('chores')
      .select('*')
      .eq('household_id', householdId)
      .eq('active', true)
      .order('name')
    setChores(data ?? [])
    setLoading(false)
  }, [householdId])

  useEffect(() => { load() }, [load])

  return { chores, loading, refresh: load }
}

export function useWeeklyLogs(householdId: string | undefined) {
  const [logs, setLogs] = useState<ChoreLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!householdId) return
    const start = getWeekStart().toISOString()
    const end = getWeekEnd().toISOString()
    const { data } = await supabase
      .from('chore_logs')
      .select('*')
      .eq('household_id', householdId)
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }, [householdId])

  useEffect(() => { load() }, [load])

  return { logs, loading, refresh: load }
}
