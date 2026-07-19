import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/rozha-one'
import '@fontsource/mukta/400.css'
import '@fontsource/mukta/500.css'
import '@fontsource/mukta/600.css'
import '@fontsource/mukta/700.css'
import './index.css'
import App from './App.tsx'
import { initOneSignal } from './lib/notifications'

// Initialize OneSignal push notifications
initOneSignal()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
