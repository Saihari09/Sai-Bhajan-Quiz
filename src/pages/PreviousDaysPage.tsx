import { useState } from 'react'
import { Link } from 'react-router'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addMonths,
} from 'date-fns'
import { ALL_GAMES } from '../lib/daily'
import { realTodayString } from '../lib/dateUtils'
import { useProgressStore, dayPoints } from '../store/progressStore'

const LAUNCH_DATE = '2026-07-19' // V2 launch — nothing older exists

/**
 * Calendar of previous days (tester ask): tap any past day to open that
 * day's hub and play its games.
 */
export function PreviousDaysPage() {
  const days = useProgressStore((s) => s.days)
  const today = realTodayString()
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date(today + 'T12:00:00')))

  const monthStr = format(monthAnchor, 'yyyy-MM')
  const canGoBack = monthStr > LAUNCH_DATE.slice(0, 7)
  const canGoForward = monthStr < today.slice(0, 7)

  const gridStart = startOfWeek(startOfMonth(monthAnchor))
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const monthEnd = endOfMonth(monthAnchor)

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Previous days</h2>
        <p className="text-lg text-ink-soft">Missed a day? The bhajans are still singing 🪔</p>
      </div>

      {/* Month header */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-paper px-3 py-2">
        <button
          onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}
          disabled={!canGoBack}
          className="min-h-12 min-w-12 rounded-2xl bg-ivory text-xl disabled:opacity-30"
          aria-label="Previous month"
        >
          ←
        </button>
        <p className="font-display text-xl text-ink">{format(monthAnchor, 'MMMM yyyy')}</p>
        <button
          onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
          disabled={!canGoForward}
          className="min-h-12 min-w-12 rounded-2xl bg-ivory text-xl disabled:opacity-30"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-line bg-paper p-2">
        <div className="mb-1 grid grid-cols-7 text-center text-sm font-semibold text-ink-soft">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const inMonth = d >= startOfMonth(monthAnchor) && d <= monthEnd
            const playable = inMonth && dateStr >= LAUNCH_DATE && dateStr < today
            const isToday = dateStr === today
            const day = days[dateStr]
            const doneCount = ALL_GAMES.filter((g) => day?.results[g]).length
            const complete = doneCount === ALL_GAMES.length

            if (!inMonth) return <span key={dateStr} aria-hidden />
            if (isToday) {
              return (
                <Link
                  key={dateStr}
                  to="/"
                  className="grid aspect-square min-w-0 place-items-center rounded-xl border-2 border-turmeric bg-turmeric/15 text-lg font-bold text-turmeric-deep"
                >
                  {format(d, 'd')}
                </Link>
              )
            }
            if (!playable) {
              return (
                <span
                  key={dateStr}
                  className="grid aspect-square min-w-0 place-items-center rounded-xl text-lg text-line"
                >
                  {format(d, 'd')}
                </span>
              )
            }
            return (
              <Link
                key={dateStr}
                to={`/?date=${dateStr}`}
                className={`relative grid aspect-square min-w-0 place-items-center rounded-xl border text-lg font-semibold ${
                  complete
                    ? 'border-leaf bg-leaf/15 text-leaf'
                    : doneCount > 0
                      ? 'border-gold bg-gold/10 text-ink'
                      : 'border-line bg-ivory text-ink'
                }`}
                aria-label={`${format(d, 'MMMM d')}: ${complete ? `complete, ${dayPoints(day)} points` : `${doneCount} of ${ALL_GAMES.length} games played`}`}
              >
                {complete ? '🌸' : format(d, 'd')}
                {!complete && doneCount > 0 && (
                  <span className="absolute bottom-0.5 text-[0.55rem] text-turmeric-deep">
                    {'•'.repeat(doneCount)}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-base text-ink-soft">
        <span>🌸 day complete</span>
        <span><span className="text-turmeric-deep">•••</span> games played</span>
        <span className="text-turmeric-deep">▢ today</span>
      </div>

      <Link to="/" className="text-center text-lg text-ink-soft underline">
        Back to today
      </Link>
    </div>
  )
}
