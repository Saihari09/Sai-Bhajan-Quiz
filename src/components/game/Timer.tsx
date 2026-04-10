import { motion } from 'framer-motion'

interface TimerProps {
  progress: number
  timeRemainingMs: number
}

export function Timer({ progress, timeRemainingMs }: TimerProps) {
  const seconds = Math.ceil(timeRemainingMs / 1000)
  const color = progress > 0.5 ? 'bg-green-500' : progress > 0.25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="w-full px-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color} rounded-full`}
            style={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className={`text-lg font-bold tabular-nums min-w-[2.5rem] text-right ${seconds <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
          {seconds}s
        </span>
      </div>
    </div>
  )
}
