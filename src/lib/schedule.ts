import type { Bhajan, Schedule } from '../types/bhajan'
import { getTodayString } from './dateUtils'

let bhajansCache: Bhajan[] | null = null
let scheduleCache: Schedule | null = null

export async function loadBhajans(): Promise<Bhajan[]> {
  if (bhajansCache) return bhajansCache
  const res = await fetch(import.meta.env.BASE_URL + 'data/bhajans.json')
  bhajansCache = await res.json()
  return bhajansCache!
}

export async function loadSchedule(): Promise<Schedule> {
  if (scheduleCache) return scheduleCache
  const res = await fetch(import.meta.env.BASE_URL + 'data/schedule.json')
  scheduleCache = await res.json()
  return scheduleCache!
}

/**
 * Deterministic hash: same date always maps to the same bhajan for all
 * users, so everyone sees the same "puzzle of the day" even on days
 * covered by random-repeat rather than an explicit schedule entry.
 */
function hashDateToIndex(dateStr: string, poolSize: number): number {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h) + dateStr.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) % poolSize
}

export async function getBhajanForDate(date: string): Promise<Bhajan> {
  const [bhajans, schedule] = await Promise.all([loadBhajans(), loadSchedule()])

  const entry = schedule.schedule.find(s => s.date === date)
  if (entry) {
    const bhajan = bhajans.find(b => b.id === entry.bhajanId)
    if (bhajan) return bhajan
  }

  // No explicit schedule entry. If we're past the last scheduled date,
  // pick a random bhajan seeded by the date so the game keeps rotating
  // through the catalog until version 2 ships. Same date → same bhajan
  // for every user, so streaks and shares still make sense.
  const lastScheduled = schedule.schedule.reduce(
    (max, s) => (s.date > max ? s.date : max),
    '',
  )
  if (date > lastScheduled && bhajans.length > 0) {
    return bhajans[hashDateToIndex(date, bhajans.length)]
  }

  // Fallback for edge cases (dates before schedule start, missing ID, etc.)
  const fallback = bhajans.find(b => b.id === schedule.fallbackBhajanId)
  return fallback ?? bhajans[0]
}

export async function getTodayBhajan(): Promise<Bhajan> {
  const today = getTodayString()
  return getBhajanForDate(today)
}

export async function getBhajanById(bhajanId: string): Promise<Bhajan | null> {
  const bhajans = await loadBhajans()
  return bhajans.find((b) => b.id === bhajanId) ?? null
}

export async function getPastSchedule(): Promise<{ date: string; bhajanId: string }[]> {
  const schedule = await loadSchedule()
  const today = getTodayString()
  return schedule.schedule.filter(s => s.date < today)
}
