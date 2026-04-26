import { useState, useEffect, useRef, useCallback } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/Avatar'
import type { Household, HouseholdMember } from '../types'

interface Message {
  id: string
  household_id: string
  sender_id: string
  recipient_id: string | null
  body: string
  created_at: string
}

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
}

type Chat = 'group' | string

function formatTime(ts: string) {
  const d = new Date(ts)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export function MessagesPage({ household, member, members }: Props) {
  const [chat, setChat] = useState<Chat>('group')
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const memberMap = new Map(members.map(m => [m.user_id, m]))
  const otherMembers = members.filter(m => m.user_id !== member.user_id)

  const loadMessages = useCallback(async () => {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: true })

    if (chat === 'group') {
      query = query.is('recipient_id', null)
    } else {
      query = query.or(
        `and(sender_id.eq.${member.user_id},recipient_id.eq.${chat}),and(sender_id.eq.${chat},recipient_id.eq.${member.user_id})`
      )
    }

    const { data } = await query
    setMessages(data ?? [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [household.id, chat, member.user_id])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${household.id}-${chat}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `household_id=eq.${household.id}`,
      }, () => { loadMessages() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [household.id, chat, loadMessages])

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      household_id: household.id,
      sender_id: member.user_id,
      recipient_id: chat === 'group' ? null : chat,
      body: body.trim(),
    })
    setBody('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const chatPartner = chat !== 'group' ? memberMap.get(chat) : null

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex-shrink-0" style={{ backgroundColor: '#F5F5F7' }}>
        <h1 className="page-title">Messages</h1>
      </div>

      {/* Chat selector */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setChat('group')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] flex-shrink-0 font-semibold transition-all active:opacity-70"
            style={{
              backgroundColor: chat === 'group' ? '#1D1D1F' : 'white',
              color: chat === 'group' ? 'white' : '#86868B',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <span>👨‍👩‍👧‍👦</span>
            <span>Group</span>
          </button>
          {otherMembers.map(m => (
            <button
              key={m.user_id}
              onClick={() => setChat(m.user_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] flex-shrink-0 font-semibold transition-all active:opacity-70"
              style={{
                backgroundColor: chat === m.user_id ? '#1D1D1F' : 'white',
                color: chat === m.user_id ? 'white' : '#86868B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <Avatar name={m.display_name} colour={m.avatar_colour} size="sm" />
              {m.display_name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3"
              style={{ backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              {chat === 'group' ? '👨‍👩‍👧‍👦' : '💬'}
            </div>
            <p className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>
              {chat === 'group' ? 'Start the group conversation' : `Chat with ${chatPartner?.display_name}`}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === member.user_id
          const sender = memberMap.get(msg.sender_id)
          const prevMsg = messages[i - 1]
          const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-7 flex-shrink-0">
                {showAvatar && sender && (
                  <Avatar name={sender.display_name} colour={sender.avatar_colour} size="sm" />
                )}
              </div>

              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && sender && (
                  <p className="text-[12px] mb-1 ml-1" style={{ color: '#86868B' }}>{sender.display_name}</p>
                )}
                <div
                  className="px-4 py-2.5 rounded-2xl text-[14px]"
                  style={
                    isMe
                      ? { backgroundColor: '#1D1D1F', color: 'white', borderBottomRightRadius: 4 }
                      : { backgroundColor: 'white', color: '#1D1D1F', borderBottomLeftRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
                  }
                >
                  {msg.body}
                </div>
                <p className="text-[11px] mt-1 mx-1" style={{ color: '#86868B' }}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="px-4 py-3 pb-24 flex-shrink-0"
        style={{ backgroundColor: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chat === 'group' ? 'Message the family…' : `Message ${chatPartner?.display_name}…`}
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl text-[14px] focus:outline-none resize-none"
            style={{
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
              maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-opacity disabled:opacity-30 active:opacity-70 flex-shrink-0"
            style={{ backgroundColor: '#1D1D1F', color: 'white' }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
