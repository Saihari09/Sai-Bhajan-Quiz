import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DayResult, GameState, PersistedState } from '../types/game'
import { daysSince } from '../lib/dateUtils'

interface StreakActions {
  checkAndResetStreak: (today: string) => void
  incrementStreak: () => void
  resetStreak: () => void
  recordDay: (result: DayResult) => void
  saveTodayProgress: (state: GameState | null) => void
  setTodayResult: (result: DayResult) => void
  clearForNewDay: (today: string) => void
}

type StreakStore = PersistedState & StreakActions

export const useStreakStore = create<StreakStore>()(
  persist(
    (set, get) => ({
      version: 1,
      lastPlayedDate: null,
      currentStreak: 0,
      longestStreak: 0,
      totalGamesPlayed: 0,
      history: [],
      todayGameState: null,
      todayResult: null,

      checkAndResetStreak: (today: string) => {
        const { lastPlayedDate } = get()
        if (!lastPlayedDate) return
        const gap = daysSince(lastPlayedDate, today)
        if (gap > 1) {
          set({ currentStreak: 0 })
        }
      },

      incrementStreak: () =>
        set((s) => ({
          currentStreak: s.currentStreak + 1,
          longestStreak: Math.max(s.longestStreak, s.currentStreak + 1),
        })),

      resetStreak: () => set({ currentStreak: 0 }),

      recordDay: (result: DayResult) =>
        set((s) => ({
          lastPlayedDate: result.date,
          totalGamesPlayed: s.totalGamesPlayed + 1,
          history: [...s.history.slice(-29), result],
          todayGameState: null,
          todayResult: result,
        })),

      saveTodayProgress: (state: GameState | null) =>
        set({ todayGameState: state }),

      setTodayResult: (result: DayResult) =>
        set({ todayResult: result }),

      clearForNewDay: (today: string) => {
        const { lastPlayedDate } = get()
        if (lastPlayedDate && lastPlayedDate !== today) {
          set({ todayGameState: null, todayResult: null })
        }
      },
    }),
    {
      name: 'sai-bhajan-streak',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)
