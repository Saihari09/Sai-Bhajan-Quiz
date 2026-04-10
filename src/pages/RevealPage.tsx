import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useDailyBhajan } from '../hooks/useDailyBhajan'
import { useStreakStore } from '../store/streakStore'
import { generateShareText, shareResult } from '../lib/shareFormatter'

export function RevealPage() {
  const navigate = useNavigate()
  const { bhajan, loading } = useDailyBhajan()
  const streakStore = useStreakStore()
  const todayResult = streakStore.todayResult
  const [copied, setCopied] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    if (!loading && !todayResult) {
      navigate('/', { replace: true })
    }
  }, [loading, todayResult, navigate])

  if (loading || !todayResult || !bhajan) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-saffron-300 border-t-saffron-600 rounded-full" />
      </div>
    )
  }

  const handleShare = async () => {
    const text = generateShareText(todayResult, bhajan.title, streakStore.currentStreak)
    await shareResult(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 py-6 px-4 space-y-6">
      {/* Score Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-md text-center"
      >
        <h2 className="text-2xl font-black text-gray-800 mb-4">Today's Score</h2>

        <div className="space-y-2 mb-4">
          {todayResult.roundResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">
                Round {r.round} {r.isCorrect ? '✅' : '❌'}
              </span>
              <span className="font-bold text-gray-800">{r.totalPoints} pts</span>
            </div>
          ))}
          {todayResult.streakBonus > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-saffron-50 rounded-xl">
              <span className="text-sm text-saffron-700">🔥 Streak Bonus</span>
              <span className="font-bold text-saffron-700">+{todayResult.streakBonus} pts</span>
            </div>
          )}
        </div>

        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-5xl font-black text-saffron-600"
        >
          {todayResult.finalScore}
        </motion.div>
        <p className="text-sm text-gray-400 mt-1">
          out of {todayResult.allCorrect ? '400' : '300'}
        </p>

        {streakStore.currentStreak >= 2 && (
          <p className="mt-3 text-saffron-600 font-bold">
            🔥 {streakStore.currentStreak}-day streak!
          </p>
        )}
      </motion.div>

      {/* Bhajan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 shadow-md"
      >
        <div className="flex items-center gap-4 mb-4">
          <img
            src={import.meta.env.BASE_URL + bhajan.deityImageUrl}
            alt={bhajan.deity}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h3 className="text-lg font-bold text-gray-800">{bhajan.title}</h3>
            <p className="text-sm text-gray-500">{bhajan.occasion}</p>
          </div>
        </div>

        {/* Translation */}
        <div className="mb-4 p-4 bg-saffron-50 rounded-xl">
          <h4 className="text-sm font-bold text-saffron-700 mb-2">Meaning</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{bhajan.lyrics.translation}</p>
        </div>

        {/* Lyrics toggle */}
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className="w-full py-2 text-sm font-semibold text-saffron-600 border border-saffron-200 rounded-xl"
        >
          {showLyrics ? 'Hide Lyrics' : 'Show Full Lyrics'}
        </button>

        {showLyrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 space-y-3"
          >
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-bold text-gray-600 mb-2">Original</h4>
              <p className="text-base leading-relaxed whitespace-pre-line">{bhajan.lyrics.original}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-bold text-gray-600 mb-2">Transliteration</h4>
              <p className="text-base leading-relaxed whitespace-pre-line">{bhajan.lyrics.transliteration}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Full Bhajan Link */}
      <motion.a
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        href={bhajan.audio.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-4 bg-white rounded-2xl shadow-md text-center font-bold text-saffron-600 border border-saffron-200 active:bg-saffron-50 transition-colors"
      >
        🎵 Play Full Bhajan
      </motion.a>

      {/* Share Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={handleShare}
        className="w-full py-4 bg-saffron-500 text-white font-bold rounded-2xl shadow-md active:bg-saffron-600 transition-colors"
      >
        {copied ? '✅ Copied to clipboard!' : '📤 Share Score'}
      </motion.button>
    </div>
  )
}
