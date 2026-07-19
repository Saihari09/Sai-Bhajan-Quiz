import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Howl } from 'howler'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore } from '../store/progressStore'
import { useToastStore } from '../store/toastStore'
import { BhajanPicker } from '../components/v2/BhajanPicker'
import { seedPrompt, nextSyllable, answersFor, startSyllableOf } from '../lib/antakshari'
import { pickSeeded, seededRng, shuffleSeeded } from '../lib/seeded'
import { trackEvent } from '../lib/analytics'
import type { Bhajan } from '../types/bhajan'

const TOTAL_LINKS = 3
const LINK_POINTS = 34
const MELODY_COST = 10
const HINT_COST = 10
const RESOLVE_POINTS = 10
const LINK_FLOOR = 10
const MAX_POINTS = 100

/** Play the opening seconds of a bhajan's clip, fire-and-forget. */
function playOpening(b: Bhajan) {
  const howl = new Howl({
    src: [import.meta.env.BASE_URL + b.audio.clipUrl],
    sprite: { open: [0, 5000] },
    onend: () => howl.unload(),
  })
  howl.play('open')
}

interface LinkResult {
  bhajan: Bhajan
  points: number
}

export function AntakshariPage() {
  const { bundle, bhajans, today } = useDailyBundle()
  if (!bundle || bhajans.length === 0) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading…</div>
  }
  return <AntakshariGame key={today} bundle={bundle} bhajans={bhajans} today={today} />
}

function AntakshariGame({
  bundle,
  bhajans,
  today,
}: {
  bundle: NonNullable<ReturnType<typeof useDailyBundle>['bundle']>
  bhajans: Bhajan[]
  today: string
}) {
  const seed = useMemo(() => seedPrompt(today, bundle.bhajan, bhajans), [today, bundle, bhajans])
  const savedResult = useProgressStore((s) => s.days[today]?.results['antakshari'])
  const recordResult = useProgressStore((s) => s.recordResult)
  const showToast = useToastStore((s) => s.show)

  const [links, setLinks] = useState<LinkResult[]>([])
  const [syllable, setSyllable] = useState(seed.syllable)
  const [deduction, setDeduction] = useState(0)
  const [hintText, setHintText] = useState<string | null>(null)
  // Melody round: 3 unlabeled openings, only one starts with the syllable.
  const [melodyChoices, setMelodyChoices] = useState<{ b: Bhajan; correct: boolean }[] | null>(null)

  const usedIds = useMemo(
    () => new Set([bundle.bhajan.id, ...links.map((l) => l.bhajan.id)]),
    [links, bundle],
  )

  const done = Boolean(savedResult) || links.length >= TOTAL_LINKS
  const totalPoints = Math.min(links.reduce((sum, l) => sum + l.points, 0), MAX_POINTS)

  const completeLink = (b: Bhajan, points: number) => {
    const newLinks = [...links, { bhajan: b, points }]
    setLinks(newLinks)
    playOpening(b)
    setDeduction(0)
    setHintText(null)
    setMelodyChoices(null)

    if (newLinks.length >= TOTAL_LINKS) {
      const final = Math.min(newLinks.reduce((s, l) => s + l.points, 0), MAX_POINTS)
      recordResult(today, 'antakshari', final)
      trackEvent('antakshari_complete', today)
      showToast(`Chain complete! ${final} points 🎶`)
    } else {
      const nextUsed = new Set([bundle.bhajan.id, ...newLinks.map((l) => l.bhajan.id)])
      setSyllable(nextSyllable(today, newLinks.length, b, bhajans, nextUsed))
    }
  }

  const linkPoints = () => Math.max(LINK_POINTS - deduction, LINK_FLOOR)

  const pick = (b: Bhajan) => {
    if (done) return
    completeLink(b, linkPoints())
  }

  const openMelodyRound = () => {
    if (done || melodyChoices) return
    const valid = answersFor(syllable, bhajans, usedIds)
    if (valid.length === 0) return
    const correct = pickSeeded(valid, `${today}:melody${links.length}`)
    const decoys = shuffleSeeded(
      bhajans.filter(
        (b) => !usedIds.has(b.id) && startSyllableOf(b).toLowerCase() !== syllable.toLowerCase(),
      ),
      seededRng(`${today}:mdecoy${links.length}`),
    ).slice(0, 2)
    const choices = shuffleSeeded(
      [{ b: correct, correct: true }, ...decoys.map((b) => ({ b, correct: false }))],
      seededRng(`${today}:mshuffle${links.length}`),
    )
    setMelodyChoices(choices)
    setDeduction(deduction + MELODY_COST)
  }

  const chooseMelody = (choice: { b: Bhajan; correct: boolean }) => {
    if (done) return
    if (choice.correct) {
      showToast(`Yes — “${choice.b.title}” 🎶`)
      completeLink(choice.b, linkPoints())
    } else {
      showToast(`That one starts with “${startSyllableOf(choice.b)}” — listen again 🙏`)
    }
  }

  const useHint = () => {
    if (done || hintText) return
    const options = answersFor(syllable, bhajans, usedIds)
    if (options.length === 0) return
    const pickHint = pickSeeded(options, `${today}:hint${links.length}`)
    setDeduction(deduction + HINT_COST)
    setHintText(pickHint.title.split(/\s+/)[0] + '…')
  }

  const singForMe = () => {
    if (done) return
    const options = answersFor(syllable, bhajans, usedIds)
    if (options.length === 0) return
    completeLink(pickSeeded(options, `${today}:sing${links.length}`), RESOLVE_POINTS)
  }

  if (done) {
    const points = savedResult?.points ?? totalPoints
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
        <p className="text-4xl">🎶</p>
        <h2 className="font-display text-2xl text-maroon">Antakshari complete!</h2>
        {links.map((l, i) => (
          <p key={i} className="text-lg text-ink">
            {i + 1}. {l.bhajan.title} <span className="text-ink-soft">+{l.points}</span>
          </p>
        ))}
        <p className="text-xl font-semibold text-turmeric-deep">{points} points</p>
        <Link to="/" className="min-h-12 rounded-full bg-turmeric px-6 py-3 text-lg font-semibold text-paper">
          Back to the hub
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Antakshari</h2>
        <p className="text-lg text-ink-soft">Link {links.length + 1} of {TOTAL_LINKS}</p>
      </div>

      {/* Seed / prompt card */}
      <div className="rounded-2xl border border-line bg-paper px-5 py-4 text-center">
        {links.length === 0 && seed.sourceLine ? (
          <>
            <p className="text-base text-ink-soft">From today's bhajan:</p>
            <p className="mt-1 text-lg italic text-ink">“…{seed.sourceLine}”</p>
            <p className="mt-2 text-xl text-ink">
              The line rests on <b>{seed.sourceWord}</b> —
            </p>
          </>
        ) : (
          <p className="text-xl text-ink">The chain continues —</p>
        )}
        <p className="mt-2 font-display text-3xl text-maroon">
          sing on with “{syllable}”
        </p>
      </div>

      {/* Chain beads */}
      <div className="flex justify-center gap-2 text-2xl" aria-label={`${links.length} links completed`}>
        {Array.from({ length: TOTAL_LINKS }, (_, i) => (
          <span key={i} className={i < links.length ? '' : 'opacity-25'}>📿</span>
        ))}
      </div>

      {/* Rung 1: recall — type the bhajan you remember */}
      <BhajanPicker
        bhajans={bhajans}
        onSelect={pick}
        filterPrefix={syllable}
        requireTyping
        excludeIds={[...usedIds]}
        placeholder={`Recall a bhajan starting with “${syllable}”…`}
      />
      <p className="text-center text-base text-ink-soft">
        Any bhajan starting with “{syllable}” counts ({linkPoints()} pts) — sing it in your head, then type
      </p>

      {/* Rung 2: melody round */}
      {melodyChoices ? (
        <div className="rounded-2xl border-2 border-gold bg-paper px-4 py-3">
          <p className="mb-2 text-center text-lg text-ink">
            One of these melodies starts with “{syllable}” — trust your ears 🎧
          </p>
          <div className="flex flex-col gap-2">
            {melodyChoices.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <button
                  onClick={() => playOpening(c.b)}
                  className="min-h-12 flex-1 rounded-full bg-turmeric px-4 py-2.5 text-lg font-semibold text-paper"
                >
                  ▶ Melody {i + 1}
                </button>
                <button
                  onClick={() => chooseMelody(c)}
                  className="min-h-12 rounded-full border-2 border-line bg-ivory px-4 py-2.5 text-lg text-ink"
                >
                  This one!
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={openMelodyRound}
          className="mx-auto min-h-12 rounded-full border-2 border-gold bg-paper px-5 py-2.5 text-lg font-semibold text-turmeric-deep"
        >
          Can't recall? Play 3 melodies 🎵 (−{MELODY_COST})
        </button>
      )}

      {hintText && (
        <p className="rounded-xl bg-ivory px-4 py-2.5 text-center text-lg text-ink">
          Hint: it begins “<b>{hintText}</b>”
        </p>
      )}

      {/* Rung 3 & 4: hint and full grace */}
      <div className="flex justify-center gap-3">
        <button
          onClick={useHint}
          disabled={Boolean(hintText)}
          className="min-h-12 rounded-full border-2 border-line bg-paper px-5 py-2.5 text-lg text-ink disabled:opacity-40"
        >
          Hint (−{HINT_COST})
        </button>
        <button
          onClick={singForMe}
          className="min-h-12 rounded-full border-2 border-line bg-paper px-5 py-2.5 text-lg text-ink"
        >
          Sing it for me 🎵 (+{RESOLVE_POINTS})
        </button>
      </div>
    </div>
  )
}
