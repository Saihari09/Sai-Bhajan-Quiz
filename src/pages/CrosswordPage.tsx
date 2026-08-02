import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useClip } from '../hooks/useClip'
import { LetterPad } from '../components/v2/LetterPad'
import { NextGameBar } from '../components/v2/NextGameBar'
import { useGameTimer } from '../hooks/useGameTimer'
import { formatSeconds } from '../lib/dateUtils'
import { buildAnswerBank, generateCrossword, entryCells, type PlacedEntry } from '../lib/crossword'
import { trackEvent } from '../lib/analytics'

const LETTER_HINT = 5
const WORD_HINT = 15
const WRONG_COST = 2 // tiny — typos happen, but brute-forcing 26 letters won't pay
const FLOOR = 40

export function CrosswordPage() {
  const { bundle, today } = useDailyBundle()
  if (!bundle) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <CrosswordGame key={today} bundle={bundle} today={today} />
}

function CrosswordGame({
  bundle,
  today,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  today: string
}) {
  const puzzle = useMemo(
    () => generateCrossword(buildAnswerBank(bundle.bhajan, bundle.family, today), today),
    [bundle, today],
  )
  const savedResult = useProgressStore((s) => s.days[today]?.results['crossword'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const soundOn = useSettingsStore((s) => s.soundOn)
  const showToast = useToastStore((s) => s.show)
  const { play } = useClip(import.meta.env.BASE_URL + bundle.bhajan.audio.clipUrl, 0)

  // filled: cells confirmed correct (auto-check clears wrong letters instantly).
  const [filled, setFilled] = useState<Set<string>>(() => {
    if (!savedResult) return new Set()
    const all = new Set<string>()
    puzzle.entries.forEach((e) => entryCells(e).forEach((c) => all.add(`${c.row},${c.col}`)))
    return all
  })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [shake, setShake] = useState<string | null>(null)
  const [hintCost, setHintCost] = useState(0)
  const [wrongLetters, setWrongLetters] = useState(0)

  const entry = puzzle.entries[selectedIdx]
  const cells = useMemo(() => entryCells(entry), [entry])

  const isSolved = (e: PlacedEntry) => entryCells(e).every((c) => filled.has(`${c.row},${c.col}`))
  const allSolved = puzzle.entries.every(isSolved)
  const done = Boolean(savedResult) || allSolved

  const totalCost = () => hintCost + wrongLetters * WRONG_COST
  const points = savedResult?.points ?? Math.max(100 - totalCost(), FLOOR)

  const elapsed = useGameTimer()
  const complete = (newFilled: Set<string>, cost: number) => {
    if (!puzzle.entries.every((e) => entryCells(e).every((c) => newFilled.has(`${c.row},${c.col}`)))) return
    recordResult(today, 'crossword', Math.max(100 - cost, FLOOR), elapsed())
    trackEvent('crossword_complete', today)
    showToast(`Crossword complete — ${Math.max(100 - cost, FLOOR)} points 🌸`)
    if (soundOn) play('full')
  }

  const advanceCursor = (from: number, within: Set<string>) => {
    // Next unfilled cell in this word, else next unsolved word.
    for (let i = from + 1; i < cells.length; i++) {
      if (!within.has(`${cells[i].row},${cells[i].col}`)) {
        setCursor(i)
        return
      }
    }
    const nextIdx = puzzle.entries.findIndex(
      (e, i) => i !== selectedIdx && !entryCells(e).every((c) => within.has(`${c.row},${c.col}`)),
    )
    if (nextIdx >= 0) {
      setSelectedIdx(nextIdx)
      const nCells = entryCells(puzzle.entries[nextIdx])
      setCursor(nCells.findIndex((c) => !within.has(`${c.row},${c.col}`)))
    }
  }

  const typeLetter = (ch: string) => {
    if (done) return
    const cell = cells[cursor]
    if (!cell) return
    const key = `${cell.row},${cell.col}`
    if (filled.has(key)) {
      advanceCursor(cursor, filled)
      return
    }
    if (puzzle.solution[cell.row][cell.col] === ch) {
      const next = new Set(filled)
      next.add(key)
      setFilled(next)
      if (entryCells(entry).every((c) => next.has(`${c.row},${c.col}`))) {
        showToast(`${entry.answer} ✓`)
      }
      advanceCursor(cursor, next)
      complete(next, totalCost())
    } else {
      // Gentle auto-check: wrong letters shake and clear — for a tiny cost.
      setWrongLetters((n) => n + 1)
      setShake(key)
      setTimeout(() => setShake(null), 400)
    }
  }

  const backspace = () => {
    if (cursor > 0) setCursor(cursor - 1)
  }

  const hint = () => {
    if (done) return
    const unfilledIdx = cells.findIndex((c) => !filled.has(`${c.row},${c.col}`))
    if (unfilledIdx < 0) return
    // First hint on a word reveals a letter; hinting again reveals the word.
    const wordKey = `${entry.row},${entry.col},${entry.dir}`
    if (!hintedWords.has(wordKey)) {
      const c = cells[unfilledIdx]
      const next = new Set(filled)
      next.add(`${c.row},${c.col}`)
      setFilled(next)
      setHintedWords(new Set(hintedWords).add(wordKey))
      setHintCost(hintCost + LETTER_HINT)
      complete(next, totalCost() + LETTER_HINT)
    } else {
      const next = new Set(filled)
      cells.forEach((c) => next.add(`${c.row},${c.col}`))
      setFilled(next)
      setHintCost(hintCost + WORD_HINT)
      showToast(`${entry.answer} — revealed 🙏`)
      complete(next, totalCost() + WORD_HINT)
    }
  }
  const [hintedWords, setHintedWords] = useState<Set<string>>(new Set())

  const numberAt = useMemo(() => {
    const m = new Map<string, number>()
    puzzle.entries.forEach((e) => {
      const key = `${e.row},${e.col}`
      if (!m.has(key)) m.set(key, e.number)
    })
    return m
  }, [puzzle])

  const selectCell = (row: number, col: number) => {
    const owning = puzzle.entries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => entryCells(e).some((c) => c.row === row && c.col === col))
    if (owning.length === 0) return
    const current = owning.findIndex(({ i }) => i === selectedIdx)
    const pick = owning[(current + 1) % owning.length] // tap again toggles A/D
    setSelectedIdx(pick.i)
    const pCells = entryCells(pick.e)
    const tapped = pCells.findIndex((c) => c.row === row && c.col === col)
    setCursor(tapped)
  }

  const selectedKeys = new Set(cells.map((c) => `${c.row},${c.col}`))
  const cursorKey = cells[cursor] ? `${cells[cursor].row},${cells[cursor].col}` : ''

  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Bhajan Crossword</h2>
        <p className="text-base text-ink-soft">Clued from today's bhajan — tap a word, type below</p>
      </div>

      {/* Grid */}
      <div
        className="mx-auto grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${puzzle.width}, minmax(0, 1fr))`, width: '100%', maxWidth: `${puzzle.width * 3}rem` }}
        role="grid"
        aria-label="Crossword grid"
      >
        {puzzle.solution.map((rowArr, r) =>
          rowArr.map((sol, c) => {
            const key = `${r},${c}`
            if (sol === null) return <div key={key} aria-hidden />
            const isFilled = filled.has(key)
            const inWord = selectedKeys.has(key)
            const num = numberAt.get(key)
            return (
              <button
                key={key}
                onClick={() => selectCell(r, c)}
                className={`relative aspect-square min-w-0 rounded-md border text-lg font-bold leading-none ${
                  shake === key
                    ? 'animate-pulse border-maroon bg-maroon/20 text-maroon'
                    : key === cursorKey && !done
                      ? 'border-turmeric bg-turmeric text-paper'
                      : inWord && !done
                        ? 'border-turmeric bg-turmeric/15 text-ink'
                        : isFilled
                          ? 'border-line bg-leaf/15 text-leaf'
                          : 'border-line bg-paper text-ink'
                }`}
                role="gridcell"
                aria-label={`Row ${r + 1} column ${c + 1}${isFilled ? `, ${sol}` : ', empty'}`}
              >
                {num && (
                  <span className="absolute left-0.5 top-0 text-[0.55rem] font-normal text-ink-soft">{num}</span>
                )}
                {key === cursorKey && !done && (
                  <span className="absolute bottom-0 right-0.5 text-[0.6rem]" aria-hidden>
                    {entry.dir === 'A' ? '→' : '↓'}
                  </span>
                )}
                {isFilled ? sol : ''}
              </button>
            )
          }),
        )}
      </div>

      {done ? (
        <>
          <NextGameBar today={today} current="crossword" />
          <div className="rounded-2xl border-2 border-gold bg-paper px-5 py-4 text-center">
            <p className="text-2xl">🌸</p>
            <p className="font-display text-xl text-maroon">
              Crossword complete — {points} points!
              {savedResult?.seconds != null && ` ⏱ ${formatSeconds(savedResult.seconds)}`}
            </p>
            <Link to="/bhajan" className="mt-3 inline-block min-h-12 rounded-full border-2 border-gold bg-paper px-5 py-2.5 text-lg font-semibold text-turmeric-deep">
              Sing today's bhajan 🎶
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Current clue */}
          <div className="rounded-2xl border border-line bg-paper px-4 py-3">
            <p className="text-base text-ink-soft">
              {entry.number} {entry.dir === 'A' ? 'Across' : 'Down'} · {entry.answer.length} letters
            </p>
            <p className="text-lg leading-snug text-ink">{entry.clue}</p>
          </div>

          {/* Clue chips */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {puzzle.entries.map((e, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedIdx(i)
                  const c = entryCells(e).findIndex((cc) => !filled.has(`${cc.row},${cc.col}`))
                  setCursor(c >= 0 ? c : 0)
                }}
                className={`min-h-10 rounded-full border px-3 py-1 text-base ${
                  isSolved(e)
                    ? 'border-leaf bg-leaf/10 text-leaf'
                    : i === selectedIdx
                      ? 'border-turmeric bg-turmeric text-paper'
                      : 'border-line bg-paper text-ink'
                }`}
              >
                {e.number}{e.dir} {isSolved(e) ? '✓' : ''}
              </button>
            ))}
          </div>

          <LetterPad
            onLetter={typeLetter}
            onBackspace={backspace}
            onHint={hint}
            hintLabel={
              hintedWords.has(`${entry.row},${entry.col},${entry.dir}`)
                ? `Reveal this word (−${WORD_HINT})`
                : `Reveal a letter (−${LETTER_HINT})`
            }
          />
        </>
      )}
    </div>
  )
}
