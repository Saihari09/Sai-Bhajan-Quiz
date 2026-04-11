import { format, parseISO, differenceInCalendarDays } from 'date-fns'

// Dev-only: persists ?date= override across route navigations
let _devDateOverride: string | null = null
if (import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search)
  _devDateOverride = params.get('date')
}

export function getTodayString(): string {
  if (import.meta.env.DEV && _devDateOverride) return _devDateOverride
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}

export function daysSince(pastDate: string, today: string): number {
  return differenceInCalendarDays(parseISO(today), parseISO(pastDate))
}
