import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '../lib/analytics'

const UPI_VPA = '8939313056-2@ybl'
const UPI_NAME = 'Sai Bhajan Quiz'
const BMC_URL = 'https://buymeacoffee.com/sai09'

/**
 * Build a payment URI. The generic `upi://` scheme triggers Android's app
 * chooser which, on some phones, routes to WhatsApp (WhatsApp Pay). Using
 * each app's own custom scheme bypasses that chooser and launches the
 * chosen app directly. Scheme reference:
 *   - Google Pay  → tez://upi/pay
 *   - PhonePe     → phonepe://pay
 *   - Paytm       → paytmmp://pay
 *   - Any UPI app → upi://pay   (used for the QR code)
 */
function buildPaymentUri(scheme: 'upi' | 'tez' | 'phonepe' | 'paytmmp') {
  const base =
    scheme === 'upi' ? 'upi://pay' :
    scheme === 'tez' ? 'tez://upi/pay' :
    scheme === 'phonepe' ? 'phonepe://pay' :
    'paytmmp://pay'
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: UPI_NAME,
    cu: 'INR',
  })
  return `${base}?${params.toString()}`
}

const UPI_APPS = [
  { key: 'tez', label: 'Google Pay', emoji: '🟢' },
  { key: 'phonepe', label: 'PhonePe', emoji: '🟣' },
  { key: 'paytmmp', label: 'Paytm', emoji: '🔵' },
] as const

interface SupportModalProps {
  open: boolean
  onClose: () => void
}

export function SupportModal({ open, onClose }: SupportModalProps) {
  const [view, setView] = useState<'choose' | 'upi'>('choose')
  const [copied, setCopied] = useState(false)

  // Reset to the chooser whenever the modal is opened fresh.
  useEffect(() => {
    if (open) {
      setView('choose')
      setCopied(false)
    }
  }, [open])

  const handleBmcClick = () => {
    trackEvent('donate_bmc_click')
    window.open(BMC_URL, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleUpiChoose = () => {
    trackEvent('donate_upi_click')
    setView('upi')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_VPA)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard may be blocked; selection fallback
      const input = document.createElement('input')
      input.value = UPI_VPA
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const handleOpenApp = (scheme: 'tez' | 'phonepe' | 'paytmmp') => {
    trackEvent(`donate_upi_${scheme}_click`)
    // Custom schemes launch the specific app directly on mobile. On desktop
    // most browsers ignore the scheme — the QR is the fallback there.
    window.location.href = buildPaymentUri(scheme)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {view === 'choose' ? (
              <>
                <h2 className="text-xl font-black text-navy-700 text-center mb-1">
                  Support this app
                </h2>
                <p className="text-xs text-gray-500 text-center mb-5">
                  Pick whichever works for you 🙏
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleBmcClick}
                    className="relative w-full px-4 py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-2xl shadow-md active:from-saffron-600 active:to-saffron-700 transition-all text-left"
                  >
                    <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-white text-saffron-600 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☕</span>
                      <div>
                        <p className="font-bold text-base leading-tight">
                          Buy Me a Coffee
                        </p>
                        <p className="text-xs opacity-90">
                          Card / PayPal / Apple Pay
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleUpiChoose}
                    className="w-full px-4 py-4 bg-white border-2 border-navy-100 rounded-2xl shadow-sm active:bg-navy-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📱</span>
                      <div>
                        <p className="font-bold text-base leading-tight text-navy-700">
                          UPI
                        </p>
                        <p className="text-xs text-gray-500">
                          For users in India
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full mt-5 py-2.5 text-sm font-medium text-gray-500 active:text-gray-700"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setView('choose')}
                    aria-label="Back"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-navy-600 text-lg font-bold active:bg-gray-100"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-black text-navy-700">Pay via UPI</h2>
                </div>
                <p className="text-xs text-gray-500 mb-4 pl-10">
                  Scan the QR with any UPI app, or copy the ID below.
                </p>

                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=208x208&margin=0&color=1e3a8a&bgcolor=ffffff&data=${encodeURIComponent(buildPaymentUri('upi'))}`}
                      alt="UPI QR code"
                      width={208}
                      height={208}
                      className="block"
                    />
                  </div>
                </div>

                <div className="bg-navy-50 rounded-xl px-4 py-3 mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                      UPI ID
                    </p>
                    <p className="text-sm font-mono font-bold text-navy-700 truncate">
                      {UPI_VPA}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 px-3 py-1.5 bg-navy-600 text-white text-xs font-bold rounded-lg active:bg-navy-700 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold text-center mb-2">
                  Or open in app
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.key}
                      onClick={() => handleOpenApp(app.key)}
                      className="flex flex-col items-center gap-1 py-2.5 px-1 bg-white border border-gray-200 rounded-xl active:bg-gray-50 transition-colors"
                    >
                      <span className="text-xl leading-none">{app.emoji}</span>
                      <span className="text-[11px] font-bold text-navy-700 leading-tight">
                        {app.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Works on mobile. On desktop, scan the QR.
                </p>

                <button
                  onClick={onClose}
                  className="w-full mt-3 py-2.5 text-sm font-medium text-gray-500 active:text-gray-700"
                >
                  Close
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
