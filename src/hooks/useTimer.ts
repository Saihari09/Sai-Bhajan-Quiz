import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTimerReturn {
  timeRemainingMs: number
  elapsedMs: number
  isRunning: boolean
  progress: number
  start: () => void
  pause: () => void
  reset: () => void
}

export function useTimer(durationMs: number, onExpire: () => void): UseTimerReturn {
  const [timeRemainingMs, setTimeRemainingMs] = useState(durationMs)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef(0)
  const elapsedBeforePauseRef = useRef(0)
  const rafRef = useRef<number>(0)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const tick = useCallback(() => {
    const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current)
    const remaining = Math.max(0, durationMs - elapsed)
    setTimeRemainingMs(remaining)

    if (remaining <= 0) {
      setIsRunning(false)
      onExpireRef.current()
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [durationMs])

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
    setTimeRemainingMs(durationMs)
    elapsedBeforePauseRef.current = 0
    startTimeRef.current = 0
  }, [durationMs])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const elapsedMs = durationMs - timeRemainingMs
  const progress = timeRemainingMs / durationMs

  return { timeRemainingMs, elapsedMs, isRunning, progress, start, pause, reset }
}
