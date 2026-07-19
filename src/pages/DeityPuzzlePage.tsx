import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Howl } from 'howler'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { DEITY_OPTIONS, type Bhajan, type DeityOption } from '../types/bhajan'
import { hashString, seededRng, shuffleSeeded, pickSeeded } from '../lib/seeded'
import { trackEvent } from '../lib/analytics'

const WRONG_COST = 10
const FLOOR = 40

/** Fewer swaps before the correct guess → more points (Heardle, in pictures). */
function tierPoints(swaps: number): number {
  if (swaps <= 2) return 100
  if (swaps <= 5) return 80
  return 60
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
  const [wrongTags, setWrongTags] = useState<Set<string>>(new Set())
  const [solved, setSolved] = useState<boolean>(Boolean(savedResult))

  const imageUrl = import.meta.env.BASE_URL + answer.imageUrl

  const finish = (finalSwaps: number, wrongCount: number) => {
    const points = Math.max(tierPoints(finalSwaps) - wrongCount * WRONG_COST, FLOOR)
    setSolved(true)
    setOrder([0, 1, 2, 3, 4, 5, 6, 7, 8])
    recordResult(today, 'deity', points)
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
      finish(swaps, wrongTags.size)
    } else {
      setWrongTags(new Set(wrongTags).add(d.tag))
      showToast('Not this one — swap a few more tiles and look again 🙏')
    }
  }

  const points = savedResult?.points

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Guess the Deity</h2>
        <p className="text-lg text-ink-soft">
          Tap two tiles to swap them. Name the deity as early as you dare — fewer swaps, more points!
        </p>
      </div>

      {/* Score tiers */}
      <div className="flex justify-center gap-2 text-base" aria-label="Points by swaps used">
        <span className={`rounded-full px-3 py-1 ${swaps <= 2 ? 'bg-turmeric text-paper' : 'bg-ivory text-ink-soft border border-line'}`}>
          ≤2 swaps · 100
        </span>
        <span className={`rounded-full px-3 py-1 ${swaps > 2 && swaps <= 5 ? 'bg-turmeric text-paper' : 'bg-ivory text-ink-soft border border-line'}`}>
          ≤5 · 80
        </span>
        <span className={`rounded-full px-3 py-1 ${swaps > 5 ? 'bg-turmeric text-paper' : 'bg-ivory text-ink-soft border border-line'}`}>
          more · 60
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
          {points !== undefined && <p className="text-lg text-ink-soft">{points} points</p>}
          <Link to="/" className="mt-3 inline-block min-h-12 rounded-full bg-turmeric px-6 py-2.5 text-lg font-semibold text-paper">
            Back to the hub
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((d) => (
            <button
              key={d.tag}
              onClick={() => guess(d)}
              disabled={wrongTags.has(d.tag)}
              className="min-h-12 rounded-2xl border-2 border-line bg-paper px-4 py-3 text-lg font-semibold text-ink active:border-turmeric disabled:opacity-35"
            >
              {d.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
