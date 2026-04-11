import type { RoundNumber, RoundResult } from '../types/game'

const ROUND_CONFIGS = {
  1: { timeLimitMs: 60_000, basePoints: 60, maxSpeedBonus: 40 },
  2: { timeLimitMs: 60_000, basePoints: 60, maxSpeedBonus: 40 },
  3: { timeLimitMs: 60_000, basePoints: 60, maxSpeedBonus: 40 },
} as const

export function getTimeLimitMs(round: RoundNumber): number {
  return ROUND_CONFIGS[round].timeLimitMs
}

export function calculateRoundScore(round: RoundNumber, isCorrect: boolean, timeSpentMs: number): RoundResult {
  const config = ROUND_CONFIGS[round]

  if (!isCorrect || timeSpentMs >= config.timeLimitMs) {
    return {
      round,
      isCorrect: false,
      timeSpentMs,
      timeLimitMs: config.timeLimitMs,
      basePoints: 0,
      speedBonus: 0,
      totalPoints: 0,
    }
  }

  const timeRatio = 1 - timeSpentMs / config.timeLimitMs
  const speedBonus = Math.round(config.maxSpeedBonus * timeRatio)

  return {
    round,
    isCorrect: true,
    timeSpentMs,
    timeLimitMs: config.timeLimitMs,
    basePoints: config.basePoints,
    speedBonus,
    totalPoints: config.basePoints + speedBonus,
  }
}

export function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak >= 7) return 100
  if (currentStreak >= 5) return 75
  if (currentStreak >= 3) return 50
  return 0
}

export function calculateFinalScore(roundResults: RoundResult[], currentStreak: number) {
  const roundTotal = roundResults.reduce((sum, r) => sum + r.totalPoints, 0)
  const allCorrect = roundResults.every(r => r.isCorrect)
  const streakBonus = allCorrect ? calculateStreakBonus(currentStreak) : 0
  return { roundTotal, streakBonus, finalScore: roundTotal + streakBonus, allCorrect }
}
