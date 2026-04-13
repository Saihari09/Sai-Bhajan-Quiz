import { useCallback, useEffect, useRef } from 'react'
import type { Bhajan } from '../types/bhajan'
import { Timer } from '../components/game/Timer'
import { AudioPlayer } from '../components/game/AudioPlayer'
import { WordBank } from '../components/game/WordBank'
import { RoundIndicator } from '../components/game/RoundIndicator'
import { useTimer } from '../hooks/useTimer'
import { getTimeLimitMs } from '../lib/scoring'

interface Round3Props {
  bhajan: Bhajan
  onComplete: (isCorrect: boolean, timeSpentMs: number, userAnswer: string, correctAnswer: string, accuracy?: number) => void
}

export function Round3Page({ bhajan, onComplete }: Round3Props) {
  const scoringWindow = getTimeLimitMs(3)
  const line = bhajan.lyrics.lines[bhajan.round3LineIndex]
  const answeredRef = useRef(false)
  const timer = useTimer()

  useEffect(() => {
    const id = setTimeout(() => timer.start(), 300)
    return () => clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback((isCorrect: boolean, userWords: string[], accuracy: number) => {
    if (answeredRef.current) return
    answeredRef.current = true
    timer.pause()
    onComplete(isCorrect, timer.elapsedMs, userWords.join(' '), line.words.join(' '), accuracy)
  }, [timer, onComplete, line.words])

  return (
    <div className="flex flex-col gap-5">
      <RoundIndicator currentRound={3} />
      <Timer elapsedMs={timer.elapsedMs} scoringWindowMs={scoringWindow} />

      <div className="flex justify-center">
        <AudioPlayer src={import.meta.env.BASE_URL + bhajan.audio.clipUrl} />
      </div>

      <p className="text-center text-gray-600 font-medium px-4">
        Unscramble this line from the bhajan
      </p>

      <WordBank correctWords={line.words} onAnswer={handleAnswer} />
    </div>
  )
}
