import { motion } from 'framer-motion'
import { requestNotificationPermission } from '../lib/notifications'
import { trackEvent } from '../lib/analytics'
import { useInstallStore } from '../store/installStore'

interface Props {
  onClose: () => void
}

export function NotificationPrompt({ onClose }: Props) {
  const dismissNotifPrompt = useInstallStore((s) => s.dismissNotifPrompt)

  const handleEnable = () => {
    requestNotificationPermission()
    trackEvent('notification_enable')
    onClose()
  }

  const handleDismiss = () => {
    dismissNotifPrompt()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/50 backdrop-blur-sm"
      onClick={handleDismiss}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-4xl mb-3">🔔</p>
        <h2 className="text-lg font-black text-navy-700 mb-2">Daily Reminders</h2>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Get a notification each day when a new bhajan quiz is ready. Never miss a day!
        </p>
        <div className="space-y-2">
          <button
            onClick={handleEnable}
            className="w-full py-3.5 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold rounded-2xl shadow-lg active:from-saffron-600 active:to-saffron-700 transition-all"
          >
            Enable Notifications
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-3 text-sm font-bold text-gray-400 active:text-gray-500"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
