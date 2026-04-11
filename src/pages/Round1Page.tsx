import { useCallback, useEffect, useRef } from 'react'
import type { Bhajan } from '../types/bhajan'
import { Timer } from '../components/game/Timer'
import { AudioPlayer } from '../components/game/AudioPlayer'
import { DeityGrid } from '../components/game/DeityGrid'
import { RoundIndicator } from '../components/game/RoundIndicator'
import { useTimer } from '../hooks/useTimer'
import { getTimeLimitMs } from '../lib/scoring'

interface Round1Props {
  bhajan: Bhajan
  onComplete: (isCorrect: boolean, timeSpentMs: number) => void
}

export function Round1Page({ bhajan, onComplete }: Round1Props) {
  const timeLimit = getTimeLimitMs(1)
  const answeredRef = useRef(false)

  const handleExpire = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    onComplete(false, timeLimit)
  }, [onComplete, timeLimit])

  const timer = useTimer(timeLimit, handleExpire)

  useEffect(() => {
    const id = setTimeout(() => timer.start(), 300)
    return () => clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (isCorrect: boolean) => {
    if (answeredRef.current) return
    answeredRef.current = true
    timer.pause()
    onComplete(isCorrect, timer.elapsedMs)
  }

  return (
    <div className="flex flex-col gap-5">
      <RoundIndicator currentRound={1} />
      <Timer progress={timer.progress} timeRemainingMs={timer.timeRemainingMs} elapsedMs={timer.elapsedMs} durationMs={timeLimit} />

      <div className="flex justify-center">
        <AudioPlayer
          src={import.meta.env.BASE_URL + bhajan.audio.clipUrl}
          autoPlay
        />
      </div>

      <p className="text-center text-gray-600 font-medium px-4">
        Which deity is this bhajan about?
      </p>

      <DeityGrid correctDeity={bhajan.deity} onAnswer={handleAnswer} />
    </div>
  )
}
