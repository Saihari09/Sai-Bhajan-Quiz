import { useMemo, useState } from 'react'
import { Howl } from 'howler'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { DEITY_OPTIONS, type Bhajan, type DeityOption } from '../types/bhajan'
import { hashString, seededRng, shuffleSeeded, pickSeeded } from '../lib/seeded'
import { NextGameBar } from '../components/v2/NextGameBar'
import { useGameTimer } from '../hooks/useGameTimer'
import { formatSeconds } from '../lib/dateUtils'
import { trackEvent } from '../lib/analytics'

const WRONG_COST = 10
const OVER_PAR_COST = 5
const HINT_COST = 10
const FLOOR = 40

/**
 * Par = the fewest swaps that can solve the scramble (sum over permutation
 * cycles of length − 1). Shown up front — match it for full points.
 */
function minSwaps(order: number[]): number {
  const seen = new Array(order.length).fill(false)
  let swaps = 0
  for (let i = 0; i < order.length; i++) {
    if (seen[i] || order[i] === i) continue
    let len = 0
    let j = i
    while (!seen[j]) {
      seen[j] = true
      j = order[j]
      len++
    }
    swaps += len - 1
  }
  return swaps
}

export function DeityPuzzlePage() {
  const { bundle, bhajans, today } = useDailyBundle()
  if (!bundle || bhajans.length === 0) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <DeityPuzzleGame key={today} bhajans={bhajans} today={today} />
}

function DeityPuzzleGame({ bhajans, today }: { bhajans: Bhajan[]; today: string }) {
  const savedResult = useProgressStore((s) => s.days[today]?.results['deity'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const soundOn = useSettingsStore((s) => s.soundOn)
  const showToast = useToastStore((s) => s.show)

  const { answer, options, initialOrder } = useMemo(() => {
    // Only deities that have bhajans in the library — solving plays their song.
    const withSongs = DEITY_OPTIONS.filter((d) =>
      bhajans.some((b) => b.deity === d.tag),
    )
    const answer = withSongs[hashString(today + ':deitypick') % withSongs.length]
    const decoys = shuffleSeeded(
      withSongs.filter((d) => d.tag !== answer.tag),
      seededRng(today + ':decoys'),
    ).slice(0, 3)
    const options = shuffleSeeded([answer, ...decoys], seededRng(today + ':opts'))
    let initialOrder = shuffleSeeded([0, 1, 2, 3, 4, 5, 6, 7, 8], seededRng(today + ':tiles'))
    if (initialOrder.every((v, i) => v === i)) initialOrder = [...initialOrder.slice(1), initialOrder[0]]
    return { answer, options, initialOrder }
  }, [bhajans, today])

  const [order, setOrder] = useState<number[]>(() =>
    savedResult ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : initialOrder,
  )
  const [picked, setPicked] = useState<number | null>(null)
  const [swaps, setSwaps] = useState(0)
  const [hints, setHints] = useState(0)
  const [wrongTags, setWrongTags] = useState<Set<string>>(new Set())
  const [solved, setSolved] = useState<boolean>(Boolean(savedResult))
  const par = useMemo(() => minSwaps(initialOrder), [initialOrder])

  // Rotate between images when a deity has several (drop extra files in
  // public/images/deities/ and list them in DEITY_OPTIONS.imageUrls).
  const imagePool = answer.imageUrls?.length ? answer.imageUrls : [answer.imageUrl]
  const imageUrl = import.meta.env.BASE_URL + pickSeeded(imagePool, today + ':deityimg')

  const elapsed = useGameTimer()
  const finish = (wrongCount: number) => {
    const overPar = Math.max(swaps - par, 0)
    const points = Math.max(
      100 - overPar * OVER_PAR_COST - wrongCount * WRONG_COST - hints * HINT_COST,
      FLOOR,
    )
    setSolved(true)
    setOrder([0, 1, 2, 3, 4, 5, 6, 7, 8])
    recordResult(today, 'deity', points, elapsed())
    trackEvent('deity_complete', today)
    showToast(`It is ${answer.displayName}! ${points} points 🙏`)
    if (soundOn) {
      const song = pickSeeded(
        bhajans.filter((b) => b.deity === answer.tag),
        today + ':deitysong',
      )
      const howl = new Howl({
        src: [import.meta.env.BASE_URL + song.audio.clipUrl],
        sprite: { open: [0, 6000] },
        onend: () => howl.unload(),
      })
      howl.play('open')
    }
  }

  const tapTile = (pos: number) => {
    if (solved) return
    if (picked === null) {
      setPicked(pos)
      return
    }
    if (picked === pos) {
      setPicked(null)
      return
    }
    const next = [...order]
    ;[next[picked], next[pos]] = [next[pos], next[picked]]
    setOrder(next)
    setPicked(null)
    setSwaps(swaps + 1)
  }

  const guess = (d: DeityOption) => {
    if (solved) return
    if (d.tag === answer.tag) {
      finish(wrongTags.size)
    } else {
      setWrongTags(new Set(wrongTags).add(d.tag))
      showToast(`Not this one (−${WRONG_COST}) — look at the darshan once more 🙏`)
    }
  }

  // Mercy: place one tile correctly (−10, doesn't count as a swap).
  const placeOneTile = () => {
    if (solved) return
    const p = order.findIndex((v, i) => v !== i)
    if (p === -1) return
    const q = order.indexOf(p)
    const next = [...order]
    ;[next[p], next[q]] = [next[q], next[p]]
    setOrder(next)
    setPicked(null)
    setHints(hints + 1)
    showToast(`One tile placed (−${HINT_COST}) 🙏`)
  }

  const points = savedResult?.points
  // Tester feedback: when the image is assembled by swapping, celebrate and
  // point straight at the names.
  const assembled = !solved && order.every((v, i) => v === i)

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {solved && <NextGameBar today={today} current="deity" />}
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Guess the Deity</h2>
        <p className="text-lg text-ink-soft">
          Tap two tiles to swap them and reveal the darshan — then name who it is.
        </p>
      </div>

      {/* Par: the fewest swaps that can solve today's scramble */}
      <div className="flex justify-center gap-2 text-base" aria-label={`Par ${par} swaps, you have used ${swaps}`}>
        <span className="rounded-full border border-gold bg-gold/10 px-3.5 py-1 font-semibold text-turmeric-deep">
          ⛳ Par: {par} swaps
        </span>
        <span
          className={`rounded-full px-3.5 py-1 ${
            swaps <= par ? 'bg-leaf/15 text-leaf border border-leaf' : 'bg-ivory text-ink-soft border border-line'
          }`}
        >
          You: {swaps}
          {swaps > par && ` (+${swaps - par}, −${(swaps - par) * OVER_PAR_COST} pts)`}
        </span>
      </div>

      {/* The scrambled murti */}
      <div
        className="mx-auto grid aspect-square w-full max-w-sm grid-cols-3 gap-1 rounded-2xl border-2 border-gold bg-paper p-1.5"
        role="grid"
        aria-label="Scrambled deity image"
      >
        {order.map((tileIdx, pos) => (
          <button
            key={pos}
            onClick={() => tapTile(pos)}
            className={`relative min-w-0 overflow-hidden rounded-lg ${
              picked === pos ? 'ring-4 ring-turmeric' : ''
            } ${solved ? '' : 'active:opacity-80'}`}
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: '300% 300%',
              backgroundPosition: `${(tileIdx % 3) * 50}% ${Math.floor(tileIdx / 3) * 50}%`,
            }}
            aria-label={`Tile ${pos + 1}${picked === pos ? ', selected' : ''}`}
          />
        ))}
      </div>
      <p className="text-center text-base text-ink-soft">{swaps} swaps so far</p>

      {solved ? (
        <div className="rounded-2xl border-2 border-gold bg-paper px-5 py-4 text-center">
          <p className="text-2xl">🙏</p>
          <p className="font-display text-2xl text-maroon">{answer.displayName}</p>
          {points !== undefined && (
            <p className="text-lg text-ink-soft">
              {points} points
              {savedResult?.seconds != null && ` · ⏱ ${formatSeconds(savedResult.seconds)}`}
            </p>
          )}
        </div>
      ) : assembled ? (
        <>
          {/* Names appear only once the darshan is assembled */}
          <p className="rounded-2xl border-2 border-gold bg-gold/10 px-4 py-3 text-center text-lg font-semibold text-turmeric-deep">
            🌸 The darshan is revealed — now, who is it?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {options.map((d) => (
              <button
                key={d.tag}
                onClick={() => guess(d)}
                disabled={wrongTags.has(d.tag)}
                className="min-h-12 rounded-2xl border-2 border-gold bg-paper px-4 py-3 text-lg font-semibold text-ink active:border-turmeric disabled:opacity-35"
              >
                {d.displayName}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button
          onClick={placeOneTile}
          className="mx-auto min-h-12 rounded-full border-2 border-line bg-paper px-6 py-2.5 text-lg text-ink"
        >
          Place one tile for me 🙏 (−{HINT_COST})
        </button>
      )}
    </div>
  )
}
