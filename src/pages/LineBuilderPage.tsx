import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useClip } from '../hooks/useClip'
import { seededRng, shuffleSeeded } from '../lib/seeded'
import { NextGameBar } from '../components/v2/NextGameBar'
import { useGameTimer } from '../hooks/useGameTimer'
import { formatSeconds } from '../lib/dateUtils'
import { trackEvent } from '../lib/analytics'

const HINT_COST = 10
const FLOOR = 40

export function LineBuilderPage() {
  const { bundle, today } = useDailyBundle()
  if (!bundle) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <LineBuilderGame key={today} bundle={bundle} today={today} />
}

function LineBuilderGame({
  bundle,
  today,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  today: string
}) {
  const b = bundle.bhajan
  // The same curated lines V1 used for its word-bank rounds.
  const rounds = useMemo(() => {
    const idxs = [b.round2LineIndex, b.round3LineIndex]
    const lines = idxs
      .map((i) => b.lyrics.lines[i])
      .filter((l) => l && l.words.length >= 3)
    return lines.length > 0 ? lines : [b.lyrics.lines[0]]
  }, [b])

  const savedResult = useProgressStore((s) => s.days[today]?.results['linebuilder'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const soundOn = useSettingsStore((s) => s.soundOn)
  const showToast = useToastStore((s) => s.show)
  const { play } = useClip(import.meta.env.BASE_URL + b.audio.clipUrl, 0)

  const elapsed = useGameTimer()
  const [roundIdx, setRoundIdx] = useState(() => (savedResult ? rounds.length : 0))
  const [placedCount, setPlacedCount] = useState(0)
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set())
  const [shakeTile, setShakeTile] = useState<number | null>(null)
  const [hints, setHints] = useState(0)

  const done = roundIdx >= rounds.length
  const line = done ? null : rounds[roundIdx]

  const tiles = useMemo(() => {
    if (!line) return []
    return shuffleSeeded(
      line.words.map((word, i) => ({ word, i })),
      seededRng(`${today}:lb${roundIdx}`),
    )
  }, [line, today, roundIdx])

  const advanceRound = () => {
    const next = roundIdx + 1
    setRoundIdx(next)
    setPlacedCount(0)
    setUsedTiles(new Set())
    if (next >= rounds.length) {
      const points = Math.max(100 - hints * HINT_COST, FLOOR)
      recordResult(today, 'linebuilder', points, elapsed())
      trackEvent('linebuilder_complete', today)
      showToast(`The line is yours — ${points} points 🎶`)
      if (soundOn) play('full')
    } else {
      showToast('Line complete — one more! 🌸')
    }
  }

  const tapTile = (tileKey: number, word: string) => {
    if (!line || usedTiles.has(tileKey)) return
    if (word === line.words[placedCount]) {
      const nextUsed = new Set(usedTiles)
      nextUsed.add(tileKey)
      setUsedTiles(nextUsed)
      const nextPlaced = placedCount + 1
      setPlacedCount(nextPlaced)
      if (nextPlaced >= line.words.length) advanceRound()
    } else {
      // Tester feedback: the shake alone was too subtle — say it out loud.
      setShakeTile(tileKey)
      setTimeout(() => setShakeTile(null), 400)
      showToast(
        placedCount > 0
          ? `Not yet — which word comes after “${line.words[placedCount - 1]}”? 🙏`
          : 'Not the first word — how does the line begin? 🙏',
      )
    }
  }

  const useHint = () => {
    if (!line) return
    setHints(hints + 1)
    // Place the next word for them.
    const nextWord = line.words[placedCount]
    const tile = tiles.find((t) => !usedTiles.has(t.i) && t.word === nextWord)
    if (tile) tapTile(tile.i, tile.word)
    showToast(`“${nextWord}” 🙏`)
  }

  if (done) {
    const points = savedResult?.points ?? Math.max(100 - hints * HINT_COST, FLOOR)
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <NextGameBar today={today} current="linebuilder" />
        <div className="flex flex-col items-center gap-4 py-1 text-center">
        <p className="text-4xl">🎶</p>
        <h2 className="font-display text-2xl text-maroon">Beautifully sung!</h2>
        {rounds.map((l, i) => (
          <p key={i} className="text-lg text-ink">“{l.transliteration}”</p>
        ))}
        <p className="text-xl font-semibold text-turmeric-deep">
          {points} points
          {savedResult?.seconds != null && ` · ⏱ ${formatSeconds(savedResult.seconds)}`}
        </p>
        <Link to="/bhajan" className="min-h-12 rounded-full border-2 border-gold bg-paper px-5 py-2.5 text-lg font-semibold text-turmeric-deep">
          Sing the whole bhajan 🎶
        </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Build the Line</h2>
        <p className="text-lg text-ink-soft">
          Sing today's bhajan in your head and lay the words in order — line {roundIdx + 1} of {rounds.length}
        </p>
      </div>

      {/* The line being built */}
      <div className="min-h-16 rounded-2xl border border-line bg-paper px-4 py-3">
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          {line!.words.map((word, i) =>
            i < placedCount ? (
              <span key={i} className="rounded-lg bg-leaf/15 px-2.5 py-1 text-xl font-semibold text-leaf">
                {word}
              </span>
            ) : (
              <span
                key={i}
                className={`rounded-lg border-2 border-dashed px-2.5 py-1 text-xl ${
                  i === placedCount ? 'border-turmeric text-turmeric' : 'border-line text-line'
                }`}
              >
                {'·'.repeat(Math.max(word.length, 2))}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Word tiles */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {tiles.map((t) => (
          <button
            key={t.i}
            onClick={() => tapTile(t.i, t.word)}
            disabled={usedTiles.has(t.i)}
            className={`min-h-12 rounded-2xl border-2 px-4 py-2.5 text-xl font-semibold ${
              usedTiles.has(t.i)
                ? 'border-line bg-ivory text-line'
                : shakeTile === t.i
                  ? 'animate-pulse border-maroon bg-maroon/15 text-maroon'
                  : 'border-line bg-paper text-ink active:border-turmeric'
            }`}
          >
            {t.word}
          </button>
        ))}
      </div>

      <button
        onClick={useHint}
        className="mx-auto min-h-12 rounded-full border-2 border-line bg-paper px-6 py-2.5 text-lg text-ink"
      >
        Next word, please (−{HINT_COST})
      </button>
    </div>
  )
}
