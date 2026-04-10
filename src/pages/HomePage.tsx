import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useStreakStore } from '../store/streakStore'
import { useGameStore } from '../store/gameStore'
import { getTodayString } from '../lib/dateUtils'
import { useEffect } from 'react'

export function HomePage() {
  const navigate = useNavigate()
  const streakStore = useStreakStore()
  const gameStore = useGameStore()
  const today = getTodayString()

  const alreadyPlayed = streakStore.todayResult !== null

  useEffect(() => {
    streakStore.checkAndResetStreak(today)
    streakStore.clearForNewDay(today)
  }, [today, streakStore])

  const handleStart = () => {
    gameStore.resetGame()
    navigate('/play')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      {/* Logo / Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">🙏</div>
        <h1 className="text-3xl font-black text-gray-800">
          Sai Bhajan Quiz
        </h1>
        <p className="text-gray-500 mt-2">
          Test your bhajan knowledge daily
        </p>
      </motion.div>

      {/* Streak Display */}
      {streakStore.currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-5 py-2 bg-saffron-100 rounded-full"
        >
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-saffron-700">
            {streakStore.currentStreak}-day streak
          </span>
        </motion.div>
      )}

      {/* Stats */}
      {streakStore.totalGamesPlayed > 0 && (
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">{streakStore.totalGamesPlayed}</p>
            <p className="text-xs text-gray-500">Played</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{streakStore.longestStreak}</p>
            <p className="text-xs text-gray-500">Best Streak</p>
          </div>
        </div>
      )}

      {/* CTA */}
      {alreadyPlayed ? (
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-4 bg-white rounded-2xl shadow-md"
          >
            <p className="text-sm text-gray-500 mb-1">Today's Score</p>
            <p className="text-4xl font-black text-saffron-600">
              {streakStore.todayResult?.finalScore}
            </p>
          </motion.div>

          <button
            onClick={() => navigate('/reveal')}
            className="w-full py-4 bg-saffron-500 text-white font-bold rounded-2xl active:bg-saffron-600 transition-colors"
          >
            View Details
          </button>

          <p className="text-sm text-gray-400">Come back tomorrow for a new bhajan!</p>
        </div>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="w-full max-w-xs py-4 bg-saffron-500 text-white text-lg font-bold rounded-2xl shadow-lg active:bg-saffron-600 transition-colors"
        >
          Start Today's Quiz
        </motion.button>
      )}
    </div>
  )
}
