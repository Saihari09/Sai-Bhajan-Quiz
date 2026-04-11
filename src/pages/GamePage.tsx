import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useStreakStore } from '../store/streakStore'
import { calculateRoundScore, calculateFinalScore } from '../lib/scoring'
import { getTodayString } from '../lib/dateUtils'
import { getBhajanForDate, getTodayBhajan } from '../lib/schedule'
import { ScorePopup } from '../components/game/ScorePopup'
import { Round1Page } from './Round1Page'
import { Round2Page } from './Round2Page'
import { Round3Page } from './Round3Page'
import type { Bhajan } from '../types/bhajan'
import type { RoundNumber, RoundResult, DayResult } from '../types/game'

const ROUND_LABELS = ['Round 1: Guess the Deity', 'Round 2: First Line', 'Round 3: Word Scramble']

export function GamePage() {
  const navigate = useNavigate()
  const { date: dateParam } = useParams<{ date?: string }>()
  const today = getTodayString()
  const playingDate = dateParam || today
  const isPastPuzzle = playingDate !== today

  const currentRound = useGameStore((s) => s.currentRound)
  const bhajanId = useGameStore((s) => s.bhajanId)
  const todayResult = useStreakStore((s) => s.todayResult)
  const [showPopup, setShowPopup] = useState(false)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [bhajan, setBhajan] = useState<Bhajan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loader = isPastPuzzle ? getBhajanForDate(playingDate) : getTodayBhajan()
    loader
      .then(setBhajan)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [playingDate, isPastPuzzle])

  useEffect(() => {
    if (bhajan && !bhajanId) {
      useGameStore.getState().startGame(bhajan.id)
    }
  }, [bhajan, bhajanId])

  useEffect(() => {
    if (!isPastPuzzle && todayResult) {
      navigate('/reveal', { replace: true })
    }
  }, [todayResult, navigate, isPastPuzzle])

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

      const allCorrect = allResults.every(r => r.isCorrect)

      if (!isPastPuzzle) {
        const streak = useStreakStore.getState()
        if (!allCorrect) {
          streak.resetStreak()
        } else {
          streak.incrementStreak()
        }
      }

      const { roundTotal, streakBonus, finalScore } = calculateFinalScore(
        allResults,
        isPastPuzzle ? 0 : useStreakStore.getState().currentStreak
      )

      const dayResult: DayResult = {
        date: playingDate,
        bhajanId: game.bhajanId,
        roundResults: allResults,
        totalScore: roundTotal,
        streakBonus: isPastPuzzle ? 0 : streakBonus,
        finalScore: isPastPuzzle ? roundTotal : finalScore,
        allCorrect,
      }

      useStreakStore.getState().recordDay(dayResult)
      navigate('/reveal')
    }
  }, [navigate, isPastPuzzle, playingDate])

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
        <p className="text-red-500">Failed to load bhajan. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 py-4">
      {isPastPuzzle && (
        <div className="mx-4 mb-3 px-3 py-2 bg-saffron-50 border border-saffron-200 rounded-xl text-center">
          <p className="text-xs text-saffron-700 font-medium">Playing past puzzle — streaks not affected</p>
        </div>
      )}
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
