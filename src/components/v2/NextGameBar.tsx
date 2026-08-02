import { Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { ALL_GAMES, GAME_META, type GameId } from '../../lib/daily'
import { useProgressStore } from '../../store/progressStore'

interface Props {
  today: string
  current: GameId
}

/**
 * Tester feedback: after finishing a game, the way onward belongs at the
 * TOP. Leads straight to the next unplayed game (preserving a ?date=
 * archive visit), or celebrates the completed day.
 */
export function NextGameBar({ today, current }: Props) {
  const day = useProgressStore((s) => s.days[today])
  const { search } = useLocation()
  const next = ALL_GAMES.find((g) => g !== current && !day?.results[g])

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      {next ? (
        <Link
          to={`/play/${next}${search}`}
          className="flex min-h-14 flex-1 items-center justify-between rounded-2xl bg-turmeric px-5 py-3 text-paper shadow"
        >
          <span className="text-lg font-semibold">
            Next: {GAME_META[next].emoji} {GAME_META[next].title}
          </span>
          <span className="text-2xl" aria-hidden>→</span>
        </Link>
      ) : (
        <Link
          to={`/${search}`}
          className="flex min-h-14 flex-1 items-center justify-between rounded-2xl bg-leaf px-5 py-3 text-paper shadow"
        >
          <span className="text-lg font-semibold">🌸 All games done — see your rangoli!</span>
          <span className="text-2xl" aria-hidden>→</span>
        </Link>
      )}
      <Link
        to={`/${search}`}
        aria-label="Back to the hub"
        className="grid min-h-14 min-w-14 place-items-center rounded-2xl border-2 border-line bg-paper text-2xl"
      >
        🏠
      </Link>
    </motion.div>
  )
}
