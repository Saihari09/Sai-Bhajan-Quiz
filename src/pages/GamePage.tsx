import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useDailyBhajan } from '../hooks/useDailyBhajan'
import { useGameStore } from '../store/gameStore'
import { useStreakStore } from '../store/streakStore'
import { calculateRoundScore, calculateFinalScore } from '../lib/scoring'
import { getTodayString } from '../lib/dateUtils'
import { ScorePopup } from '../components/game/ScorePopup'
import { Round1Page } from './Round1Page'
import { Round2Page } from './Round2Page'
import { Round3Page } from './Round3Page'
import type { RoundNumber, RoundResult, DayResult } from '../types/game'

const ROUND_LABELS = ['Round 1: Guess the Deity', 'Round 2: First Line', 'Round 3: Word Scramble']

export function GamePage() {
  const navigate = useNavigate()
  const { bhajan, loading, error } = useDailyBhajan()
  const currentRound = useGameStore((s) => s.currentRound)
  const bhajanId = useGameStore((s) => s.bhajanId)
  const todayResult = useStreakStore((s) => s.todayResult)
  const [showPopup, setShowPopup] = useState(false)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)

  useEffect(() => {
    if (bhajan && !bhajanId) {
      useGameStore.getState().startGame(bhajan.id)
    }
  }, [bhajan, bhajanId])

  useEffect(() => {
    if (todayResult) {
      navigate('/reveal', { replace: true })
    }
  }, [todayResult, navigate])

  const handleRoundComplete = useCallback((round: RoundNumber, isCorrect: boolean, timeSpentMs: number, userAnswer: string, correctAnswer: string) => {
    const result = calculateRoundScore(round, isCorrect, timeSpentMs, userAnswer, correctAnswer)
    useGameStore.getState().addRoundResult(result)
    setLastResult(result)
    setShowPopup(true)
  }, [])

  const handleContinue = useCallback(() => {
    setShowPopup(false)

    const game = useGameStore.getState()
    if (game.currentRound < 3) {
      game.advanceRound()
    } else {
      game.markComplete()
      const allResults = game.roundResults
      const today = getTodayString()

      const allCorrect = allResults.every(r => r.isCorrect)
      const streak = useStreakStore.getState()
      if (!allCorrect) {
        streak.resetStreak()
      } else {
        streak.incrementStreak()
      }

      const { roundTotal, streakBonus, finalScore } = calculateFinalScore(
        allResults,
        useStreakStore.getState().currentStreak
      )

      const dayResult: DayResult = {
        date: today,
        bhajanId: game.bhajanId,
        roundResults: allResults,
        totalScore: roundTotal,
        streakBonus,
        finalScore,
        allCorrect,
      }

      useStreakStore.getState().recordDay(dayResult)
      navigate('/reveal')
    }
  }, [navigate])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-saffron-300 border-t-saffron-600 rounded-full" />
      </div>
    )
  }

  if (error || !bhajan) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-red-500">Failed to load today's bhajan. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRound}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentRound === 1 && (
            <Round1Page
              bhajan={bhajan}
              onComplete={(correct, time, userAns, correctAns) => handleRoundComplete(1, correct, time, userAns, correctAns)}
            />
          )}
          {currentRound === 2 && (
            <Round2Page
              bhajan={bhajan}
              onComplete={(correct, time, userAns, correctAns) => handleRoundComplete(2, correct, time, userAns, correctAns)}
            />
          )}
          {currentRound === 3 && (
            <Round3Page
              bhajan={bhajan}
              onComplete={(correct, time, userAns, correctAns) => handleRoundComplete(3, correct, time, userAns, correctAns)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {showPopup && lastResult && (
        <ScorePopup
          result={lastResult}
          roundLabel={ROUND_LABELS[lastResult.round - 1]}
          onContinue={handleContinue}
        />
      )}
    </div>
  )
}
