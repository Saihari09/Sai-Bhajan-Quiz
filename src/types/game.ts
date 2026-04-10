export type RoundNumber = 1 | 2 | 3

export interface RoundResult {
  round: RoundNumber
  isCorrect: boolean
  timeSpentMs: number
  timeLimitMs: number
  basePoints: number
  speedBonus: number
  totalPoints: number
}

export interface GameState {
  currentRound: RoundNumber
  bhajanId: string
  roundResults: RoundResult[]
  isComplete: boolean
  startedAt: number
}

export interface DayResult {
  date: string
  bhajanId: string
  roundResults: RoundResult[]
  totalScore: number
  streakBonus: number
  finalScore: number
  allCorrect: boolean
}

export interface PersistedState {
  version: number
  lastPlayedDate: string | null
  currentStreak: number
  longestStreak: number
  totalGamesPlayed: number
  history: DayResult[]
  todayGameState: GameState | null
  todayResult: DayResult | null
}
