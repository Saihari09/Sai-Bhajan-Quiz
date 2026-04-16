import { useEffect, useRef } from 'react'
import type { Bhajan } from '../types/bhajan'
import { DEITY_OPTIONS } from '../types/bhajan'
import { Timer } from '../components/game/Timer'
import { AudioPlayer } from '../components/game/AudioPlayer'
import { DeityGrid } from '../components/game/DeityGrid'
import { RoundIndicator } from '../components/game/RoundIndicator'
import { useTimer } from '../hooks/useTimer'
import { getTimeLimitMs } from '../lib/scoring'

interface Round1Props {
  bhajan: Bhajan
  onComplete: (isCorrect: boolean, timeSpentMs: number, userAnswer: string, correctAnswer: string) => void
}

export function Round1Page({ bhajan, onComplete }: Round1Props) {
  const scoringWindow = getTimeLimitMs(1)
  const answeredRef = useRef(false)
  const timer = useTimer()

  useEffect(() => {
    const id = setTimeout(() => timer.start(), 300)
    return () => clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getDeityName = (tag: string) => DEITY_OPTIONS.find(d => d.tag === tag)?.displayName ?? tag

  const handleAnswer = (isCorrect: boolean, selectedDeity: string) => {
    if (answeredRef.current) return
    answeredRef.current = true
    timer.pause()
    onComplete(isCorrect, timer.elapsedMs, getDeityName(selectedDeity), getDeityName(bhajan.deity))
  }

  return (
    <div className="flex flex-col gap-5">
      <RoundIndicator currentRound={1} />
      <Timer elapsedMs={timer.elapsedMs} scoringWindowMs={scoringWindow} />

      <div className="flex justify-center">
        <AudioPlayer
          src={import.meta.env.BASE_URL + bhajan.audio.clipUrl}
          autoPlay
          loop
        />
      </div>

      <p className="text-center text-gray-600 font-medium px-4">
        Which deity is this bhajan about?
      </p>

      <DeityGrid
        correctDeity={bhajan.deity}
        acceptedDeities={bhajan.acceptedDeities}
        onAnswer={handleAnswer}
      />
    </div>
  )
}
