import { format, parseISO, differenceInCalendarDays } from 'date-fns'

export function realTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Active puzzle date. A valid ?date=YYYY-MM-DD in the URL selects a PAST
 * day (the "Previous days" archive); future dates are ignored so nobody
 * peeks ahead. No param → today.
 */
export function getTodayString(): string {
  const param = new URLSearchParams(window.location.search).get('date')
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param) && param <= realTodayString()) {
    return param
  }
  return realTodayString()
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}

export function daysSince(pastDate: string, today: string): number {
  return differenceInCalendarDays(parseISO(today), parseISO(pastDate))
}
