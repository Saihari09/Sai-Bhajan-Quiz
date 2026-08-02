import { useMemo, useRef, useState } from 'react'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useClip } from '../hooks/useClip'
import { generateOneSearch, isCorrectSelection } from '../lib/onesearch'
import { NextGameBar } from '../components/v2/NextGameBar'
import { useGameTimer } from '../hooks/useGameTimer'
import { formatSeconds } from '../lib/dateUtils'
import { trackEvent } from '../lib/analytics'

const HINT_COST = 10
const WRONG_COST = 5 // wrong selections cost a little — no brute-forcing the grid
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

  const elapsed = useGameTimer()
  const [roundIdx, setRoundIdx] = useState(() => (savedResult ? rounds.length : 0))
  const [anchor, setAnchor] = useState<{ row: number; col: number } | null>(null)
  const [hints, setHints] = useState(0)
  const [wrongPicks, setWrongPicks] = useState(0)
  const [hintCells, setHintCells] = useState<Set<string>>(new Set())
  const [foundFlash, setFoundFlash] = useState<Set<string>>(new Set())

  const done = roundIdx >= rounds.length
  const round = done ? null : rounds[roundIdx]

  const advance = () => {
    setAnchor(null)
    setHintCells(new Set())
    const next = roundIdx + 1
    if (next >= rounds.length) {
      const points = Math.max(100 - hints * HINT_COST - wrongPicks * WRONG_COST, FLOOR)
      recordResult(today, 'wordsearch', points, elapsed())
      trackEvent('wordsearch_complete', today)
      showToast(`All ${rounds.length} names found — ${points} points 🌸`)
      if (soundOn) play('full')
    }
    setRoundIdx(next)
  }

  const trySelection = (a: { row: number; col: number }, b: { row: number; col: number }) => {
    if (!round) return
    if (isCorrectSelection(round, a, b)) {
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
      setWrongPicks((n) => n + 1)
      showToast(`Not there (−${WRONG_COST}) — one straight line, any direction 🙏`)
    }
  }

  // Drag-to-select (tester ask) — with the old tap-first/tap-last still
  // working for anyone who prefers deliberate taps.
  const gridRef = useRef<HTMLDivElement>(null)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [dragCell, setDragCell] = useState<{ row: number; col: number } | null>(null)

  const cellFromPoint = (clientX: number, clientY: number) => {
    const el = gridRef.current
    if (!el || !round) return null
    const rect = el.getBoundingClientRect()
    const col = Math.floor(((clientX - rect.left) / rect.width) * round.size)
    const row = Math.floor(((clientY - rect.top) / rect.height) * round.size)
    if (row < 0 || row >= round.size || col < 0 || col >= round.size) return null
    return { row, col }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const cell = cellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    gridRef.current?.setPointerCapture(e.pointerId)
    setDragStart(cell)
    setDragCell(cell)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return
    setDragCell(cellFromPoint(e.clientX, e.clientY))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const end = cellFromPoint(e.clientX, e.clientY) ?? dragCell
    const start = dragStart
    setDragStart(null)
    setDragCell(null)
    if (!start || !end) return
    if (start.row !== end.row || start.col !== end.col) {
      // A real drag: start → end is the selection.
      trySelection(start, end)
      return
    }
    // Same cell: classic two-tap flow.
    if (!anchor) {
      setAnchor(end)
    } else if (anchor.row === end.row && anchor.col === end.col) {
      setAnchor(null)
    } else {
      trySelection(anchor, end)
    }
  }

  // Cells highlighted while dragging: the straight line start→current when
  // aligned to one of the 8 directions, else just the two endpoints.
  const dragTrail = useMemo(() => {
    const set = new Set<string>()
    if (!dragStart || !dragCell) return set
    const dr = dragCell.row - dragStart.row
    const dc = dragCell.col - dragStart.col
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
      const steps = Math.max(Math.abs(dr), Math.abs(dc))
      for (let i = 0; i <= steps; i++) {
        set.add(`${dragStart.row + Math.sign(dr) * i},${dragStart.col + Math.sign(dc) * i}`)
      }
    } else {
      set.add(`${dragStart.row},${dragStart.col}`)
      set.add(`${dragCell.row},${dragCell.col}`)
    }
    return set
  }, [dragStart, dragCell])

  const useHint = () => {
    if (!round) return
    setHints(hints + 1)
    setHintCells(new Set([`${round.start.row},${round.start.col}`]))
    showToast(`It begins at the glowing “${round.name[0]}”`)
  }

  if (done) {
    const points =
      savedResult?.points ?? Math.max(100 - hints * HINT_COST - wrongPicks * WRONG_COST, FLOOR)
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
        <p className="text-xl font-semibold text-turmeric-deep">
          {points} points
          {savedResult?.seconds != null && ` · ⏱ ${formatSeconds(savedResult.seconds)}`}
        </p>
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
          <b> Drag your finger across it</b> (or tap its first and last letters).
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
        ref={gridRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="grid select-none gap-1 rounded-2xl border border-line bg-paper p-2"
        style={{ gridTemplateColumns: `repeat(${round!.size}, minmax(0, 1fr))`, touchAction: 'none' }}
        role="grid"
        aria-label={`Find ${round!.name} — drag across it, or tap its first and last letters`}
      >
        {round!.grid.map((rowArr, r) =>
          rowArr.map((letter, c) => {
            const key = `${r},${c}`
            const isAnchor = anchor?.row === r && anchor?.col === c
            const isHint = hintCells.has(key)
            const isFound = foundFlash.has(key)
            const inTrail = dragTrail.has(key)
            return (
              <div
                key={key}
                className={`grid aspect-square min-w-0 place-items-center rounded-lg text-lg font-bold leading-none ${
                  isFound
                    ? 'bg-leaf text-paper'
                    : inTrail
                      ? 'bg-turmeric/70 text-paper'
                      : isAnchor
                        ? 'bg-turmeric text-paper'
                        : isHint
                          ? 'bg-gold text-paper animate-pulse'
                          : 'bg-ivory text-ink'
                }`}
                role="gridcell"
                aria-label={letter}
              >
                {letter}
              </div>
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
