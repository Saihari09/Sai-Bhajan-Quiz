import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useStreakStore } from '../store/streakStore'
import { useGameStore } from '../store/gameStore'
import { getTodayString } from '../lib/dateUtils'
import { useEffect, useState } from 'react'

export function HomePage() {
  const navigate = useNavigate()
  const streakStore = useStreakStore()
  const gameStore = useGameStore()
  const today = getTodayString()
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  const alreadyPlayed = streakStore.todayResult !== null

  useEffect(() => {
    useStreakStore.getState().checkAndResetStreak(today)
    useStreakStore.getState().clearForNewDay(today)
  }, [today])

  const handleStartClick = () => {
    setShowHowToPlay(true)
  }

  const handlePlay = () => {
    setShowHowToPlay(false)
    gameStore.resetGame()
    navigate('/play')
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 py-6 gap-5">
      {/* Hero section with Sai Baba image */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl">
          <img
            src={import.meta.env.BASE_URL + 'images/sai_baba_HS.jpeg'}
            alt="Sri Sathya Sai Baba"
            className="w-full h-52 object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 to-transparent" />
        </div>
        <div className="flex items-center gap-3 mt-3 px-1">
          <img
            src={import.meta.env.BASE_URL + 'images/logo.png'}
            alt="Logo"
            className="w-11 h-11 object-contain"
          />
          <div>
            <h1 className="text-2xl font-black leading-tight text-navy-700">
              Sai Bhajan Quiz
            </h1>
            <p className="text-gray-500 text-xs">
              Test your bhajan knowledge daily
            </p>
          </div>
        </div>
      </motion.div>

      {/* Streak Display */}
      {streakStore.currentStreak > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-saffron-100 to-saffron-200 rounded-full border border-saffron-300"
        >
          <span className="text-xl">🔥</span>
          <span className="font-bold text-saffron-800">
            {streakStore.currentStreak}-day streak
          </span>
        </motion.div>
      )}

      {/* Stats */}
      {streakStore.totalGamesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-8 text-center bg-white rounded-2xl px-8 py-4 shadow-md border border-gray-100"
        >
          <div>
            <p className="text-2xl font-black text-navy-600">{streakStore.totalGamesPlayed}</p>
            <p className="text-xs text-gray-500 font-medium">Played</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-black text-navy-600">{streakStore.longestStreak}</p>
            <p className="text-xs text-gray-500 font-medium">Best Streak</p>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      {alreadyPlayed ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 w-full"
        >
          <div className="px-6 py-5 bg-white rounded-2xl shadow-lg border border-saffron-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Today's Score</p>
            <p className="text-5xl font-black text-saffron-600">
              {streakStore.todayResult?.finalScore}
            </p>
          </div>

          <button
            onClick={() => navigate('/reveal')}
            className="w-full py-4 bg-navy-600 text-white font-bold rounded-2xl active:bg-navy-700 transition-colors shadow-md"
          >
            View Details
          </button>

          <p className="text-sm text-gray-400">Come back tomorrow for a new bhajan!</p>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartClick}
          className="w-full py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white text-lg font-bold rounded-2xl shadow-lg active:from-saffron-600 active:to-saffron-700 transition-all"
        >
          Start Today's Quiz
        </motion.button>
      )}

      {/* Footer quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-gray-400 italic text-center mt-auto pt-4"
      >
        "Life is a song, sing it" — Sri Sathya Sai Baba
      </motion.p>

      {/* How to Play Modal */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHowToPlay(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-black text-navy-700 text-center mb-4">How to Play</h2>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-8 h-8 rounded-full bg-saffron-100 text-saffron-700 font-black text-sm flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="font-bold text-navy-700 text-sm">Guess the Deity</p>
                    <p className="text-xs text-gray-500">Listen to the bhajan clip and pick which deity it's about</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-8 h-8 rounded-full bg-saffron-100 text-saffron-700 font-black text-sm flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="font-bold text-navy-700 text-sm">Arrange the Line</p>
                    <p className="text-xs text-gray-500">Tap the jumbled words to arrange a lyric line in order</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-8 h-8 rounded-full bg-saffron-100 text-saffron-700 font-black text-sm flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="font-bold text-navy-700 text-sm">Unscramble</p>
                    <p className="text-xs text-gray-500">Same word puzzle, different line — can you get it right?</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-saffron-50 rounded-xl border border-saffron-100">
                <p className="text-xs text-gray-600 text-center">
                  Answer faster for bonus points. Get all 3 right to keep your streak!
                </p>
              </div>

              <button
                onClick={handlePlay}
                className="w-full mt-5 py-3.5 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold rounded-2xl shadow-lg active:from-saffron-600 active:to-saffron-700 transition-all"
              >
                Let's Go!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
