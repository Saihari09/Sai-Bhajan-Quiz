import type { Bhajan } from '../types/bhajan'
import { loadBhajans, loadSchedule } from './schedule'
import { hashString, pickSeeded } from './seeded'

export type GameId =
  | 'heardle' | 'wordsearch' | 'antakshari' | 'lyrictrail'
  | 'crossword' | 'deity' | 'linebuilder'

export interface WeekdayFamily {
  label: string
  tags: string[]
  emoji: string
}

export interface DeitiesData {
  weekdayFamilies: Record<string, WeekdayFamily>
  nameBanks: Record<string, string[]>
}

export interface Quote {
  id: string
  text: string
  author: string
}

let deitiesCache: DeitiesData | null = null
let quotesCache: Quote[] | null = null

export async function loadDeities(): Promise<DeitiesData> {
  if (deitiesCache) return deitiesCache
  const res = await fetch(import.meta.env.BASE_URL + 'data/deities.json')
  deitiesCache = await res.json()
  return deitiesCache!
}

export async function loadQuotes(): Promise<Quote[]> {
  if (quotesCache) return quotesCache
  const res = await fetch(import.meta.env.BASE_URL + 'data/quotes.json')
  quotesCache = await res.json()
  return quotesCache!
}

/** Noon-anchored so the weekday never shifts across timezones/DST. */
export function weekdayOf(date: string): number {
  return new Date(date + 'T12:00:00').getDay()
}

/**
 * Sai's launch lineup & order (Jul 2026). Antakshari and Lyric Trail are
 * off the hub but their routes stay alive at /play/antakshari, /play/lyrictrail.
 */
export const ALL_GAMES: GameId[] = ['heardle', 'linebuilder', 'crossword', 'wordsearch', 'deity']

export const GAME_META: Record<GameId, { emoji: string; title: string; subtitle: string }> = {
  heardle: { emoji: '🎵', title: 'Guess the Bhajan', subtitle: 'Name it from the melody' },
  linebuilder: { emoji: '🧩', title: 'Build the Line', subtitle: 'Lay the words in order' },
  crossword: { emoji: '✏️', title: 'Bhajan Crossword', subtitle: "Clued from today's bhajan" },
  wordsearch: { emoji: '🔡', title: 'Naamavali Search', subtitle: 'One name hides in each grid' },
  deity: { emoji: '🖼️', title: 'Guess the Deity', subtitle: 'Un-scramble the darshan' },
  antakshari: { emoji: '🎤', title: 'Antakshari', subtitle: 'Sing on from the syllable' },
  lyrictrail: { emoji: '🪷', title: 'Lyric Trail', subtitle: 'Trace the winding line' },
}

/** All games run every day (Sai's call, Jul 2026). */
export function gamesForDate(): GameId[] {
  return ALL_GAMES
}

export interface DailyBundle {
  date: string
  weekday: number
  family: WeekdayFamily
  bhajan: Bhajan
  games: GameId[]
  quote: Quote
  nameBank: string[]
}

/**
 * V2 bhajan-of-the-day selection:
 * 1. An explicit schedule.json entry always wins (V1 dates stay stable).
 * 2. Otherwise pick date-deterministically from the weekday's deity family
 *    (weighted preference per plan §A2.3), falling back to the whole library.
 */
async function selectBhajan(date: string, family: WeekdayFamily): Promise<Bhajan> {
  const [bhajans, schedule] = await Promise.all([loadBhajans(), loadSchedule()])

  const entry = schedule.schedule.find((s) => s.date === date)
  if (entry) {
    const scheduled = bhajans.find((b) => b.id === entry.bhajanId)
    if (scheduled) return scheduled
  }

  const pool = bhajans.filter((b) => family.tags.includes(b.deity))
  const source = pool.length > 0 ? pool : bhajans
  return source[hashString(date + ':bhajan') % source.length]
}

export async function getDailyBundle(date: string): Promise<DailyBundle> {
  const [deities, quotes] = await Promise.all([loadDeities(), loadQuotes()])
  const weekday = weekdayOf(date)
  const family = deities.weekdayFamilies[String(weekday)]
  const bhajan = await selectBhajan(date, family)

  // Word-search names come from the day's bhajan deity when it has a bank,
  // else from the weekday family's first tag with a bank.
  const nameBank =
    deities.nameBanks[bhajan.deity] ??
    family.tags.map((t) => deities.nameBanks[t]).find(Boolean) ??
    deities.nameBanks['sarva-dharma']

  return {
    date,
    weekday,
    family,
    bhajan,
    games: gamesForDate(),
    quote: pickSeeded(quotes, date + ':quote'),
    nameBank,
  }
}
