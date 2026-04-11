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
    state === 'correct' ? 'ring-4 ring-green-400 bg-green-50' :
    state === 'wrong' ? 'ring-4 ring-red-400 bg-red-50' :
    'bg-white hover:shadow-lg'

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.92 } : undefined}
      onClick={() => onSelect(deity.tag)}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 p-3 rounded-2xl shadow-md transition-all ${borderColor} ${disabled ? 'opacity-70' : 'active:shadow-xl'}`}
    >
      <div className="w-18 h-18 rounded-full overflow-hidden border-3 border-saffron-200 shadow-sm">
        <img
          src={import.meta.env.BASE_URL + deity.imageUrl}
          alt={deity.displayName}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-xs font-bold text-navy-700">{deity.displayName}</span>
    </motion.button>
  )
}
