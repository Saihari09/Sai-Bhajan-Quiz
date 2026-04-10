import { useState } from 'react'
import { DEITY_OPTIONS } from '../../types/bhajan'
import type { DeityTag } from '../../types/bhajan'
import { DeityCard } from './DeityCard'

interface DeityGridProps {
  correctDeity: DeityTag
  onAnswer: (isCorrect: boolean) => void
}

export function DeityGrid({ correctDeity, onAnswer }: DeityGridProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (tag: string) => {
    if (selected) return
    setSelected(tag)
    const isCorrect = tag === correctDeity
    setTimeout(() => onAnswer(isCorrect), 600)
  }

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {DEITY_OPTIONS.map((deity) => {
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
