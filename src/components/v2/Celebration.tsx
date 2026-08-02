import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Rangoli } from './Rangoli'
import { seededRng } from '../../lib/seeded'

interface Props {
  petals: number
  seed: string
  onDone: () => void
}

/** The arati moment: petals rain, the finished rangoli glows in. */
export function Celebration({ petals, seed, onDone }: Props) {
  const flowers = useMemo(() => {
    const rng = seededRng(seed + ':petalrain')
    return Array.from({ length: 18 }, (_, i) => ({
      left: rng() * 100,
      delay: rng() * 0.9,
      duration: 2.2 + rng() * 1.6,
      emoji: ['🌸', '🌼', '🪷'][i % 3],
    }))
  }, [seed])

  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-ink/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onDone}
      role="dialog"
      aria-label="Rangoli complete celebration"
    >
      {flowers.map((f, i) => (
        <motion.span
          key={i}
          className="absolute top-0 text-3xl"
          style={{ left: `${f.left}%` }}
          initial={{ y: -60, opacity: 0, rotate: 0 }}
          animate={{ y: '108vh', opacity: [0, 1, 1, 0.7], rotate: 220 }}
          transition={{ duration: f.duration, delay: f.delay, ease: 'linear' }}
          aria-hidden
        >
          {f.emoji}
        </motion.span>
      ))}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 13, stiffness: 160 }}
        className="mx-6 rounded-3xl border-2 border-gold bg-paper px-8 py-6 text-center shadow-2xl"
      >
        <Rangoli petals={petals} filled={petals} seed={seed} size={150} />
        <p className="mt-2 font-display text-2xl leading-tight text-maroon">
          Today's rangoli is complete!
        </p>
        <p className="mt-1 text-lg text-ink-soft">Om Shanti Shanti Shanti 🪔</p>
      </motion.div>
    </motion.div>
  )
}
