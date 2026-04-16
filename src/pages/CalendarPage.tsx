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
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
          <button
            onClick={() => openAdd()}
            className="w-8 h-8 bg-green-500 text-white rounded-full text-xl flex items-center justify-center"
          >+</button>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="text-gray-400 text-xl px-2">‹</button>
          <p className="font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</p>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="text-gray-400 text-xl px-2">›</button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`off-${i}`} />)}
          {days.map(day => {
            const dayEvents = eventsForDay(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date('')) ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-1 transition-all ${
                  isSelected ? 'bg-green-500 text-white' :
                  isToday(day) ? 'bg-green-50 text-green-600 font-bold' :
                  !isSameMonth(day, currentMonth) ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <span className="text-xs">{format(day, 'd')}</span>
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 3).map(e => (
                    <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? 'white' : e.colour }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800">{format(selectedDay, 'EEEE, MMMM d')}</p>
              <button onClick={() => openAdd(selectedDay)} className="text-sm text-green-600 font-medium">+ Add</button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No events — tap + to add one</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(event => {
                  const creator = memberMap.get(event.created_by)
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="w-3 h-full mt-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: event.colour, minHeight: 12 }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {event.event_time && <p className="text-xs text-gray-500">🕐 {event.event_time.slice(0, 5)}</p>}
                        {event.description && <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>}
                        {creator && <p className="text-xs text-gray-400 mt-1">Added by {creator.display_name}</p>}
                      </div>
                      {event.created_by === member.user_id && (
                        <button onClick={() => handleDelete(event.id)} className="text-gray-300 text-lg">×</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Upcoming events */}
        {!selectedDay && !loading && (
          <div className="mt-6">
            <p className="font-semibold text-gray-700 mb-3">This Month</p>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No events this month</p>
            ) : (
              <div className="space-y-2">
                {events.map(event => {
                  return (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.colour }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-400">{format(new Date(event.event_date + 'T00:00:00'), 'MMM d')}{event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ''}</p>
                      </div>
                      {event.created_by === member.user_id && (
                        <button onClick={() => handleDelete(event.id)} className="text-gray-300 text-lg">×</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Add Event</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-2xl">×</button>
            </div>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Time (optional)</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none"
            />

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {EVENT_COLOURS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColour(c)}
                    className={`w-8 h-8 rounded-full border-4 transition-all ${colour === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !eventDate}
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
