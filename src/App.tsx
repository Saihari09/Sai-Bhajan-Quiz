import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'
import { RevealPage } from './pages/RevealPage'
import { AdminPage } from './pages/AdminPage'
import { InstallBanner } from './components/InstallBanner'
import { setDeferredPrompt } from './lib/installPrompt'
import { useInstallStore } from './store/installStore'

function App() {
  useEffect(() => {
    // Track visits for install prompt timing
    useInstallStore.getState().incrementVisit()

    // Capture the browser's install prompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="flex flex-col min-h-svh">
        <header className="py-2.5 px-4 bg-navy-600 sticky top-0 z-40 shadow-md">
          <Link to="/" className="flex items-center justify-center gap-2">
            <img
              src={import.meta.env.BASE_URL + 'images/logo.png'}
              alt="Sathya Sai"
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-center text-sm font-bold text-white tracking-wider uppercase">
              Sai Bhajan Quiz
            </h1>
          </Link>
        </header>
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="/play/:date" element={<GamePage />} />
            <Route path="/reveal" element={<RevealPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <InstallBanner />
      </div>
    </BrowserRouter>
  )
}

export default App
