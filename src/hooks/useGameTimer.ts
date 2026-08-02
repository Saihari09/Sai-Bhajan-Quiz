import { useRef, useCallback, useEffect } from 'react'

/**
 * Gentle timer: starts when the game mounts, read once at completion.
 * Never displayed while playing — no pressure, just a note at the end.
 */
export function useGameTimer() {
  const startRef = useRef(0)
  useEffect(() => {
    if (startRef.current === 0) startRef.current = Date.now()
  }, [])
  return useCallback(
    () => (startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0),
    [],
  )
}
