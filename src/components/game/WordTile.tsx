import { motion } from 'framer-motion'

interface WordTileProps {
  word: string
  index: number
  isPlaced: boolean
  onClick: () => void
}

export function WordTile({ word, isPlaced, onClick }: WordTileProps) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-base font-semibold shadow-sm transition-all ${
        isPlaced
          ? 'bg-gray-200 text-gray-400 border border-gray-300'
          : 'bg-white text-saffron-800 border-2 border-saffron-300 active:bg-saffron-50'
      }`}
      disabled={isPlaced}
    >
      {word}
    </motion.button>
  )
}
