import type { RoundNumber } from '../../types/game'

interface RoundIndicatorProps {
  currentRound: RoundNumber
}

const ROUND_LABELS = ['Guess the Deity', 'First Line', 'Word Scramble']

export function RoundIndicator({ currentRound }: RoundIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {[1, 2, 3].map((r) => (
        <div key={r} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              r === currentRound
                ? 'bg-saffron-500 text-white'
                : r < currentRound
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {r < currentRound ? '✓' : r}
          </div>
          {r < 3 && (
            <div className={`w-8 h-0.5 ${r < currentRound ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="ml-3 text-sm text-gray-500">
        {ROUND_LABELS[currentRound - 1]}
      </span>
    </div>
  )
}
