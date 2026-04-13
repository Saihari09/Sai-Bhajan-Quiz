import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInstallStore } from '../store/installStore'
import { getDeferredPrompt, clearDeferredPrompt } from '../lib/installPrompt'
import { trackEvent } from '../lib/analytics'

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true
}

export function InstallBanner() {
  const store = useInstallStore()
  const [visible, setVisible] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    if (isStandalone()) return

    // Already accepted install
    if (store.installAcceptedAt) return

    // Don't show on first visit
    if (store.visitCount < 2) return

    // Dismissed less than 7 days ago
    if (store.promptDismissedAt) {
      const dismissedMs = new Date(store.promptDismissedAt).getTime()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedMs < sevenDaysMs) return
    }

    // iOS — show manual instructions
    if (isIOS()) {
      setShowIOSTip(true)
      setVisible(true)
      return
    }

    // Chromium — check for deferred prompt
    if (getDeferredPrompt()) {
      setVisible(true)
    }
  }, [store.visitCount, store.installAcceptedAt, store.promptDismissedAt])

  const handleInstall = async () => {
    const prompt = getDeferredPrompt()
    if (!prompt) return

    await prompt.prompt()
    const { outcome } = await prompt.userChoice

    if (outcome === 'accepted') {
      store.acceptInstall()
      trackEvent('install_app')
    } else {
      store.dismissPrompt()
    }

    clearDeferredPrompt()
    setVisible(false)
  }

  const handleDismiss = () => {
    store.dismissPrompt()
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={import.meta.env.BASE_URL + 'icons/icon-192.png'}
                alt="Sai Bhajan Quiz"
                className="w-10 h-10 rounded-xl"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-navy-700">Add to Home Screen</p>
                <p className="text-xs text-gray-500">Play daily — right from your phone</p>
              </div>
            </div>

            {showIOSTip ? (
              <>
                <p className="text-xs text-gray-600 mb-3 bg-gray-50 rounded-xl p-3">
                  Tap the <span className="font-bold">Share</span> button in Safari, then tap <span className="font-bold">Add to Home Screen</span>
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 text-sm font-bold text-gray-500 rounded-xl active:bg-gray-50"
                >
                  Got it
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-500 rounded-xl active:bg-gray-50"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-saffron-500 to-saffron-600 rounded-xl active:from-saffron-600 active:to-saffron-700 shadow-md"
                >
                  Install
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
