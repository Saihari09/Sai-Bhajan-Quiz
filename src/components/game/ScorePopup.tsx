import { motion } from 'framer-motion'
import type { RoundResult } from '../../types/game'

interface ScorePopupProps {
  result: RoundResult
  roundLabel: string
  onContinue: () => void
}

export function ScorePopup({ result, roundLabel, onContinue }: ScorePopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 60, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
      >
        <div className="text-5xl mb-3">
          {result.isCorrect ? '✅' : '❌'}
        </div>
        <h2 className="text-lg font-black text-navy-700 mb-1">{roundLabel}</h2>
        <p className="text-gray-400 text-sm mb-5">
          {result.isCorrect ? 'Well done!' : 'Better luck next time'}
        </p>

        {result.isCorrect && (
          <div className="space-y-1 mb-5">
            <div className="flex justify-between px-4 text-sm">
              <span className="text-gray-500">Base</span>
              <span className="font-bold text-navy-600">{result.basePoints} pts</span>
            </div>
            <div className="flex justify-between px-4 text-sm">
              <span className="text-gray-500">Speed bonus</span>
              <span className="font-bold text-saffron-600">+{result.speedBonus} pts</span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 8 }}
                className="text-4xl font-black text-saffron-600"
              >
                {result.totalPoints}
              </motion.p>
              <p className="text-xs text-gray-400 mt-0.5">points</p>
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-gradient-to-r from-navy-600 to-navy-700 text-white font-bold rounded-xl active:from-navy-700 active:to-navy-800 transition-all shadow-md"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  )
}
