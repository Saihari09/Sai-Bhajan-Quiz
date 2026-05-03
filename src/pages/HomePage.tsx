import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useStreakStore } from '../store/streakStore'
import { useGameStore } from '../store/gameStore'
import { getTodayString } from '../lib/dateUtils'
import { loadSchedule } from '../lib/schedule'
import { useEffect, useState, useMemo } from 'react'
import { trackEvent } from '../lib/analytics'
import { isNotificationSupported, requestNotificationPermission } from '../lib/notifications'
import { useInstallStore } from '../store/installStore'
import { SupportModal } from '../components/SupportModal'

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
  const [showSupport, setShowSupport] = useState(false)
  const [hasPastPuzzles, setHasPastPuzzles] = useState(false)
  const [unplayedPastCount, setUnplayedPastCount] = useState(0)
  const notifEnableClickedAt = useInstallStore((s) => s.notifEnableClickedAt)
  // Native permission — 'default' means user hasn't decided yet. We only
  // surface the link in that state; 'granted' (already on) and 'denied'
  // (don't nag) both hide it. Once the user has clicked once, we also hide
  // it persistently so it doesn't reappear on every reload.
  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  const showNotifLink =
    isNotificationSupported() &&
    permission === 'default' &&
    !notifEnableClickedAt

  const handleEnableNotifications = () => {
    requestNotificationPermission()
    trackEvent('notification_enable')
    useInstallStore.getState().markNotifEnableClicked()
  }

  const alreadyPlayed = streakStore.todayResult !== null

  useEffect(() => {
    useStreakStore.getState().checkAndResetStreak(today)
    useStreakStore.getState().clearForNewDay(today)
  }, [today])

  useEffect(() => {
    loadSchedule().then((schedule) => {
      if (!schedule) return
      const playedDates = new Set(useStreakStore.getState().history.map((h) => h.date))
      const past = schedule.schedule.filter((s) => s.date < today)
      setHasPastPuzzles(past.length > 0)
      setUnplayedPastCount(past.filter((s) => !playedDates.has(s.date)).length)
    }).catch(() => {})
  }, [today, streakStore.history])

  const winPercent = useMemo(() => {
    if (streakStore.totalGamesPlayed === 0) return 0
    const wins = streakStore.history.filter(h => h.allCorrect).length
    return Math.round((wins / streakStore.totalGamesPlayed) * 100)
  }, [streakStore.history, streakStore.totalGamesPlayed])

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

      {/* Previous Puzzles link → calendar archive */}
      {hasPastPuzzles && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/archive')}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-navy-700">Previous Puzzles</p>
              <p className="text-xs text-gray-400">
                {unplayedPastCount > 0
                  ? `${unplayedPastCount} puzzle${unplayedPastCount === 1 ? '' : 's'} left to play`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          <span className="text-gray-300 text-xl">›</span>
        </motion.button>
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
        <motion.button
          onClick={() => {
            trackEvent('donate_click')
            setShowSupport(true)
          }}
          // Subtle wiggle every ~10s to draw the eye without nagging.
          // Starts after a 4s settle so it's not the first thing on page load.
          animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatDelay: 10,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="inline-block text-xs text-saffron-500 font-medium hover:text-saffron-600 transition-colors"
        >
          🙏 Bless the developer
        </motion.button>
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
                  Answer faster for bonus points. Get all 3 right to extend your streak!
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

      {/* Support Modal */}
      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  )
}
