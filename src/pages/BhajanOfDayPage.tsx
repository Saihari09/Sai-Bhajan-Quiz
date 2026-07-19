import { useState } from 'react'
import { Link } from 'react-router'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useClip } from '../hooks/useClip'
import { DEITY_OPTIONS } from '../types/bhajan'

export function BhajanOfDayPage() {
  const { bundle, today } = useDailyBundle()
  const heardleDone = useProgressStore((s) => Boolean(s.days[today]?.results['heardle']))
  const markListened = useProgressStore((s) => s.markListened)
  const [spoilerOk, setSpoilerOk] = useState(false)

  if (!bundle) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }

  if (!heardleDone && !spoilerOk) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
        <span className="text-5xl">🤫</span>
        <p className="text-xl text-ink">
          Today's bhajan is the answer to <b>Guess the Bhajan</b>. Play it first for the full joy!
        </p>
        <Link to="/play/heardle" className="min-h-12 rounded-full bg-turmeric px-6 py-3 text-lg font-semibold text-paper">
          Play Guess the Bhajan 🎵
        </Link>
        <button onClick={() => setSpoilerOk(true)} className="min-h-12 text-lg text-ink-soft underline">
          Show me anyway
        </button>
      </div>
    )
  }

  return <BhajanDetail bundle={bundle} today={today} markListened={markListened} />
}

function BhajanDetail({
  bundle,
  today,
  markListened,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  today: string
  markListened: (date: string) => void
}) {
  const b = bundle.bhajan
  const clipUrl = import.meta.env.BASE_URL + b.audio.clipUrl
  const { isLoaded, playingStage, play, stop } = useClip(clipUrl, 0)
  const deity = DEITY_OPTIONS.find((d) => d.tag === b.deity)

  const originalLines = b.lyrics.original.split('\n')
  const translitLines = b.lyrics.transliteration.split('\n')

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="text-center">
        <p className="text-base uppercase tracking-wide text-ink-soft">Bhajan of the day</p>
        <h2 className="font-display text-3xl leading-tight text-maroon">{b.title}</h2>
        <p className="mt-1 text-lg text-ink-soft">
          {bundle.family.emoji} {deity?.displayName ?? b.deity} · {b.occasion}
        </p>
      </div>

      <button
        onClick={() => {
          if (playingStage) {
            stop()
          } else {
            play('full')
            markListened(today)
          }
        }}
        disabled={!isLoaded}
        className="mx-auto min-h-14 rounded-full bg-turmeric px-8 py-3.5 text-xl font-semibold text-paper disabled:opacity-50"
      >
        {playingStage ? '⏸ Pause' : '▶ Play & sing along'}
      </button>

      {/* Sing-along: the instrumental plays, the devotee provides the voice */}
      <div className="rounded-2xl border border-line bg-paper px-5 py-4">
        {translitLines.map((line, i) => (
          <div key={i} className="mb-3">
            <p className="text-xl font-semibold leading-snug text-ink">{line}</p>
            {originalLines[i] && <p className="text-lg leading-snug text-ink-soft">{originalLines[i]}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-ivory px-5 py-4">
        <p className="text-base uppercase tracking-wide text-ink-soft">Meaning</p>
        <p className="mt-1 text-lg leading-relaxed text-ink">{b.lyrics.translation}</p>
      </div>

      <a
        href={b.audio.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-2xl border-2 border-gold bg-paper px-5 py-4 text-center text-lg font-semibold text-turmeric-deep"
      >
        Listen to the sung version on Sai Rhythms 🎧
      </a>

      <Link to="/" className="text-center text-lg text-ink-soft underline">
        Back to today's games
      </Link>
    </div>
  )
}
