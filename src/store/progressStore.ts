import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GameId } from '../lib/daily'

export interface GameResult {
  points: number
  completedAt: string
}

export interface DayProgress {
  results: Partial<Record<GameId, GameResult>>
  /** Listening to the Bhajan of the Day also lights the day's lamp. */
  listened?: boolean
}

interface ProgressState {
  days: Record<string, DayProgress>
  /** Days played in V1, credited toward the 108-lamp Mala. */
  v1Credit: number
  v1LongestStreak: number
  migratedFromV1: boolean
  justMigrated: boolean
  recordResult: (date: string, game: GameId, points: number) => void
  markListened: (date: string) => void
  ackMigration: () => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      days: {},
      v1Credit: 0,
      v1LongestStreak: 0,
      migratedFromV1: false,
      justMigrated: false,

      // First completion locks the score — replays are for joy, not grinding.
      recordResult: (date, game, points) => {
        const day = get().days[date] ?? { results: {} }
        if (day.results[game]) return
        set({
          days: {
            ...get().days,
            [date]: {
              ...day,
              results: {
                ...day.results,
                [game]: { points, completedAt: new Date().toISOString() },
              },
            },
          },
        })
      },

      markListened: (date) => {
        const day = get().days[date] ?? { results: {} }
        if (day.listened) return
        set({ days: { ...get().days, [date]: { ...day, listened: true } } })
      },

      ackMigration: () => set({ justMigrated: false }),
    }),
    {
      name: 'bhajan-bodh-progress',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

/** One-time V1 → V2 migration: streak history becomes Mala lamp credit. */
export function migrateFromV1() {
  const store = useProgressStore.getState()
  if (store.migratedFromV1) return
  try {
    const raw = localStorage.getItem('sai-bhajan-streak')
    if (raw) {
      const v1 = JSON.parse(raw)?.state
      const credit = Number(v1?.totalGamesPlayed) || 0
      const longest = Number(v1?.longestStreak) || 0
      useProgressStore.setState({
        v1Credit: credit,
        v1LongestStreak: longest,
        migratedFromV1: true,
        justMigrated: credit > 0,
      })
      return
    }
  } catch {
    // Corrupt or absent V1 data — nothing to migrate.
  }
  useProgressStore.setState({ migratedFromV1: true })
}

export function dayLampLit(day: DayProgress | undefined): boolean {
  if (!day) return false
  return day.listened === true || Object.keys(day.results).length > 0
}

export function lifetimeLamps(state: Pick<ProgressState, 'days' | 'v1Credit'>): number {
  const v2Days = Object.values(state.days).filter(dayLampLit).length
  return state.v1Credit + v2Days
}

export function dayPoints(day: DayProgress | undefined): number {
  if (!day) return 0
  return Object.values(day.results).reduce((sum, r) => sum + (r?.points ?? 0), 0)
}
