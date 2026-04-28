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

export async function getBhajanForDate(date: string): Promise<Bhajan> {
  const [bhajans, schedule] = await Promise.all([loadBhajans(), loadSchedule()])

  const entry = schedule.schedule.find(s => s.date === date)
  const bhajanId = entry?.bhajanId ?? schedule.fallbackBhajanId

  const bhajan = bhajans.find(b => b.id === bhajanId)
  if (!bhajan) {
    return bhajans[0]
  }
  return bhajan
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
