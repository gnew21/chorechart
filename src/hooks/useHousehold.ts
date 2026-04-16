import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember } from '../types'

export function useHousehold(userId: string | undefined) {
  const [household, setHousehold] = useState<Household | null>(null)
  const [member, setMember] = useState<HouseholdMember | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: memberData, error: memberErr } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (memberErr) throw memberErr
      if (!memberData) {
        setMember(null)
        setHousehold(null)
        setMembers([])
        return
      }

      setMember(memberData)

      const { data: hhData, error: hhErr } = await supabase
        .from('households')
        .select('*')
        .eq('id', memberData.household_id)
        .single()

      if (hhErr) throw hhErr
      setHousehold(hhData)

      const { data: allMembers, error: membersErr } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', memberData.household_id)
        .order('created_at')

      if (membersErr) throw membersErr
      setMembers(allMembers ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { household, member, members, loading, error, refresh: load }
}
