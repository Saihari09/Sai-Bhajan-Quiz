import { useEffect, useRef, useState, useCallback } from 'react'
import { Howl } from 'howler'

export type ClipStage = 's2' | 's5' | 's10' | 's13' | 'full'

/**
 * Sprite player over a bhajan's single 20s instrumental clip.
 * Heardle stages are offsets into the same file — no pre-cut clips needed.
 */
export function useClip(clipUrl: string, offsetSec = 0) {
  const howlRef = useRef<Howl | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [playingStage, setPlayingStage] = useState<ClipStage | null>(null)

  useEffect(() => {
    const off = offsetSec * 1000
    const howl = new Howl({
      src: [clipUrl],
      preload: true,
      sprite: {
        s2: [off, 2000],
        s5: [off, 5000],
        s10: [off, 10000],
        s13: [off, 13000],
        full: [0, 30000],
      },
      onload: () => setIsLoaded(true),
      onend: () => setPlayingStage(null),
      onstop: () => setPlayingStage(null),
    })
    howlRef.current = howl
    return () => {
      howl.unload()
    }
  }, [clipUrl, offsetSec])

  const play = useCallback((stage: ClipStage) => {
    const howl = howlRef.current
    if (!howl) return
    howl.stop()
    howl.play(stage)
    setPlayingStage(stage)
  }, [])

  const stop = useCallback(() => {
    howlRef.current?.stop()
  }, [])

  return { isLoaded, playingStage, play, stop }
}
