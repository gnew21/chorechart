import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember } from '../types'

interface Update {
  id: string
  household_id: string
  posted_by: string
  title: string
  body: string | null
  created_at: string
}

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
}

export function UpdatesPage({ household, member, members }: Props) {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const isAdmin = member.role === 'admin'

  const loadUpdates = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('updates')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
    setUpdates(data ?? [])
    setLoading(false)
  }, [household.id])

  useEffect(() => { loadUpdates() }, [loadUpdates])

  async function handlePost() {
    if (!title.trim()) return
    setPosting(true)
    await supabase.from('updates').insert({
      household_id: household.id,
      posted_by: member.user_id,
      title: title.trim(),
      body: body.trim() || null,
    })
    setTitle('')
    setBody('')
    setPosting(false)
    loadUpdates()
  }

  async function handleDelete(id: string) {
    await supabase.from('updates').delete().eq('id', id)
    loadUpdates()
  }

  const memberMap = new Map(members.map(m => [m.user_id, m]))

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 px-5 pt-14 pb-8">
        <h1 className="text-white text-2xl font-bold">Updates</h1>
        <p className="text-indigo-100 text-sm mt-0.5">{household.name}</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Post form — admins only */}
        {isAdmin && (
          <div className="card p-4 space-y-3">
            <h2 className="font-bold text-gray-900">Post an Update</h2>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title (e.g. Chore schedule change)"
              className="input"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Details (optional)"
              rows={3}
              className="input resize-none"
            />
            <button
              onClick={handlePost}
              disabled={posting || !title.trim()}
              className="btn-primary"
            >
              {posting ? 'Posting…' : 'Post Update 📢'}
            </button>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-400">Loading…</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm">📢</div>
            <p className="text-gray-700 font-bold text-lg">No updates yet</p>
            {isAdmin && <p className="text-gray-400 text-sm mt-1">Post one above to notify your family</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map(update => {
              const poster = memberMap.get(update.posted_by)
              return (
                <div key={update.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                      📢
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{update.title}</p>
                      {update.body && <p className="text-sm text-gray-600 mt-1">{update.body}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        {poster && (
                          <span className="text-xs text-gray-400">{poster.display_name}</span>
                        )}
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{format(new Date(update.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    {update.posted_by === member.user_id && (
                      <button
                        onClick={() => handleDelete(update.id)}
                        className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-lg flex-shrink-0"
                      >×</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
