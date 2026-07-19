import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import { HubPage } from './pages/HubPage'
import { BhajanOfDayPage } from './pages/BhajanOfDayPage'
import { HeardlePage } from './pages/HeardlePage'
import { WordSearchPage } from './pages/WordSearchPage'
import { AntakshariPage } from './pages/AntakshariPage'
import { LyricTrailPage } from './pages/LyricTrailPage'
import { CrosswordPage } from './pages/CrosswordPage'
import { DeityPuzzlePage } from './pages/DeityPuzzlePage'
import { LineBuilderPage } from './pages/LineBuilderPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { startScoreSync } from './lib/scoreSync'
import { GamePage } from './pages/GamePage'
import { RevealPage } from './pages/RevealPage'
import { AdminPage } from './pages/AdminPage'
import { ArchivePage } from './pages/ArchivePage'
import { InstallBanner } from './components/InstallBanner'
import { SettingsSheet } from './components/v2/SettingsSheet'
import { HowToPlay } from './components/v2/HowToPlay'
import { Toast } from './components/v2/Toast'
import { setDeferredPrompt } from './lib/installPrompt'
import { useInstallStore } from './store/installStore'
import { useSettingsStore, applyTextScale } from './store/settingsStore'
import { migrateFromV1 } from './store/progressStore'

const WELCOME_KEY = 'bhajan-bodh-welcome-seen'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  // First V2 visit: the rules sheet opens as a welcome; ❓ reopens it anytime.
  const [rulesOpen, setRulesOpen] = useState(() => !localStorage.getItem(WELCOME_KEY))
  const [isWelcome] = useState(() => !localStorage.getItem(WELCOME_KEY))
  const cycleTextScale = useSettingsStore((s) => s.cycleTextScale)
  const textScale = useSettingsStore((s) => s.textScale)

  useEffect(() => {
    migrateFromV1()
    applyTextScale(useSettingsStore.getState().textScale)
    useInstallStore.getState().incrementVisit()
    startScoreSync()

    // WhatsApp invite links land as ?join=CODE — remember it for the leaderboard.
    const joinCode = new URLSearchParams(window.location.search).get('join')
    if (joinCode && /^[A-Za-z0-9]{6}$/.test(joinCode)) {
      localStorage.setItem('bhajan-bodh-pending-join', joinCode.toUpperCase())
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-paper px-4 py-2.5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>🪔</span>
              <h1 className="font-display text-2xl text-maroon">Bhajan Bodh</h1>
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRulesOpen(true)}
                className="min-h-12 min-w-12 rounded-2xl border border-line bg-ivory px-3 text-xl"
                aria-label="How to play"
              >
                ❓
              </button>
              <button
                onClick={cycleTextScale}
                className="min-h-12 min-w-12 rounded-2xl border border-line bg-ivory px-3 text-lg font-bold text-ink"
                aria-label={`Text size: ${['normal', 'large', 'largest'][textScale]}. Tap to change.`}
              >
                {['A', 'A+', 'A++'][textScale]}
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="min-h-12 min-w-12 rounded-2xl border border-line bg-ivory px-3 text-xl"
                aria-label="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col">
          <Routes>
            <Route path="/" element={<HubPage />} />
            <Route path="/bhajan" element={<BhajanOfDayPage />} />
            <Route path="/play/heardle" element={<HeardlePage />} />
            <Route path="/play/wordsearch" element={<WordSearchPage />} />
            <Route path="/play/antakshari" element={<AntakshariPage />} />
            <Route path="/play/lyrictrail" element={<LyricTrailPage />} />
            <Route path="/play/crossword" element={<CrosswordPage />} />
            <Route path="/play/deity" element={<DeityPuzzlePage />} />
            <Route path="/play/linebuilder" element={<LineBuilderPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* Legacy V1 routes kept for the archive of past puzzles */}
            <Route path="/play/:date" element={<GamePage />} />
            <Route path="/reveal" element={<RevealPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
        <HowToPlay
          open={rulesOpen}
          isWelcome={isWelcome}
          onClose={() => {
            localStorage.setItem(WELCOME_KEY, '1')
            setRulesOpen(false)
          }}
        />
        <Toast />
        <InstallBanner />
      </div>
    </BrowserRouter>
  )
}

export default App
