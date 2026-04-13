import type { RoundNumber, RoundResult } from '../types/game'

const ROUND_CONFIGS = {
  1: { timeLimitMs: 60_000, basePoints: 60, maxSpeedBonus: 40 },
  2: { timeLimitMs: 60_000, basePoints: 60, maxSpeedBonus: 40 },
  3: { timeLimitMs: 60_000, basePoints: 60, maxSpeedBonus: 40 },
} as const

export function getTimeLimitMs(round: RoundNumber): number {
  return ROUND_CONFIGS[round].timeLimitMs
}

export function calculateRoundScore(
  round: RoundNumber,
  isCorrect: boolean,
  timeSpentMs: number,
  userAnswer: string,
  correctAnswer: string,
  accuracy?: number,
): RoundResult {
  const config = ROUND_CONFIGS[round]

  // Perfect answer → full base + speed bonus
  if (isCorrect) {
    const timeRatio = Math.max(0, 1 - timeSpentMs / config.timeLimitMs)
    const speedBonus = Math.round(config.maxSpeedBonus * timeRatio)
    return {
      round,
      isCorrect: true,
      timeSpentMs,
      timeLimitMs: config.timeLimitMs,
      basePoints: config.basePoints,
      speedBonus,
      totalPoints: config.basePoints + speedBonus,
      userAnswer,
      correctAnswer,
    }
  }

  // Partial credit for rounds 2 & 3 (word order) — proportional base points, no speed bonus
  const ratio = accuracy ?? 0
  if (ratio > 0 && (round === 2 || round === 3)) {
    const partialBase = Math.round(config.basePoints * ratio)
    return {
      round,
      isCorrect: false,
      timeSpentMs,
      timeLimitMs: config.timeLimitMs,
      basePoints: partialBase,
      speedBonus: 0,
      totalPoints: partialBase,
      userAnswer,
      correctAnswer,
    }
  }

  // Completely wrong → 0
  return {
    round,
    isCorrect: false,
    timeSpentMs,
    timeLimitMs: config.timeLimitMs,
    basePoints: 0,
    speedBonus: 0,
    totalPoints: 0,
    userAnswer,
    correctAnswer,
  }
}

export function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak >= 3) return 10
  return 0
}

export function calculateFinalScore(roundResults: RoundResult[], currentStreak: number) {
  const roundTotal = roundResults.reduce((sum, r) => sum + r.totalPoints, 0)
  const allCorrect = roundResults.every(r => r.isCorrect)
  const streakBonus = allCorrect ? calculateStreakBonus(currentStreak) : 0
  const finalScore = Math.min(roundTotal + streakBonus, 300)
  return { roundTotal, streakBonus, finalScore, allCorrect }
}
