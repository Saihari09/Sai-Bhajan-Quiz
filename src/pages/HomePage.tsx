import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useStreakStore } from '../store/streakStore'
import { useGameStore } from '../store/gameStore'
import { getTodayString, formatDisplayDate } from '../lib/dateUtils'
import { loadSchedule, loadBhajans } from '../lib/schedule'
import { useEffect, useState, useMemo } from 'react'
import type { Bhajan } from '../types/bhajan'
import { trackEvent } from '../lib/analytics'
import { hasNotificationPermission, isNotificationSupported, requestNotificationPermission } from '../lib/notifications'

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= level ? 'text-saffron-500' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()

      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-center px-5 py-3 bg-navy-50 rounded-2xl border border-navy-100">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Next bhajan in</p>
      <p className="text-2xl font-black text-navy-600 tabular-nums tracking-wide">{timeLeft}</p>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const streakStore = useStreakStore()
  const gameStore = useGameStore()
  const today = getTodayString()
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [pastPuzzles, setPastPuzzles] = useState<{ date: string; bhajanId: string; bhajan?: Bhajan }[]>([])
  const [notifHidden, setNotifHidden] = useState(false)
  const showNotifLink = isNotificationSupported() && !hasNotificationPermission() && !notifHidden

  const handleEnableNotifications = () => {
    requestNotificationPermission()
    trackEvent('notification_enable')
    setNotifHidden(true)
  }

  const alreadyPlayed = streakStore.todayResult !== null

  useEffect(() => {
    useStreakStore.getState().checkAndResetStreak(today)
    useStreakStore.getState().clearForNewDay(today)
  }, [today])

  useEffect(() => {
    Promise.all([loadSchedule(), loadBhajans()]).then(([schedule, bhajans]) => {
      if (!schedule || !bhajans) return
      const past = schedule.schedule
        .filter((s: { date: string; bhajanId: string }) => s.date < today)
        .map((s: { date: string; bhajanId: string }) => ({
          ...s,
          bhajan: bhajans.find((b: Bhajan) => b.id === s.bhajanId),
        }))
        .reverse()
      setPastPuzzles(past)
    }).catch(() => {})
  }, [today])

  const winPercent = useMemo(() => {
    if (streakStore.totalGamesPlayed === 0) return 0
    const wins = streakStore.history.filter(h => h.allCorrect).length
    return Math.round((wins / streakStore.totalGamesPlayed) * 100)
  }, [streakStore.history, streakStore.totalGamesPlayed])

  const isDatePlayed = (date: string) => streakStore.history.some(h => h.date === date)
  const getDateScore = (date: string) => streakStore.history.find(h => h.date === date)?.finalScore

  const handleStartClick = () => {
    setShowHowToPlay(true)
  }

  const handlePlay = () => {
    setShowHowToPlay(false)
    gameStore.resetGame()
    navigate('/play')
  }

  const handlePlayPast = (date: string) => {
    gameStore.resetGame()
    navigate(`/play/${date}`)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 py-6 gap-5">
      {/* Hero section */}
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

      {/* Stats Grid */}
      {streakStore.totalGamesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-1 w-full bg-white rounded-2xl px-3 py-4 shadow-md border border-gray-100"
        >
          <div className="text-center">
            <p className="text-xl font-black text-navy-600">{streakStore.totalGamesPlayed}</p>
            <p className="text-[10px] text-gray-500 font-medium">Played</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-navy-600">{winPercent}%</p>
            <p className="text-[10px] text-gray-500 font-medium">Win %</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-saffron-600">{streakStore.currentStreak}</p>
            <p className="text-[10px] text-gray-500 font-medium">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-navy-600">{streakStore.longestStreak}</p>
            <p className="text-[10px] text-gray-500 font-medium">Max</p>
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

          <CountdownTimer />
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

      {/* Previous Puzzles */}
      {pastPuzzles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-2"
        >
          <h2 className="text-sm font-bold text-navy-700 px-1">Previous Puzzles</h2>
          {pastPuzzles.map((p) => {
            const played = isDatePlayed(p.date)
            const score = getDateScore(p.date)
            return (
              <div
                key={p.date}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center">
                    <span className="text-xs font-bold text-navy-600">{formatDisplayDate(p.date).split(' ')[1]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-700">
                      {played ? (p.bhajan?.title || 'Bhajan') : `Puzzle — ${formatDisplayDate(p.date)}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDisplayDate(p.date)}</span>
                      {p.bhajan?.difficulty && <DifficultyStars level={p.bhajan.difficulty} />}
                    </div>
                  </div>
                </div>
                {played ? (
                  <span className="text-sm font-black text-saffron-600">{score} pts</span>
                ) : (
                  <button
                    onClick={() => handlePlayPast(p.date)}
                    className="px-4 py-1.5 bg-saffron-500 text-white text-xs font-bold rounded-full active:bg-saffron-600"
                  >
                    Play
                  </button>
                )}
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-auto pt-4 space-y-2"
      >
        <p className="text-xs text-gray-400 italic">
          "Life is a song, sing it" — Sri Sathya Sai Baba
        </p>
        <a
          href="https://buymeacoffee.com/sai09"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('donate_click')}
          className="inline-block text-xs text-saffron-500 font-medium hover:text-saffron-600 transition-colors"
        >
          🙏 Support this app
        </a>
        {showNotifLink && (
          <div>
            <button
              onClick={handleEnableNotifications}
              className="inline-block text-xs text-navy-500 font-medium hover:text-navy-600 transition-colors"
            >
              🔔 Enable daily reminders
            </button>
          </div>
        )}
      </motion.div>

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
