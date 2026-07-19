import { useMemo } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { useProgressStore, dayLampLit } from '../../store/progressStore'
import { getTodayString } from '../../lib/dateUtils'

/** 7-diya weekly row: one lamp per day played this week. No streak-loss. */
export function LampsRow() {
  const days = useProgressStore((s) => s.days)
  const today = getTodayString()

  const week = useMemo(() => {
    const start = startOfWeek(new Date(today + 'T12:00:00'))
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      return {
        dateStr,
        label: format(d, 'EEEEE'),
        lit: dayLampLit(days[dateStr]),
        isToday: dateStr === today,
        isFuture: dateStr > today,
      }
    })
  }, [days, today])

  return (
    <div className="flex items-end justify-between px-2" aria-label="Lamps lit this week">
      {week.map((d) => (
        <div key={d.dateStr} className="flex flex-col items-center gap-1">
          <svg viewBox="0 0 24 24" width={30} height={30} role="img" aria-label={d.lit ? 'Lamp lit' : 'Lamp unlit'}>
            {d.lit && (
              <>
                <ellipse cx={12} cy={8} rx={3.4} ry={5} fill="#D97E00" />
                <ellipse cx={12} cy={9} rx={1.7} ry={3} fill="#C9A227" />
              </>
            )}
            <path d="M4 15c0 3.5 3.6 6 8 6s8-2.5 8-6l-2 .8a16 16 0 0 1-12 0Z" fill={d.lit ? '#7A1E2E' : '#E8D9B8'} />
            <ellipse cx={12} cy={15} rx={8} ry={2.2} fill={d.lit ? '#A85E00' : '#E8D9B8'} />
          </svg>
          <span
            className={`text-sm ${d.isToday ? 'font-bold text-turmeric-deep' : d.isFuture ? 'text-line' : 'text-ink-soft'}`}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}
