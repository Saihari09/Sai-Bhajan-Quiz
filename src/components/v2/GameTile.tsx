import { Link } from 'react-router'

interface Props {
  to: string
  emoji: string
  title: string
  subtitle: string
  done: boolean
  points?: number
}

export function GameTile({ to, emoji, title, subtitle, done, points }: Props) {
  return (
    <Link
      to={to}
      className="arch-card flex flex-col items-center gap-1 px-4 pb-4 pt-7 text-center shadow-sm active:shadow-none"
    >
      <span className="text-4xl" aria-hidden>{emoji}</span>
      <span className="font-display text-xl leading-tight text-maroon">{title}</span>
      <span className="text-base text-ink-soft">{subtitle}</span>
      {done ? (
        <span className="mt-1 rounded-full bg-leaf px-3.5 py-1 text-base font-semibold text-paper">
          ✓ {points} pts
        </span>
      ) : (
        <span className="mt-1 rounded-full bg-turmeric px-4 py-1 text-base font-semibold text-paper">
          Play
        </span>
      )}
    </Link>
  )
}
