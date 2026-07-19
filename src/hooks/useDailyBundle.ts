import { useEffect, useState } from 'react'
import { getDailyBundle, type DailyBundle } from '../lib/daily'
import { loadBhajans } from '../lib/schedule'
import type { Bhajan } from '../types/bhajan'
import { getTodayString } from '../lib/dateUtils'

export function useDailyBundle() {
  const [bundle, setBundle] = useState<DailyBundle | null>(null)
  const [bhajans, setBhajans] = useState<Bhajan[]>([])
  const today = getTodayString()

  useEffect(() => {
    let cancelled = false
    Promise.all([getDailyBundle(today), loadBhajans()]).then(([b, all]) => {
      if (!cancelled) {
        setBundle(b)
        setBhajans(all)
      }
    })
    return () => {
      cancelled = true
    }
  }, [today])

  return { bundle, bhajans, today }
}
