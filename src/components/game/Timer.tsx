import { motion } from 'framer-motion'

interface TimerProps {
  elapsedMs: number
  scoringWindowMs: number
}

export function Timer({ elapsedMs, scoringWindowMs }: TimerProps) {
  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const fill = Math.min(elapsedMs / scoringWindowMs, 1)
  const color = fill < 0.5 ? 'bg-saffron-400' : fill < 0.75 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="w-full px-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-navy-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color} rounded-full`}
            style={{ width: `${fill * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className={`text-base font-black tabular-nums min-w-[2.5rem] text-right ${fill >= 1 ? 'text-red-500' : 'text-navy-600'}`}>
          {elapsedSeconds}s
        </span>
      </div>
    </div>
  )
}
