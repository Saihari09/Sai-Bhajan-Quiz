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
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-xl"
      >
        <div className="text-4xl mb-3">
          {result.isCorrect ? '✅' : '❌'}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{roundLabel}</h2>
        <p className="text-gray-500 mb-4">
          {result.isCorrect ? 'Correct!' : 'Not quite...'}
        </p>

        {result.isCorrect && (
          <div className="space-y-1 mb-4">
            <p className="text-gray-600">
              Base: <span className="font-bold text-saffron-600">{result.basePoints}</span> pts
            </p>
            <p className="text-gray-600">
              Speed bonus: <span className="font-bold text-saffron-600">+{result.speedBonus}</span> pts
            </p>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-3xl font-black text-saffron-600"
              >
                {result.totalPoints}
              </motion.p>
              <p className="text-xs text-gray-400">points</p>
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3 bg-saffron-500 text-white font-bold rounded-xl active:bg-saffron-600 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  )
}
