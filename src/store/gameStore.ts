import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { RoundNumber, RoundResult, GameState } from '../types/game'

interface GameActions {
  startGame: (bhajanId: string) => void
  addRoundResult: (result: RoundResult) => void
  advanceRound: () => void
  markComplete: () => void
  resetGame: () => void
}

type GameStoreType = GameState & GameActions

export const useGameStore = create<GameStoreType>()(
  persist(
    (set) => ({
      currentRound: 1 as RoundNumber,
      bhajanId: '',
      roundResults: [],
      isComplete: false,
      startedAt: 0,

      startGame: (bhajanId: string) =>
        set({
          currentRound: 1,
          bhajanId,
          roundResults: [],
          isComplete: false,
          startedAt: Date.now(),
        }),

      addRoundResult: (result: RoundResult) =>
        set((s) => ({ roundResults: [...s.roundResults, result] })),

      advanceRound: () =>
        set((s) => ({
          currentRound: Math.min(s.currentRound + 1, 3) as RoundNumber,
        })),

      markComplete: () => set({ isComplete: true }),

      resetGame: () =>
        set({
          currentRound: 1,
          bhajanId: '',
          roundResults: [],
          isComplete: false,
          startedAt: 0,
        }),
    }),
    {
      name: 'sai-bhajan-game',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
