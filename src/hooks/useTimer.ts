import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTimerReturn {
  elapsedMs: number
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: () => void
}

export function useTimer(): UseTimerReturn {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef(0)
  const elapsedBeforePauseRef = useRef(0)
  const rafRef = useRef<number>(0)

  const tick = useCallback(() => {
    const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current)
    setElapsedMs(elapsed)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    startTimeRef.current = Date.now()
    setIsRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const pause = useCallback(() => {
    setIsRunning(false)
    cancelAnimationFrame(rafRef.current)
    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    cancelAnimationFrame(rafRef.current)
    setElapsedMs(0)
    elapsedBeforePauseRef.current = 0
    startTimeRef.current = 0
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return { elapsedMs, isRunning, start, pause, reset }
}
