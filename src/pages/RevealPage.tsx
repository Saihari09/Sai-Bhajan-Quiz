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
    <div className="flex-1 py-6 px-4 space-y-5">
      {/* Score Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-lg text-center border border-gray-100"
      >
        <h2 className="text-xl font-black text-navy-700 mb-4">Today's Score</h2>

        <div className="space-y-2 mb-5">
          {todayResult.roundResults.map((r, i) => {
            const roundLabels = ['Guess the Deity', 'Arrange the Line', 'Unscramble']
            const timeSec = Math.round(r.timeSpentMs / 1000)
            return (
              <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-medium text-gray-600">
                    {r.isCorrect ? '✅' : '❌'} {roundLabels[i]}
                  </span>
                  <span className="font-black text-navy-700">{r.totalPoints} pts</span>
                </div>
                <div className="px-4 pb-3 space-y-1">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-gray-400 shrink-0">Your answer:</span>
                    <span className={`font-semibold ${r.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {r.userAnswer}
                    </span>
                  </div>
                  {!r.isCorrect && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 shrink-0">Correct:</span>
                      <span className="font-semibold text-green-600">{r.correctAnswer}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    {timeSec}s {r.speedBonus > 0 ? `(+${r.speedBonus} speed bonus)` : ''}
                  </p>
                </div>
              </div>
            )
          })}
          {todayResult.streakBonus > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-saffron-50 rounded-xl border border-saffron-100">
              <span className="text-sm font-medium text-saffron-700">🔥 Streak Bonus</span>
              <span className="font-black text-saffron-700">+{todayResult.streakBonus} pts</span>
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
        <p className="text-xs text-gray-400 mt-1">
          out of 300
        </p>

        {streakStore.currentStreak >= 2 && (
          <p className="mt-3 text-saffron-600 font-bold text-sm">
            🔥 {streakStore.currentStreak}-day streak!
          </p>
        )}
      </motion.div>

      {/* Bhajan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-saffron-200 shadow-md">
            <img
              src={import.meta.env.BASE_URL + bhajan.deityImageUrl}
              alt={bhajan.deity}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-black text-navy-700">{bhajan.title}</h3>
            <p className="text-sm text-gray-500">{bhajan.occasion}</p>
          </div>
        </div>

        {/* Translation */}
        <div className="mb-4 p-4 bg-gradient-to-br from-saffron-50 to-saffron-100/50 rounded-xl border border-saffron-100">
          <h4 className="text-xs font-bold text-saffron-700 uppercase tracking-wider mb-2">Meaning</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{bhajan.lyrics.translation}</p>
        </div>

        {/* Lyrics toggle */}
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          className="w-full py-2.5 text-sm font-bold text-navy-600 border-2 border-navy-100 rounded-xl hover:bg-navy-50 transition-colors"
        >
          {showLyrics ? 'Hide Lyrics' : 'Show Full Lyrics'}
        </button>

        {showLyrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 space-y-3"
          >
            <div className="p-4 bg-navy-50 rounded-xl">
              <h4 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2">Original</h4>
              <p className="text-base leading-relaxed whitespace-pre-line text-navy-800">{bhajan.lyrics.original}</p>
            </div>
            <div className="p-4 bg-navy-50 rounded-xl">
              <h4 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2">Transliteration</h4>
              <p className="text-base leading-relaxed whitespace-pre-line text-navy-800">{bhajan.lyrics.transliteration}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Full Bhajan Link */}
      <motion.a
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        href={bhajan.audio.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-4 bg-white rounded-2xl shadow-lg text-center font-bold text-navy-600 border-2 border-navy-100 active:bg-navy-50 transition-colors"
      >
        🎵 Play Full Bhajan
      </motion.a>

      {/* Share Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={handleShare}
        className="w-full py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold rounded-2xl shadow-lg active:from-saffron-600 active:to-saffron-700 transition-all"
      >
        {copied ? '✅ Copied to clipboard!' : '📤 Share Score'}
      </motion.button>
    </div>
  )
}
