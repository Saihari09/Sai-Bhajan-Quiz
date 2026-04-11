import { useRef, useState, useCallback, useEffect } from 'react'
import { Howl } from 'howler'

interface UseAudioReturn {
  isPlaying: boolean
  isLoaded: boolean
  play: () => void
  pause: () => void
  stop: () => void
  toggle: () => void
}

export function useAudio(src: string, loop = false): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const howlRef = useRef<Howl | null>(null)

  useEffect(() => {
    const howl = new Howl({
      src: [src],
      html5: true,
      preload: true,
      loop,
      onload: () => setIsLoaded(true),
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => setIsPlaying(false),
    })
    howlRef.current = howl

    return () => {
      howl.unload()
    }
  }, [src])

  const play = useCallback(() => howlRef.current?.play(), [])
  const pause = useCallback(() => howlRef.current?.pause(), [])
  const stop = useCallback(() => howlRef.current?.stop(), [])
  const toggle = useCallback(() => {
    if (howlRef.current?.playing()) {
      howlRef.current.pause()
    } else {
      howlRef.current?.play()
    }
  }, [])

  return { isPlaying, isLoaded, play, pause, stop, toggle }
}
