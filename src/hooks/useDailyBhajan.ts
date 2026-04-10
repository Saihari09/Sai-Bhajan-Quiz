import { useState, useEffect } from 'react'
import type { Bhajan } from '../types/bhajan'
import { getTodayBhajan } from '../lib/schedule'

export function useDailyBhajan() {
  const [bhajan, setBhajan] = useState<Bhajan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTodayBhajan()
      .then(setBhajan)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { bhajan, loading, error }
}
