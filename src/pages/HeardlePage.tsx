import { useState } from 'react'
import { Link } from 'react-router'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useToastStore } from '../store/toastStore'
import { useClip, type ClipStage } from '../hooks/useClip'
import { BhajanPicker } from '../components/v2/BhajanPicker'
import { DEITY_OPTIONS } from '../types/bhajan'
import { trackEvent } from '../lib/analytics'
import type { Bhajan } from '../types/bhajan'

const STAGES: { sprite: ClipStage; seconds: number; points: number }[] = [
  { sprite: 's2', seconds: 2, points: 100 },
  { sprite: 's5', seconds: 5, points: 80 },
  { sprite: 's10', seconds: 10, points: 60 },
]
const REVEAL_POINTS = 40

export function HeardlePage() {
  const { bundle, bhajans, today } = useDailyBundle()
  if (!bundle || bhajans.length === 0) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <HeardleGame key={today} bundle={bundle} bhajans={bhajans} today={today} />
}

function HeardleGame({
  bundle,
  bhajans,
  today,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  bhajans: Bhajan[]
  today: string
}) {
  const answer = bundle.bhajan
  const savedResult = useProgressStore((s) => s.days[today]?.results['heardle'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const showToast = useToastStore((s) => s.show)
  const { isLoaded, playingStage, play } = useClip(
    import.meta.env.BASE_URL + answer.audio.clipUrl,
    answer.heardleOffsetSec ?? 0,
  )

  const [stage, setStage] = useState(0)
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  // solvedAt: stage index it was named at, or 'reveal'
  const [solvedAt, setSolvedAt] = useState<number | 'reveal' | null>(savedResult ? 0 : null)

  const done = solvedAt !== null || Boolean(savedResult)

  const advance = () => {
    if (stage < STAGES.length - 1) {
      setStage(stage + 1)
    } else {
      setSolvedAt('reveal')
      recordResult(today, 'heardle', REVEAL_POINTS)
      trackEvent('heardle_reveal', today)
      play('full')
    }
  }

  const guess = (b: Bhajan) => {
    if (done) return
    if (b.id === answer.id) {
      const points = STAGES[stage].points
      setSolvedAt(stage)
      recordResult(today, 'heardle', points)
      trackEvent('heardle_solve', today)
      play('full')
    } else {
      setWrongGuesses([...wrongGuesses, b.title])
      showToast('Not this one — try once more 🙏')
      advance()
    }
  }

  if (done) {
    const points = savedResult?.points ?? (solvedAt === 'reveal' ? REVEAL_POINTS : STAGES[solvedAt as number].points)
    const deity = DEITY_OPTIONS.find((d) => d.tag === answer.deity)
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
        <p className="text-4xl">🌸</p>
        <p className="text-base uppercase tracking-wide text-ink-soft">Today's bhajan</p>
        <h2 className="font-display text-3xl leading-tight text-maroon">{answer.title}</h2>
        <p className="text-lg text-ink-soft">
          {bundle.family.emoji} {deity?.displayName ?? answer.deity} · {points} points
        </p>
        <button
          onClick={() => play('full')}
          disabled={!isLoaded}
          className="min-h-14 rounded-full bg-turmeric px-8 py-3.5 text-xl font-semibold text-paper disabled:opacity-50"
        >
          {playingStage ? '🎵 Playing…' : '▶ Play the melody'}
        </button>
        <Link
          to="/bhajan"
          className="min-h-12 rounded-full border-2 border-gold bg-paper px-6 py-3 text-lg font-semibold text-turmeric-deep"
        >
          Sing along with the lyrics 🎶
        </Link>
        <Link to="/" className="text-lg text-ink-soft underline">
          Back to today's games
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Guess the Bhajan</h2>
        <p className="text-lg text-ink-soft">Listen, then name it from memory</p>
      </div>

      {/* Stage bar */}
      <div className="flex justify-center gap-2" aria-label={`Clip length: ${STAGES[stage].seconds} seconds`}>
        {STAGES.map((s, i) => (
          <span
            key={s.sprite}
            className={`rounded-full px-3.5 py-1 text-base font-semibold ${
              i === stage
                ? 'bg-turmeric text-paper'
                : i < stage
                  ? 'bg-line text-ink-soft line-through'
                  : 'bg-ivory text-ink-soft border border-line'
            }`}
          >
            {s.seconds}s · {s.points}
          </span>
        ))}
      </div>

      <button
        onClick={() => play(STAGES[stage].sprite)}
        disabled={!isLoaded}
        className="mx-auto min-h-16 rounded-full bg-turmeric px-10 py-4 text-2xl font-semibold text-paper shadow disabled:opacity-50"
      >
        {playingStage ? '🎵 Listening…' : `▶ Play ${STAGES[stage].seconds}s clip`}
      </button>
      <p className="text-center text-base text-ink-soft">Replay as many times as you like — it's free</p>

      <BhajanPicker bhajans={bhajans} onSelect={guess} placeholder="Type the bhajan's name…" />

      {wrongGuesses.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {wrongGuesses.map((t, i) => (
            <p key={i} className="rounded-xl bg-ivory px-4 py-2 text-lg text-ink-soft">
              🙏 {t}
            </p>
          ))}
        </div>
      )}

      <button onClick={advance} className="min-h-12 text-lg text-turmeric-deep underline">
        {stage < STAGES.length - 1
          ? `Unlock the ${STAGES[stage + 1].seconds}s clip (${STAGES[stage + 1].points} pts)`
          : `Reveal the bhajan (${REVEAL_POINTS} pts)`}
      </button>
    </div>
  )
}
