import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WordTile } from './WordTile'
import { shuffleWords, checkWordOrder } from '../../lib/wordShuffle'

interface WordBankProps {
  correctWords: string[]
  onAnswer: (isCorrect: boolean) => void
}

export function WordBank({ correctWords, onAnswer }: WordBankProps) {
  const [shuffled] = useState(() => shuffleWords(correctWords))
  const [placed, setPlaced] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const placedWords = placed.map((i) => shuffled[i])
  const allPlaced = placed.length === shuffled.length

  useEffect(() => {
    if (allPlaced && !submitted) {
      setSubmitted(true)
      const isCorrect = checkWordOrder(placedWords, correctWords)
      setTimeout(() => onAnswer(isCorrect), 400)
    }
  }, [allPlaced, submitted, placedWords, correctWords, onAnswer])

  const handleTileClick = (index: number) => {
    if (submitted) return
    if (placed.includes(index)) return
    setPlaced((prev) => [...prev, index])
  }

  const handleSlotClick = (slotIndex: number) => {
    if (submitted) return
    setPlaced((prev) => prev.filter((_, i) => i !== slotIndex))
  }

  return (
    <div className="flex flex-col gap-5 px-4">
      {/* Answer slots */}
      <div className="flex flex-wrap gap-2 min-h-[52px] p-3.5 bg-white rounded-2xl border-2 border-dashed border-navy-200 shadow-inner">
        <AnimatePresence>
          {placed.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-400 w-full text-center py-1"
            >
              Tap words to arrange in order
            </motion.p>
          )}
          {placedWords.map((word, i) => (
            <motion.button
              key={`placed-${i}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={() => handleSlotClick(i)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md active:scale-95 transition-transform"
            >
              {word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2.5 justify-center">
        {shuffled.map((word, i) => (
          <WordTile
            key={`tile-${i}`}
            word={word}
            index={i}
            isPlaced={placed.includes(i)}
            onClick={() => handleTileClick(i)}
          />
        ))}
      </div>
    </div>
  )
}
