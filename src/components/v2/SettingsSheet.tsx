import { useSettingsStore, type TextScale } from '../../store/settingsStore'

const SCALE_LABELS: { value: TextScale; label: string }[] = [
  { value: 0, label: 'A' },
  { value: 1, label: 'A+' },
  { value: 2, label: 'A++' },
]

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { textScale, setTextScale, soundOn, setSoundOn, displayName, setDisplayName } =
    useSettingsStore()

  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <div
        className="absolute bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 rounded-t-3xl bg-paper px-6 pb-8 pt-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Settings"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
        <h2 className="font-display text-2xl text-maroon">Settings</h2>

        <label className="mt-5 block text-lg text-ink" htmlFor="display-name">
          Your name (for leaderboards, coming soon)
        </label>
        <input
          id="display-name"
          type="text"
          maxLength={20}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Radha"
          className="mt-1.5 w-full min-h-12 rounded-2xl border-2 border-line bg-ivory px-4 py-3 text-lg focus:border-turmeric focus:outline-none"
        />

        <p className="mt-5 text-lg text-ink">Text size</p>
        <div className="mt-1.5 flex gap-2">
          {SCALE_LABELS.map((s) => (
            <button
              key={s.value}
              onClick={() => setTextScale(s.value)}
              className={`min-h-12 flex-1 rounded-2xl border-2 px-4 py-2.5 text-lg font-semibold ${
                textScale === s.value
                  ? 'border-turmeric bg-turmeric text-paper'
                  : 'border-line bg-ivory text-ink'
              }`}
              aria-pressed={textScale === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSoundOn(!soundOn)}
          className="mt-5 flex min-h-12 w-full items-center justify-between rounded-2xl border-2 border-line bg-ivory px-4 py-3 text-lg"
          aria-pressed={soundOn}
        >
          <span>Sounds</span>
          <span>{soundOn ? 'On 🔔' : 'Off 🔕'}</span>
        </button>

        <button
          onClick={onClose}
          className="mt-6 min-h-12 w-full rounded-full bg-maroon py-3 text-lg font-semibold text-paper"
        >
          Done
        </button>
      </div>
    </div>
  )
}
