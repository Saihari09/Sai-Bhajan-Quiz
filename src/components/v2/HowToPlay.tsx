import { motion, AnimatePresence } from 'framer-motion'

const RULES: { emoji: string; title: string; rule: string }[] = [
  { emoji: '🎵', title: 'Guess the Bhajan', rule: 'Hear a little of the melody (tap 5s, 10s, or 13s), type a few letters, then tap the bhajan’s name in the list. Replays are always free.' },
  { emoji: '🧩', title: 'Build the Line', rule: "Sing today's line in your head and tap its words into order." },
  { emoji: '✏️', title: 'Bhajan Crossword', rule: "Fill the mini crossword — clues come from today's bhajan and bhakti words. Type on the big keypad; wrong letters gently clear themselves." },
  { emoji: '🔡', title: 'Naamavali Search', rule: 'One divine name hides in each grid — any direction, even backwards. Tap its first letter, then its last.' },
  { emoji: '🖼️', title: 'Guess the Deity', rule: 'Swap tiles to reveal the murti — name the deity early for extra points.' },
]

interface Props {
  open: boolean
  isWelcome: boolean
  onClose: () => void
}

/**
 * Rules sheet — appears automatically as a welcome on first V2 visit,
 * and any time after from the ❓ button in the header.
 */
export function HowToPlay({ open, isWelcome, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="max-h-[88svh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-paper px-6 pb-8 pt-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="How to play"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
            {isWelcome ? (
              <div className="mb-4 text-center">
                <p className="text-4xl">🪔</p>
                <h2 className="font-display text-2xl leading-tight text-maroon">
                  Welcome to the new Bhajan Bodh!
                </h2>
                <p className="mt-1.5 text-lg leading-snug text-ink-soft">
                  Your daily quiz has grown into a little games mandir — five gentle games,
                  one bhajan each day. A fresh journey begins today — come light your first lamp!
                </p>
              </div>
            ) : (
              <h2 className="mb-4 text-center font-display text-2xl text-maroon">How to play</h2>
            )}

            <p className="mb-3 rounded-2xl bg-turmeric/10 px-4 py-3 text-center text-lg font-semibold text-turmeric-deep">
              Play all <b>5 games</b> each day to complete your rangoli 🌸
            </p>

            <div className="flex flex-col gap-3">
              {RULES.map((r) => (
                <div key={r.title} className="rounded-2xl border border-line bg-ivory px-4 py-3">
                  <p className="text-lg font-semibold text-ink">
                    <span aria-hidden>{r.emoji}</span> {r.title}
                  </p>
                  <p className="mt-0.5 text-lg leading-snug text-ink-soft">{r.rule}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-gold bg-paper px-4 py-3">
              <p className="text-lg leading-snug text-ink">
                Every game is worth up to <b>100 points</b> — finish all five to complete the day's{' '}
                <b>rangoli</b> 🌸. Playing any game lights that day's <b>lamp</b> 🪔 (108 lamps
                completes the Mala!). There are no timers and no way to fail — hints always help,
                gently. On the <b>🏆 leaderboard</b>, <b>add your name</b> so your satsang can
                see you on the board — and play past days from <b>🗓️ Previous days</b>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-5 min-h-12 w-full rounded-full bg-turmeric py-3 text-lg font-semibold text-paper"
            >
              {isWelcome ? "Let's sing! 🎶" : 'Got it 🙏'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
