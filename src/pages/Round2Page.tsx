import { useCallback, useEffect, useRef } from 'react'
import type { Bhajan } from '../types/bhajan'
import { Timer } from '../components/game/Timer'
import { AudioPlayer } from '../components/game/AudioPlayer'
import { WordBank } from '../components/game/WordBank'
import { RoundIndicator } from '../components/game/RoundIndicator'
import { useTimer } from '../hooks/useTimer'
import { getTimeLimitMs } from '../lib/scoring'

interface Round2Props {
  bhajan: Bhajan
  onComplete: (isCorrect: boolean, timeSpentMs: number) => void
}

export function Round2Page({ bhajan, onComplete }: Round2Props) {
  const timeLimit = getTimeLimitMs(2)
  const line = bhajan.lyrics.lines[bhajan.round2LineIndex]
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

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (answeredRef.current) return
    answeredRef.current = true
    timer.pause()
    onComplete(isCorrect, timer.elapsedMs)
  }, [timer, onComplete])

  return (
    <div className="flex flex-col gap-5">
      <RoundIndicator currentRound={2} />
      <Timer progress={timer.progress} timeRemainingMs={timer.timeRemainingMs} elapsedMs={timer.elapsedMs} durationMs={timeLimit} />

      <div className="flex justify-center">
        <AudioPlayer src={import.meta.env.BASE_URL + bhajan.audio.clipUrl} />
      </div>

      <p className="text-center text-gray-600 font-medium px-4">
        Arrange the first line in the correct order
      </p>

      <WordBank correctWords={line.words} onAnswer={handleAnswer} />
    </div>
  )
}
