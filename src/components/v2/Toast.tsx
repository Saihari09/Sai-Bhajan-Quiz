import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/toastStore'

export function Toast() {
  const message = useToastStore((s) => s.message)
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[92%] max-w-md"
          role="status"
        >
          <div className="rounded-2xl bg-ink px-5 py-3.5 text-center text-lg text-paper shadow-lg">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
