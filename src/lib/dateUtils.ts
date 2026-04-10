import { format, parseISO, differenceInCalendarDays } from 'date-fns'

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}

export function daysSince(pastDate: string, today: string): number {
  return differenceInCalendarDays(parseISO(today), parseISO(pastDate))
}
