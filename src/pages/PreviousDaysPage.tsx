import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { format, subDays } from 'date-fns'
import { ALL_GAMES, GAME_META, loadDeities, weekdayOf, type DeitiesData } from '../lib/daily'
import { realTodayString } from '../lib/dateUtils'
import { useProgressStore, dayPoints } from '../store/progressStore'

/**
 * Tester ask: play previous days' games. The last 7 days, each game
 * linked with a ?date= that the whole app understands (past dates only).
 */
export function PreviousDaysPage() {
  const days = useProgressStore((s) => s.days)
  const [deities, setDeities] = useState<DeitiesData | null>(null)
  const today = realTodayString()

  useEffect(() => {
    void loadDeities().then(setDeities)
  }, [])

  const pastDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(today + 'T12:00:00'), i + 1)
    return format(d, 'yyyy-MM-dd')
  }).filter((d) => d >= '2026-07-19') // V2 launch day — nothing older exists

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Previous days</h2>
        <p className="text-lg text-ink-soft">Missed a day? The bhajans are still singing 🪔</p>
      </div>

      {pastDays.length === 0 && (
        <p className="py-8 text-center text-lg text-ink-soft">
          The mandir is brand new — yesterday's puzzles will appear here tomorrow!
        </p>
      )}

      {pastDays.map((date) => {
        const day = days[date]
        const family = deities?.weekdayFamilies[String(weekdayOf(date))]
        const doneCount = ALL_GAMES.filter((g) => day?.results[g]).length
        return (
          <div key={date} className="rounded-2xl border border-line bg-paper px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-display text-xl text-ink">
                {family?.emoji} {format(new Date(date + 'T12:00:00'), 'EEEE, MMM d')}
              </p>
              <p className="text-base text-ink-soft">
                {doneCount === ALL_GAMES.length
                  ? `Complete 🌸 ${dayPoints(day)} pts`
                  : `${doneCount} of ${ALL_GAMES.length} played`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_GAMES.map((g) => {
                const played = Boolean(day?.results[g])
                return (
                  <Link
                    key={g}
                    to={`/play/${g}?date=${date}`}
                    className={`min-h-11 rounded-full border px-3.5 py-1.5 text-base ${
                      played
                        ? 'border-leaf bg-leaf/10 text-leaf'
                        : 'border-line bg-ivory text-ink'
                    }`}
                  >
                    {GAME_META[g].emoji} {played ? `✓ ${day!.results[g]!.points}` : 'Play'}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      <Link to="/" className="text-center text-lg text-ink-soft underline">
        Back to today
      </Link>
    </div>
  )
}
