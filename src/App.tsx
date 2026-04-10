import { BrowserRouter, Routes, Route } from 'react-router'
import { HomePage } from './pages/HomePage'
import { GamePage } from './pages/GamePage'
import { RevealPage } from './pages/RevealPage'
import { AdminPage } from './pages/AdminPage'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="flex flex-col min-h-svh bg-cream">
        <header className="py-3 px-4 bg-white/80 backdrop-blur-sm border-b border-saffron-100 sticky top-0 z-40">
          <h1 className="text-center text-sm font-bold text-saffron-700 tracking-wide">
            🙏 SAI BHAJAN QUIZ
          </h1>
        </header>
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="/reveal" element={<RevealPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
