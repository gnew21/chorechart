import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns'

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekDays(date: Date = new Date()): Date[] {
  return eachDayOfInterval({ start: getWeekStart(date), end: getWeekEnd(date) })
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isBeforeNineAM(date: Date): boolean {
  return date.getHours() < 9
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'EEE, MMM d')
}

export function formatTime(date: Date): string {
  return format(date, 'h:mm a')
}
