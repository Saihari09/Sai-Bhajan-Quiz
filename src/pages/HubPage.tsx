import { useState } from 'react'
import { Link } from 'react-router'
import { format } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import { SupportModal } from '../components/SupportModal'
import { NotificationPrompt } from '../components/NotificationPrompt'
import { useInstallStore } from '../store/installStore'
import { useSettingsStore } from '../store/settingsStore'
import { useDailyBundle } from '../hooks/useDailyBundle'
import { useProgressStore, dayPoints, lifetimeLamps } from '../store/progressStore'
import { useToastStore } from '../store/toastStore'
import { Rangoli } from '../components/v2/Rangoli'
import { LampsRow } from '../components/v2/LampsRow'
import { GameTile } from '../components/v2/GameTile'
import { trackEvent } from '../lib/analytics'
import type { GameId } from '../lib/daily'

const GAME_META: Record<GameId, { emoji: string; title: string; subtitle: string }> = {
  heardle: { emoji: '🎵', title: 'Guess the Bhajan', subtitle: 'Name it from the melody' },
  crossword: { emoji: '✏️', title: 'Bhajan Crossword', subtitle: "Clued from today's bhajan" },
  wordsearch: { emoji: '🔡', title: 'Naamavali Search', subtitle: 'One name hides in each grid' },
  antakshari: { emoji: '🎤', title: 'Antakshari', subtitle: 'Sing on from the syllable' },
  deity: { emoji: '🖼️', title: 'Guess the Deity', subtitle: 'Un-scramble the darshan' },
  linebuilder: { emoji: '🧩', title: 'Build the Line', subtitle: 'Lay the words in order' },
  lyrictrail: { emoji: '🪷', title: 'Lyric Trail', subtitle: 'Trace the winding line' },
}

export function HubPage() {
  const { bundle, today } = useDailyBundle()
  const day = useProgressStore((s) => s.days[today])
  const days = useProgressStore((s) => s.days)
  const showToast = useToastStore((s) => s.show)
  const displayName = useSettingsStore((s) => s.displayName)
  const [supportOpen, setSupportOpen] = useState(false)
  const [notifClosed, setNotifClosed] = useState(false)
  const notifEnabledAt = useInstallStore((s) => s.notifEnableClickedAt)
  // Captured once per mount — dismissing/enabling closes via notifClosed.
  const [notifPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'denied',
  )
  const [notifSnoozed] = useState(() => {
    const dismissedAt = useInstallStore.getState().notifPromptDismissedAt
    if (!dismissedAt) return false
    return Date.now() - new Date(dismissedAt).getTime() < 7 * 24 * 60 * 60 * 1000
  })

  // V1 behavior carried over: offer daily reminders after the first
  // completed game — never again once enabled, 7-day snooze on dismiss.
  const notifOpen =
    !notifClosed &&
    !notifEnabledAt &&
    notifPermission === 'default' &&
    !notifSnoozed &&
    Object.keys(day?.results ?? {}).length >= 1

  if (!bundle) {
    return <div className="flex-1 grid place-items-center text-xl text-ink-soft">Loading today's satsang…</div>
  }

  const doneCount = bundle.games.filter((g) => day?.results[g]).length
  const totalPoints = dayPoints(day)
  const allDone = doneCount === bundle.games.length
  const heardleDone = Boolean(day?.results['heardle'])
  const lamps = lifetimeLamps({ days })

  const share = async () => {
    const petals = bundle.games.map((g) => (day?.results[g] ? '🌸' : '🕳️')).join('')
    // Dynamic origin so any deploy (beta or live) shares its own URL.
    const appUrl = window.location.origin + import.meta.env.BASE_URL
    const text = `Bhajan Bodh — ${format(new Date(today + 'T12:00:00'), 'MMM d')}\n${petals}  ${totalPoints} pts 🪔\nPlay today's bhajan games: ${appUrl}`
    trackEvent('share_score')
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        showToast('Copied — paste it in WhatsApp 🙏')
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* Date + deity chip */}
      <div className="flex items-center justify-between">
        <span className="text-lg text-ink-soft">
          {format(new Date(today + 'T12:00:00'), 'EEEE, MMM d')}
        </span>
        <span className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-lg">
          {bundle.family.emoji} {bundle.family.label} day
        </span>
      </div>

      {/* Quote of the day */}
      <figure className="rounded-2xl border border-line bg-paper px-5 py-4">
        <blockquote className="font-display text-xl leading-snug text-maroon">
          “{bundle.quote.text}”
        </blockquote>
        <figcaption className="mt-1.5 text-base text-ink-soft">— {bundle.quote.author}</figcaption>
      </figure>

      {/* Today's rangoli */}
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper px-5 py-4">
        <Rangoli petals={bundle.games.length} filled={doneCount} seed={today} size={104} />
        <div>
          <p className="font-display text-xl text-ink">Today's rangoli</p>
          <p className="text-lg text-ink-soft">
            {doneCount} of {bundle.games.length} games · {totalPoints} pts
          </p>
          {allDone ? (
            <button
              onClick={share}
              className="mt-2 min-h-12 rounded-full bg-maroon px-5 py-2 text-lg font-semibold text-paper"
            >
              Share 🙏
            </button>
          ) : (
            <p className="mt-1 text-base text-ink-soft">Complete the games to finish it</p>
          )}
        </div>
      </div>

      {/* Game tiles */}
      <div className="grid grid-cols-2 gap-4">
        {bundle.games.map((g) => (
          <GameTile
            key={g}
            to={`/play/${g}`}
            emoji={GAME_META[g].emoji}
            title={GAME_META[g].title}
            subtitle={GAME_META[g].subtitle}
            done={Boolean(day?.results[g])}
            points={day?.results[g]?.points}
          />
        ))}
      </div>

      {/* Weekly lamps */}
      <div className="rounded-2xl border border-line bg-paper px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-display text-xl text-ink">This week's lamps</p>
          <p className="text-base text-ink-soft">🪔 {lamps} of 108 Mala</p>
        </div>
        <LampsRow />
      </div>

      {/* Leaderboard */}
      <Link to="/leaderboard" className="flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4">
        <span className="font-display text-xl text-ink">🏆 Satsang leaderboard</span>
        <span className="text-lg text-turmeric-deep">→</span>
      </Link>

      {/* Nudge: a name makes the satsang board personal */}
      {doneCount >= 1 && !displayName && (
        <Link to="/leaderboard" className="block rounded-2xl border-2 border-gold bg-paper px-5 py-4">
          <p className="text-lg text-ink">
            🪔 <b>Add your name</b> so your satsang can see you on today's board — you already
            have <b>{totalPoints} points</b> waiting to shine!
          </p>
        </Link>
      )}

      {/* Bless the developer (carried over from V1) */}
      <button
        onClick={() => setSupportOpen(true)}
        className="flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4 text-left"
      >
        <span className="font-display text-xl text-ink">🙏 Bless the developer</span>
        <span className="text-lg text-turmeric-deep">→</span>
      </button>

      {/* Bhajan of the day */}
      {heardleDone ? (
        <Link to="/bhajan" className="rounded-2xl border-2 border-gold bg-paper px-5 py-4 block">
          <p className="text-base uppercase tracking-wide text-ink-soft">Bhajan of the day</p>
          <p className="font-display text-2xl text-maroon">{bundle.bhajan.title}</p>
          <p className="mt-1 text-lg text-turmeric-deep">Listen & sing along →</p>
        </Link>
      ) : (
        <Link to="/play/heardle" className="rounded-2xl border border-line bg-ivory px-5 py-4 block">
          <p className="text-base uppercase tracking-wide text-ink-soft">Bhajan of the day</p>
          <p className="text-lg text-ink-soft">🔒 Revealed once you guess it — play the melody game first</p>
        </Link>
      )}

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <AnimatePresence>
        {notifOpen && <NotificationPrompt onClose={() => setNotifClosed(true)} />}
      </AnimatePresence>
    </div>
  )
}
