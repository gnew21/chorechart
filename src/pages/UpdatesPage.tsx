import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember } from '../types'
import { Avatar } from '../components/Avatar'

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
    await supabase.functions.invoke('send-push', {
      body: { household_id: household.id, title: `📢 ${title.trim()}`, body: body.trim() || undefined, url: '/updates' },
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
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6" style={{ backgroundColor: '#F5F5F7' }}>
        <h1 className="page-title">Updates</h1>
        <p className="text-[15px] mt-1 tracking-[-0.01em]" style={{ color: '#86868B' }}>{household.name}</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Post form — admins only */}
        {isAdmin && (
          <div className="card p-4 space-y-3">
            <p className="section-label">Post an Update</p>
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
              {posting ? 'Posting…' : 'Post Update'}
            </button>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: '#86868B' }}>Loading…</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
              style={{ backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              📢
            </div>
            <p className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>No updates yet</p>
            {isAdmin && (
              <p className="text-[15px] mt-1" style={{ color: '#86868B' }}>Post one above to notify your family</p>
            )}
          </div>
        ) : (
          <>
            <p className="section-label px-1">Recent</p>
            <div className="card overflow-hidden">
              {updates.map((update, idx) => {
                const poster = memberMap.get(update.posted_by)
                return (
                  <div
                    key={update.id}
                    className={`px-4 py-4 ${idx < updates.length - 1 ? 'border-b border-black/[0.04]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: '#F5F5F7' }}
                      >
                        📢
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>{update.title}</p>
                        {update.body && (
                          <p className="text-[13px] mt-1" style={{ color: '#86868B' }}>{update.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {poster && (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={poster.display_name} colour={poster.avatar_colour} size="sm" />
                              <span className="text-[12px]" style={{ color: '#86868B' }}>{poster.display_name}</span>
                            </div>
                          )}
                          <span className="text-[12px]" style={{ color: '#C7C7CC' }}>·</span>
                          <span className="text-[12px]" style={{ color: '#86868B' }}>{format(new Date(update.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      {update.posted_by === member.user_id && (
                        <button
                          onClick={() => handleDelete(update.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-lg active:opacity-70 transition-opacity flex-shrink-0"
                          style={{ backgroundColor: '#F5F5F7', color: '#86868B' }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
