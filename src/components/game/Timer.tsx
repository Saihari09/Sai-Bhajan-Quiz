import { motion } from 'framer-motion'

interface TimerProps {
  progress: number
  timeRemainingMs: number
  elapsedMs: number
  durationMs: number
}

export function Timer({ progress, elapsedMs, durationMs }: TimerProps) {
  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const totalSeconds = Math.round(durationMs / 1000)
  const elapsed = 1 - progress
  const color = elapsed < 0.5 ? 'bg-saffron-400' : elapsed < 0.75 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="w-full px-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-navy-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color} rounded-full`}
            style={{ width: `${elapsed * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className={`text-base font-black tabular-nums min-w-[3rem] text-right ${elapsed > 0.75 ? 'text-red-500 animate-pulse' : 'text-navy-600'}`}>
          {elapsedSeconds}/{totalSeconds}s
        </span>
      </div>
    </div>
  )
}
