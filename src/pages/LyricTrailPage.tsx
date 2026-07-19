import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useClip } from '../hooks/useClip'
import { generateLyricTrail } from '../lib/lyrictrail'
import { trackEvent } from '../lib/analytics'

const BASE_POINTS = 100
const HINT_COST = 10
const FLOOR = 40

export function LyricTrailPage() {
  const { bundle, today } = useDailyBundle()
  if (!bundle) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <LyricTrailGame key={today} bundle={bundle} today={today} />
}

function LyricTrailGame({
  bundle,
  today,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  today: string
}) {
  const puzzle = useMemo(() => generateLyricTrail(bundle.bhajan, today), [bundle, today])
  const savedResult = useProgressStore((s) => s.days[today]?.results['lyrictrail'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const soundOn = useSettingsStore((s) => s.soundOn)
  const showToast = useToastStore((s) => s.show)
  const { play } = useClip(import.meta.env.BASE_URL + bundle.bhajan.audio.clipUrl, 0)

  const [progress, setProgress] = useState(() => (savedResult ? puzzle.path.length : 0))
  const [hints, setHints] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)

  const done = progress >= puzzle.path.length
  const tracedCells = useMemo(() => {
    const set = new Set<string>()
    for (let i = 0; i < progress; i++) set.add(`${puzzle.path[i].row},${puzzle.path[i].col}`)
    return set
  }, [progress, puzzle])

  const nextCell = done ? null : puzzle.path[progress]
  const startKey = `${puzzle.path[0].row},${puzzle.path[0].col}`

  const finish = (finalProgress: number, hintCount: number) => {
    if (finalProgress < puzzle.path.length) return
    const points = Math.max(BASE_POINTS - hintCount * HINT_COST, FLOOR)
    recordResult(today, 'lyrictrail', points)
    trackEvent('lyrictrail_complete', today)
    showToast(`The line is yours — ${points} points 🎶`)
    if (soundOn) play('full')
  }

  const tapCell = (row: number, col: number) => {
    if (done || !nextCell) return
    if (row === nextCell.row && col === nextCell.col) {
      const p = progress + 1
      setProgress(p)
      finish(p, hints)
    } else if (!tracedCells.has(`${row},${col}`)) {
      showToast(
        progress === 0
          ? `Start at the glowing letter “${puzzle.letters[0]}” 🙏`
          : 'Follow the line — the next letter touches your last one 🙏',
      )
    }
  }

  const useHint = () => {
    if (done || !nextCell) return
    setHints(hints + 1)
    setFlash(`${nextCell.row},${nextCell.col}`)
    setTimeout(() => setFlash(null), 1600)
  }

  // Word chips: fully traced words lock; the current word shows letter progress.
  const chips = puzzle.words.map((w) => {
    const covered = Math.min(Math.max(progress - w.startIdx, 0), w.endIdx - w.startIdx)
    return { ...w, covered, complete: covered === w.endIdx - w.startIdx }
  })

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Lyric Trail</h2>
        <p className="text-lg text-ink-soft">
          Today's line hides in the grid as one winding trail. Trace it letter by letter, like drawing a rangoli.
        </p>
      </div>

      {/* The line being traced */}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 rounded-2xl border border-line bg-paper px-4 py-3">
        {chips.map((w, i) => (
          <span
            key={i}
            className={`text-xl font-semibold ${
              w.complete ? 'text-leaf' : w.covered > 0 ? 'text-turmeric-deep' : 'text-ink-soft'
            }`}
          >
            {w.complete ? (
              w.text
            ) : (
              <>
                <span className="text-turmeric-deep">{w.text.slice(0, w.covered)}</span>
                <span>{w.text.slice(w.covered)}</span>
              </>
            )}
          </span>
        ))}
      </div>

      <div
        className="grid gap-1 rounded-2xl border border-line bg-paper p-2"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="Lyric trail grid"
      >
        {puzzle.grid.map((rowArr, r) =>
          rowArr.map((letter, c) => {
            const key = `${r},${c}`
            const traced = tracedCells.has(key)
            const isStart = key === startKey && progress === 0
            const isFlash = flash === key
            return (
              <button
                key={key}
                onClick={() => tapCell(r, c)}
                className={`aspect-square min-w-0 rounded-lg text-xl font-bold leading-none transition-colors ${
                  traced
                    ? 'bg-turmeric text-paper'
                    : isFlash
                      ? 'bg-gold text-paper'
                      : isStart
                        ? 'bg-ivory text-ink ring-4 ring-gold animate-pulse'
                        : 'bg-ivory text-ink active:bg-line'
                }`}
                role="gridcell"
                aria-label={`${letter}${traced ? ', traced' : ''}`}
              >
                {letter}
              </button>
            )
          }),
        )}
      </div>

      {done ? (
        <div className="rounded-2xl border-2 border-gold bg-paper px-5 py-4 text-center">
          <p className="text-2xl">🎶</p>
          <p className="font-display text-xl text-maroon">
            “{puzzle.lines.join(' / ')}”
          </p>
          <p className="mt-1 text-lg text-ink-soft">
            {savedResult?.points ?? Math.max(BASE_POINTS - hints * HINT_COST, FLOOR)} points — now sing it!
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link
              to="/bhajan"
              className="min-h-12 rounded-full border-2 border-gold bg-paper px-5 py-2.5 text-lg font-semibold text-turmeric-deep"
            >
              Full lyrics 🎶
            </Link>
            <Link to="/" className="min-h-12 rounded-full bg-turmeric px-6 py-2.5 text-lg font-semibold text-paper">
              Back to the hub
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={useHint}
          className="mx-auto min-h-12 rounded-full border-2 border-line bg-paper px-6 py-2.5 text-lg text-ink"
        >
          Show my next letter (−{HINT_COST})
        </button>
      )}
    </div>
  )
}
