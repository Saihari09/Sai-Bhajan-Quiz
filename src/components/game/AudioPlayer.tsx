import { useRef, useEffect } from 'react'
import { useAudio } from '../../hooks/useAudio'

interface AudioPlayerProps {
  src: string
  autoPlay?: boolean
}

export function AudioPlayer({ src, autoPlay }: AudioPlayerProps) {
  const { isPlaying, isLoaded, toggle, play } = useAudio(src)
  const hasAutoPlayed = useRef(false)

  useEffect(() => {
    if (autoPlay && isLoaded && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true
      const id = setTimeout(() => play(), 100)
      return () => clearTimeout(id)
    }
  }, [autoPlay, isLoaded, play])

  return (
    <button
      onClick={toggle}
      disabled={!isLoaded}
      className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-md border border-navy-100 active:scale-95 transition-transform disabled:opacity-50"
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${isPlaying ? 'bg-navy-600' : 'bg-gradient-to-br from-saffron-500 to-saffron-600'}`}>
        {isPlaying ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-navy-700">
          {isPlaying ? 'Playing...' : 'Play Audio'}
        </p>
        <p className="text-xs text-gray-400">
          {!isLoaded ? 'Loading...' : 'Tap to listen'}
        </p>
      </div>
      {isPlaying && (
        <div className="flex gap-0.5 items-end h-5 ml-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-saffron-500 rounded-full animate-pulse"
              style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
