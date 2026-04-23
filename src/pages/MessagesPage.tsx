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

type Chat = 'group' | string // string = user_id of DM recipient

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

  // Realtime subscription
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Sidebar / chat list */}
      {!chat || chat === 'group' && messages.length === 0 ? null : null}

      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500 px-5 pt-14 pb-4 flex-shrink-0">
        <h1 className="text-white text-2xl font-bold">Messages</h1>
        {/* Chat selector */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setChat('group')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${chat === 'group' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}
          >
            <span>👨‍👩‍👧‍👦</span> Group
          </button>
          {otherMembers.map(m => (
            <button
              key={m.user_id}
              onClick={() => setChat(m.user_id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${chat === m.user_id ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}
            >
              <Avatar name={m.display_name} colour={m.avatar_colour} size="sm" />
              {m.display_name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">
              {chat === 'group' ? '👨‍👩‍👧‍👦' : '💬'}
            </div>
            <p className="text-gray-500 font-medium">
              {chat === 'group' ? 'Start the group conversation' : `Start a chat with ${chatPartner?.display_name}`}
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
              {/* Avatar space */}
              <div className="w-7 flex-shrink-0">
                {showAvatar && sender && (
                  <Avatar name={sender.display_name} colour={sender.avatar_colour} size="sm" />
                )}
              </div>

              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {showAvatar && !isMe && sender && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">{sender.display_name}</p>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-emerald-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                  {msg.body}
                </div>
                <p className="text-xs text-gray-400 mt-1 mx-1">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 pb-24 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chat === 'group' ? 'Message the family…' : `Message ${chatPartner?.display_name}…`}
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
