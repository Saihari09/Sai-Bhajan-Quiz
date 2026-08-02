import { useMemo, useState } from 'react'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useClip } from '../hooks/useClip'
import { generateOneSearch, isCorrectSelection } from '../lib/onesearch'
import { NextGameBar } from '../components/v2/NextGameBar'
import { trackEvent } from '../lib/analytics'

const HINT_COST = 10
const FLOOR = 40

export function WordSearchPage() {
  const { bundle, today } = useDailyBundle()
  if (!bundle) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <OneSearchGame key={today} bundle={bundle} today={today} />
}

function OneSearchGame({
  bundle,
  today,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  today: string
}) {
  const rounds = useMemo(() => generateOneSearch(bundle.nameBank, today), [bundle, today])
  const savedResult = useProgressStore((s) => s.days[today]?.results['wordsearch'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const soundOn = useSettingsStore((s) => s.soundOn)
  const showToast = useToastStore((s) => s.show)
  const { play } = useClip(import.meta.env.BASE_URL + bundle.bhajan.audio.clipUrl, 0)

  const [roundIdx, setRoundIdx] = useState(() => (savedResult ? rounds.length : 0))
  const [anchor, setAnchor] = useState<{ row: number; col: number } | null>(null)
  const [hints, setHints] = useState(0)
  const [hintCells, setHintCells] = useState<Set<string>>(new Set())
  const [foundFlash, setFoundFlash] = useState<Set<string>>(new Set())

  const done = roundIdx >= rounds.length
  const round = done ? null : rounds[roundIdx]

  const advance = () => {
    setAnchor(null)
    setHintCells(new Set())
    const next = roundIdx + 1
    if (next >= rounds.length) {
      const points = Math.max(100 - hints * HINT_COST, FLOOR)
      recordResult(today, 'wordsearch', points)
      trackEvent('wordsearch_complete', today)
      showToast(`All ${rounds.length} names found — ${points} points 🌸`)
      if (soundOn) play('full')
    }
    setRoundIdx(next)
  }

  const tapCell = (row: number, col: number) => {
    if (!round) return
    if (!anchor) {
      setAnchor({ row, col })
      return
    }
    if (anchor.row === row && anchor.col === col) {
      setAnchor(null)
      return
    }
    if (isCorrectSelection(round, anchor, { row, col })) {
      // Flash the found name, then refresh to the next round's grid.
      const cells = new Set<string>()
      const dr = Math.sign(round.end.row - round.start.row)
      const dc = Math.sign(round.end.col - round.start.col)
      for (let i = 0; i < round.name.length; i++) {
        cells.add(`${round.start.row + dr * i},${round.start.col + dc * i}`)
      }
      setFoundFlash(cells)
      setAnchor(null)
      setTimeout(() => {
        setFoundFlash(new Set())
        advance()
      }, 700)
    } else {
      setAnchor(null)
      showToast('Not there — the name hides in one straight line, any direction 🙏')
    }
  }

  const useHint = () => {
    if (!round) return
    setHints(hints + 1)
    setHintCells(new Set([`${round.start.row},${round.start.col}`]))
    showToast(`It begins at the glowing “${round.name[0]}”`)
  }

  if (done) {
    const points = savedResult?.points ?? Math.max(100 - hints * HINT_COST, FLOOR)
    return (
      <div className="flex flex-col gap-4 px-4 py-5">
        <NextGameBar today={today} current="wordsearch" />
        <div className="flex flex-col items-center gap-4 py-1 text-center">
        <p className="text-4xl">🌸</p>
        <h2 className="font-display text-2xl text-maroon">All names found!</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {rounds.map((r) => (
            <span key={r.name} className="rounded-full border border-leaf bg-leaf/10 px-3.5 py-1.5 text-lg text-leaf">
              {r.name} ✓
            </span>
          ))}
        </div>
        <p className="text-xl font-semibold text-turmeric-deep">{points} points</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Naamavali Search</h2>
        <p className="text-lg text-ink-soft">
          One name of {bundle.family.emoji} hides in each grid — any direction, even backwards.
          Tap its first letter, then its last.
        </p>
      </div>

      {/* Round progress + the name to find */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3">
        <span className="font-display text-2xl tracking-wide text-maroon">{round!.name}</span>
        <span className="text-lg text-ink-soft">
          {roundIdx + 1} of {rounds.length}
        </span>
      </div>

      <div
        className="grid gap-1 rounded-2xl border border-line bg-paper p-2"
        style={{ gridTemplateColumns: `repeat(${round!.size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`Find ${round!.name}`}
      >
        {round!.grid.map((rowArr, r) =>
          rowArr.map((letter, c) => {
            const key = `${r},${c}`
            const isAnchor = anchor?.row === r && anchor?.col === c
            const isHint = hintCells.has(key)
            const isFound = foundFlash.has(key)
            return (
              <button
                key={key}
                onClick={() => tapCell(r, c)}
                className={`aspect-square min-w-0 rounded-lg text-lg font-bold leading-none ${
                  isFound
                    ? 'bg-leaf text-paper'
                    : isAnchor
                      ? 'bg-turmeric text-paper'
                      : isHint
                        ? 'bg-gold text-paper animate-pulse'
                        : 'bg-ivory text-ink active:bg-line'
                }`}
                role="gridcell"
                aria-label={letter}
              >
                {letter}
              </button>
            )
          }),
        )}
      </div>

      <button
        onClick={useHint}
        className="mx-auto min-h-12 rounded-full border-2 border-line bg-paper px-6 py-2.5 text-lg text-ink"
      >
        Show me where it starts (−{HINT_COST})
      </button>
    </div>
  )
}
