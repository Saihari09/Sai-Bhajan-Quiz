import { motion } from 'framer-motion'
import type { DeityOption } from '../../types/bhajan'

interface DeityCardProps {
  deity: DeityOption
  onSelect: (tag: string) => void
  disabled: boolean
  state: 'idle' | 'correct' | 'wrong'
}

export function DeityCard({ deity, onSelect, disabled, state }: DeityCardProps) {
  const borderColor =
    state === 'correct' ? 'border-green-500 bg-green-50' :
    state === 'wrong' ? 'border-red-400 bg-red-50' :
    'border-gray-200 bg-white'

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={() => onSelect(deity.tag)}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 shadow-sm transition-colors ${borderColor} ${disabled ? 'opacity-60' : 'active:shadow-md'}`}
    >
      <img
        src={import.meta.env.BASE_URL + deity.imageUrl}
        alt={deity.displayName}
        className="w-16 h-16 rounded-full object-cover"
      />
      <span className="text-sm font-semibold text-gray-800">{deity.displayName}</span>
    </motion.button>
  )
}
