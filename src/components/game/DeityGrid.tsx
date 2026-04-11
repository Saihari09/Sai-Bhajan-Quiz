import { useState, useMemo } from 'react'
import { DEITY_OPTIONS } from '../../types/bhajan'
import type { DeityTag, DeityOption } from '../../types/bhajan'
import { DeityCard } from './DeityCard'

interface DeityGridProps {
  correctDeity: DeityTag
  onAnswer: (isCorrect: boolean, selectedDeity: string) => void
}

function pickRandomOptions(correctDeity: DeityTag, count: number): DeityOption[] {
  const correct = DEITY_OPTIONS.find(d => d.tag === correctDeity)
  if (!correct) return DEITY_OPTIONS.slice(0, count)

  // Pick (count - 1) random wrong options
  const wrong = DEITY_OPTIONS.filter(d => d.tag !== correctDeity)
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]]
  }
  const selected = [correct, ...wrong.slice(0, count - 1)]

  // Shuffle final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]]
  }
  return selected
}

export function DeityGrid({ correctDeity, onAnswer }: DeityGridProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const options = useMemo(() => pickRandomOptions(correctDeity, 6), [correctDeity])

  const handleSelect = (tag: string) => {
    if (selected) return
    setSelected(tag)
    const isCorrect = tag === correctDeity
    setTimeout(() => onAnswer(isCorrect, tag), 600)
  }

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {options.map((deity) => {
        let state: 'idle' | 'correct' | 'wrong' = 'idle'
        if (selected) {
          if (deity.tag === correctDeity) state = 'correct'
          else if (deity.tag === selected) state = 'wrong'
        }
        return (
          <DeityCard
            key={deity.tag}
            deity={deity}
            onSelect={handleSelect}
            disabled={selected !== null}
            state={state}
          />
        )
      })}
    </div>
  )
}
