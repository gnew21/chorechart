import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember } from '../types'

interface Event {
  id: string
  household_id: string
  created_by: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  colour: string
  created_at: string
}

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
}

const EVENT_COLOURS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15', '#34d399', '#f87171']

export function CalendarPage({ household, member, members }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [colour, setColour] = useState(EVENT_COLOURS[0])
  const [saving, setSaving] = useState(false)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('household_id', household.id)
      .gte('event_date', start)
      .lte('event_date', end)
      .order('event_date')
    setEvents(data ?? [])
    setLoading(false)
  }, [household.id, currentMonth])

  useEffect(() => { loadEvents() }, [loadEvents])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startOffset = (startOfMonth(currentMonth).getDay() + 6) % 7

  function eventsForDay(day: Date) {
    return events.filter(e => isSameDay(new Date(e.event_date + 'T00:00:00'), day))
  }

  function openAdd(day?: Date) {
    setTitle('')
    setDescription('')
    setEventDate(day ? format(day, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    setEventTime('')
    setColour(EVENT_COLOURS[0])
    setShowAdd(true)
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const { error } = await supabase.from('events').insert({
      household_id: household.id,
      created_by: member.user_id,
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate,
      event_time: eventTime || null,
      colour,
    })
    setSaving(false)
    if (!error) {
      setShowAdd(false)
      loadEvents()
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  const memberMap = new Map(members.map(m => [m.user_id, m]))
  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-400 px-5 pt-14 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Calendar</h1>
            <p className="text-pink-100 text-sm mt-0.5">{format(currentMonth, 'MMMM yyyy')}</p>
          </div>
          <button
            onClick={() => openAdd()}
            className="w-10 h-10 bg-white/20 text-white rounded-2xl text-2xl flex items-center justify-center font-light active:scale-95 transition-all"
          >+</button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Calendar card */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold">‹</button>
            <p className="font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</p>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold">›</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`off-${i}`} />)}
            {days.map(day => {
              const dayEvents = eventsForDay(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date('')) ? null : day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 transition-all ${
                    isSelected ? 'bg-rose-500 text-white' :
                    isToday(day) ? 'bg-rose-50 text-rose-600 font-bold' :
                    !isSameMonth(day, currentMonth) ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map(e => (
                      <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : e.colour }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="font-bold text-gray-900">{format(selectedDay, 'EEEE, MMMM d')}</p>
              <button onClick={() => openAdd(selectedDay)} className="text-sm text-rose-500 font-semibold">+ Add</button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No events — tap + to add one</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(event => {
                  const creator = memberMap.get(event.created_by)
                  return (
                    <div key={event.id} className="card flex items-start gap-3 p-4">
                      <div className="w-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: event.colour, height: 44 }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        {event.event_time && <p className="text-xs text-gray-500 mt-0.5">🕐 {event.event_time.slice(0, 5)}</p>}
                        {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                        {creator && <p className="text-xs text-gray-400 mt-1">by {creator.display_name}</p>}
                      </div>
                      {event.created_by === member.user_id && (
                        <button onClick={() => handleDelete(event.id)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 text-lg flex items-center justify-center">×</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* This month's events */}
        {!selectedDay && !loading && (
          <div>
            <p className="font-bold text-gray-900 mb-2 px-1">This Month</p>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No events this month</p>
            ) : (
              <div className="space-y-2">
                {events.map(event => (
                  <div key={event.id} className="card flex items-center gap-3 p-3.5">
                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.colour }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-400">{format(new Date(event.event_date + 'T00:00:00'), 'MMM d')}{event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ''}</p>
                    </div>
                    {event.created_by === member.user_id && (
                      <button onClick={() => handleDelete(event.id)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto sheet-enter shadow-2xl">
            <div className="flex justify-center pt-1 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add Event</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg">&times;</button>
            </div>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title"
              className="input"
            />

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Time (optional)</label>
                <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="input text-sm" />
              </div>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="input resize-none"
            />

            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {EVENT_COLOURS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColour(c)}
                    className={`w-9 h-9 rounded-full border-4 transition-all ${colour === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !eventDate}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
