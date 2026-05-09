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
import { trackEvent } from '../lib/analytics'
import { hasNotificationPermission, isNotificationSupported } from '../lib/notifications'
import { NotificationPrompt } from '../components/NotificationPrompt'
import { useInstallStore } from '../store/installStore'

const ROUND_LABELS = ['Round 1: Guess the Deity', 'Round 2: First Line', 'Round 3: Word Scramble']

export function GamePage() {
  const navigate = useNavigate()
  const { date: dateParam } = useParams<{ date?: string }>()
  const today = getTodayString()
  const playingDate = dateParam || today
  const isPastPuzzle = playingDate !== today
  // Future bhajans live in the schedule so the data is ready on time, but
  // they must NOT be playable via direct URL — that would spoil the daily
  // reveal. The Archive page already hides future days; this guards the
  // direct /play/:date entry point.
  const isFuturePuzzle = playingDate > today

  const currentRound = useGameStore((s) => s.currentRound)
  const bhajanId = useGameStore((s) => s.bhajanId)
  const todayResult = useStreakStore((s) => s.todayResult)
  const [showPopup, setShowPopup] = useState(false)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [bhajan, setBhajan] = useState<Bhajan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)

  useEffect(() => {
    if (isFuturePuzzle) {
      navigate('/', { replace: true })
      return
    }
    const loader = isPastPuzzle ? getBhajanForDate(playingDate) : getTodayBhajan()
    loader
      .then(setBhajan)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [playingDate, isPastPuzzle, isFuturePuzzle, navigate])

  useEffect(() => {
    // Only start a fresh game if there's no persisted game OR the persisted
    // game is for a different bhajan (e.g. user played yesterday's past puzzle
    // and now moved on to today's). If bhajanId matches, we're resuming —
    // don't reset currentRound.
    if (bhajan && bhajanId !== bhajan.id) {
      useGameStore.getState().startGame(bhajan.id)
      trackEvent('game_start', playingDate)
    }
  }, [bhajan, bhajanId, playingDate])

  useEffect(() => {
    if (!isPastPuzzle && todayResult && !showNotifPrompt) {
      navigate('/reveal', { replace: true })
    }
  }, [todayResult, navigate, isPastPuzzle, showNotifPrompt])

  const handleRoundComplete = useCallback((round: RoundNumber, isCorrect: boolean, timeSpentMs: number, userAnswer: string, correctAnswer: string, accuracy?: number) => {
    const result = calculateRoundScore(round, isCorrect, timeSpentMs, userAnswer, correctAnswer, accuracy)
    useGameStore.getState().addRoundResult(result)
    const status = isCorrect ? 'correct' : (result.totalPoints > 0 ? 'partial' : 'incorrect')
    trackEvent(`round_${round}_${status}`, playingDate)
    setLastResult(result)
    setShowPopup(true)
  }, [playingDate])

  const handleContinue = useCallback(() => {
    setShowPopup(false)

    const game = useGameStore.getState()
    if (game.currentRound < 3) {
      game.advanceRound()
    } else {
      game.markComplete()
      const allResults = game.roundResults

      const allCorrect = allResults.every(r => r.isCorrect)
      const anyPoints = allResults.some(r => r.totalPoints > 0)

      if (!isPastPuzzle) {
        const streak = useStreakStore.getState()
        if (allCorrect) {
          streak.incrementStreak()
        } else if (!anyPoints) {
          // Complete whiff (0 points everywhere) → reset.
          // Partial-credit days hold the streak steady — they don't extend it
          // but they don't punish engagement either.
          streak.resetStreak()
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
      trackEvent('game_complete', playingDate)

      // Show notification prompt if the user hasn't enabled yet and hasn't
      // dismissed the prompt in the last 7 days. Works for first-time AND
      // returning users (previously only fired on the very first game).
      if (isNotificationSupported() && !hasNotificationPermission()) {
        const { notifPromptDismissedAt } = useInstallStore.getState()
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        const recentlyDismissed =
          notifPromptDismissedAt !== null &&
          Date.now() - new Date(notifPromptDismissedAt).getTime() < sevenDaysMs
        if (!recentlyDismissed) {
          setShowNotifPrompt(true)
          return
        }
      }

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
              onComplete={(correct, time, userAns, correctAns, accuracy) => handleRoundComplete(2, correct, time, userAns, correctAns, accuracy)}
            />
          )}
          {currentRound === 3 && (
            <Round3Page
              bhajan={bhajan}
              onComplete={(correct, time, userAns, correctAns, accuracy) => handleRoundComplete(3, correct, time, userAns, correctAns, accuracy)}
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

      {showNotifPrompt && (
        <NotificationPrompt
          onClose={() => {
            setShowNotifPrompt(false)
            navigate('/reveal')
          }}
        />
      )}
    </div>
  )
}
