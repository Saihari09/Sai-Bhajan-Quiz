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
      className={`px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
        isPlaced
          ? 'bg-gray-100 text-gray-300 border border-gray-200'
          : 'bg-white text-navy-700 border-2 border-navy-200 active:border-saffron-400 active:bg-saffron-50 shadow-md'
      }`}
      disabled={isPlaced}
    >
      {word}
    </motion.button>
  )
}
