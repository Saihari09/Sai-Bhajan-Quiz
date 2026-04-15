import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useStreakStore } from '../store/streakStore'
import { useGameStore } from '../store/gameStore'
import { loadSchedule } from '../lib/schedule'
import { getTodayString } from '../lib/dateUtils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface DayCell {
  date: string       // YYYY-MM-DD
  day: number        // 1-31
  hasPuzzle: boolean
  played: boolean
  score: number | null
  isToday: boolean
  isFuture: boolean
}

interface MonthBlock {
  year: number
  month: number        // 0-11
  leadingBlanks: number
  days: DayCell[]
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function ArchivePage() {
  const navigate = useNavigate()
  const history = useStreakStore((s) => s.history)
  const gameStore = useGameStore()
  const today = getTodayString()
  const [scheduledDates, setScheduledDates] = useState<Set<string> | null>(null)

  useEffect(() => {
    loadSchedule()
      .then((schedule) => {
        setScheduledDates(new Set(schedule.schedule.map((s) => s.date)))
      })
      .catch(() => setScheduledDates(new Set()))
  }, [])

  const playedByDate = useMemo(() => {
    const map = new Map<string, number>()
    history.forEach((h) => map.set(h.date, h.finalScore))
    return map
  }, [history])

  const months: MonthBlock[] = useMemo(() => {
    if (!scheduledDates || scheduledDates.size === 0) return []
    const sorted = [...scheduledDates].sort()
    const firstDate = sorted[0]
    const [firstYear, firstMonth] = firstDate.split('-').map(Number)

    const [todayYear, todayMonth] = today.split('-').map(Number)

    const result: MonthBlock[] = []
    let cursorYear = firstYear
    let cursorMonth = firstMonth - 1 // 0-indexed
    const endYear = todayYear
    const endMonth = todayMonth - 1

    while (
      cursorYear < endYear ||
      (cursorYear === endYear && cursorMonth <= endMonth)
    ) {
      const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate()
      const firstDayOfMonth = new Date(cursorYear, cursorMonth, 1).getDay()
      const days: DayCell[] = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${cursorYear}-${pad(cursorMonth + 1)}-${pad(d)}`
        const hasPuzzle = scheduledDates.has(dateStr)
        const isToday = dateStr === today
        const isFuture = dateStr > today
        const played = playedByDate.has(dateStr)
        const score = played ? playedByDate.get(dateStr)! : null
        days.push({ date: dateStr, day: d, hasPuzzle, played, score, isToday, isFuture })
      }
      result.push({
        year: cursorYear,
        month: cursorMonth,
        leadingBlanks: firstDayOfMonth,
        days,
      })
      // advance one month
      cursorMonth += 1
      if (cursorMonth > 11) {
        cursorMonth = 0
        cursorYear += 1
      }
    }

    return result.reverse() // most recent month first
  }, [scheduledDates, playedByDate, today])

  const handleDayClick = (cell: DayCell) => {
    if (!cell.hasPuzzle || cell.played || cell.isFuture) return
    gameStore.resetGame()
    if (cell.isToday) {
      navigate('/play')
    } else {
      navigate(`/play/${cell.date}`)
    }
  }

  if (scheduledDates === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-saffron-300 border-t-saffron-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-navy-600 text-lg font-bold active:bg-gray-50"
          aria-label="Back"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-black text-navy-700">Previous Puzzles</h1>
          <p className="text-xs text-gray-400">Tap any saffron day to play</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-xs text-gray-500 bg-white rounded-2xl py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-saffron-500" />
          <span>Play</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
          <span>Played</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-100" />
          <span>No puzzle</span>
        </div>
      </div>

      {months.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-8">
          No past puzzles yet.
        </div>
      )}

      {months.map((m, i) => (
        <motion.div
          key={`${m.year}-${m.month}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <h2 className="text-sm font-bold text-navy-700 mb-3">
            {MONTHS[m.month]} {m.year}
          </h2>

          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {WEEKDAYS.map((d, idx) => (
              <div
                key={idx}
                className="text-center text-[10px] font-bold text-gray-400 uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: m.leadingBlanks }).map((_, idx) => (
              <div key={`blank-${idx}`} />
            ))}

            {m.days.map((cell) => {
              // No puzzle scheduled
              if (!cell.hasPuzzle) {
                return (
                  <div
                    key={cell.date}
                    className="aspect-square flex items-center justify-center text-xs text-gray-300 bg-gray-50 rounded-lg"
                  >
                    {cell.day}
                  </div>
                )
              }

              // Future puzzle (scheduled but not yet available)
              if (cell.isFuture) {
                return (
                  <div
                    key={cell.date}
                    className="aspect-square flex items-center justify-center text-xs font-medium text-gray-300 bg-gray-100 rounded-lg"
                    title="Not yet available"
                  >
                    {cell.day}
                  </div>
                )
              }

              // Already played → green with score
              if (cell.played) {
                return (
                  <div
                    key={cell.date}
                    className="aspect-square flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-[9px] font-medium text-gray-400 leading-none">
                      {cell.day}
                    </span>
                    <span className="text-[11px] font-black text-green-600 leading-none mt-0.5">
                      {cell.score}
                    </span>
                  </div>
                )
              }

              // Playable — today or past unplayed
              return (
                <button
                  key={cell.date}
                  onClick={() => handleDayClick(cell)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-white shadow-sm active:bg-saffron-600 transition-colors ${
                    cell.isToday
                      ? 'bg-saffron-600 ring-2 ring-offset-1 ring-saffron-500'
                      : 'bg-saffron-500'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{cell.day}</span>
                  <span className="text-[9px] font-medium leading-none mt-0.5">
                    {cell.isToday ? 'Today' : 'Play'}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
