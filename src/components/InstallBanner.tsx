import { useState, useEffect } from 'react'
import { useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useInstallStore } from '../store/installStore'
import { useStreakStore } from '../store/streakStore'
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
  const totalGamesPlayed = useStreakStore((s) => s.totalGamesPlayed)
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [iosDevice, setIosDevice] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  useEffect(() => {
    // Hide during gameplay (notification prompt may be showing)
    if (location.pathname.startsWith('/play')) {
      setVisible(false)
      return
    }

    // Already running as installed PWA
    if (isStandalone()) return

    // User already installed
    if (store.installAcceptedAt) return

    // Wait until user has completed at least one game
    if (totalGamesPlayed < 1) return

    // Dismissed less than 7 days ago
    if (store.promptDismissedAt) {
      const dismissedMs = new Date(store.promptDismissedAt).getTime()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedMs < sevenDaysMs) return
    }

    // iOS — show manual instructions
    if (isIOS()) {
      setIosDevice(true)
      setVisible(true)
      return
    }

    // Chromium — check for deferred prompt
    if (getDeferredPrompt()) {
      setVisible(true)
    }
  }, [store.installAcceptedAt, store.promptDismissedAt, location.pathname, totalGamesPlayed])

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
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          {/* Backdrop shadow */}
          <div className="absolute inset-0 -top-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          <div className="relative mx-3 mb-3 max-w-md sm:mx-auto">
            <div className="bg-gradient-to-br from-saffron-50 via-white to-orange-50 rounded-3xl shadow-2xl border-2 border-saffron-200 overflow-hidden">
              {/* Header with image */}
              <div className="flex items-center gap-4 px-5 pt-5 pb-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-saffron-200 shrink-0 bg-white">
                  <img
                    src={import.meta.env.BASE_URL + 'images/logo.png'}
                    alt="Sai Bhajan Quiz"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-navy-700 leading-tight">
                    Add to Home Screen
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Get instant access & never miss a daily quiz!
                  </p>
                </div>
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:bg-gray-200 shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Benefits */}
              <div className="px-5 pb-3">
                <div className="flex gap-3 text-[11px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="text-saffron-500">⚡</span> Opens instantly
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-saffron-500">🔔</span> Daily reminders
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-saffron-500">📱</span> Works offline
                  </span>
                </div>
              </div>

              {iosDevice ? (
                /* ── iOS step-by-step instructions ── */
                <div className="px-5 pb-5">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                    <p className="text-xs font-bold text-navy-700 uppercase tracking-wider">How to install</p>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="text-sm font-semibold text-navy-700">
                          Tap the Share button
                          <span className="inline-block ml-1.5 align-middle">
                            <svg className="w-5 h-5 text-blue-500 inline" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
                            </svg>
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          At the bottom of Safari (or top in iPad)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="text-sm font-semibold text-navy-700">
                          Scroll down & tap "Add to Home Screen"
                          <span className="inline-block ml-1.5 align-middle">
                            <svg className="w-5 h-5 text-blue-500 inline" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          You may need to scroll the share sheet to find it
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="text-sm font-semibold text-navy-700">
                          Tap "Add" in the top right
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          The app icon will appear on your home screen
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleDismiss}
                    className="w-full mt-3 py-3 text-sm font-bold text-saffron-600 bg-saffron-50 border-2 border-saffron-200 rounded-2xl active:bg-saffron-100 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              ) : (
                /* ── Android / Chrome install ── */
                <div className="px-5 pb-5">
                  {!showSteps ? (
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setShowSteps(true)}
                        className="flex-1 py-3 text-sm font-bold text-navy-600 bg-white border-2 border-navy-100 rounded-2xl active:bg-navy-50 transition-colors"
                      >
                        Show me how
                      </button>
                      <button
                        onClick={handleInstall}
                        className="flex-1 py-3 text-sm font-black text-white bg-gradient-to-r from-saffron-500 to-saffron-600 rounded-2xl active:from-saffron-600 active:to-saffron-700 shadow-lg shadow-saffron-200 transition-all"
                      >
                        Install App
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                        <p className="text-xs font-bold text-navy-700 uppercase tracking-wider">How to install</p>

                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <div>
                            <p className="text-sm font-semibold text-navy-700">
                              Tap the menu
                              <span className="inline-block ml-1.5 align-middle">
                                <svg className="w-5 h-5 text-gray-600 inline" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Three dots at the top right of Chrome
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <div>
                            <p className="text-sm font-semibold text-navy-700">
                              Tap "Add to Home screen"
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Or "Install app" if you see that option
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <div>
                            <p className="text-sm font-semibold text-navy-700">
                              Tap "Install" to confirm
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              The app icon will appear on your home screen
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => setShowSteps(false)}
                          className="flex-1 py-3 text-sm font-bold text-gray-500 rounded-2xl active:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleInstall}
                          className="flex-1 py-3 text-sm font-black text-white bg-gradient-to-r from-saffron-500 to-saffron-600 rounded-2xl active:from-saffron-600 active:to-saffron-700 shadow-lg shadow-saffron-200 transition-all"
                        >
                          Install App
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
