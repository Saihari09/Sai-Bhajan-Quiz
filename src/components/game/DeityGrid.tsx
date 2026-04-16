import { useState, useMemo } from 'react'
import { DEITY_OPTIONS } from '../../types/bhajan'
import type { DeityTag, DeityOption } from '../../types/bhajan'
import { DeityCard } from './DeityCard'

interface DeityGridProps {
  correctDeity: DeityTag
  /**
   * Extra deities that count as correct but should NOT be shown as wrong
   * options. Used for multi-faith bhajans where more than one tag fits.
   */
  acceptedDeities?: DeityTag[]
  onAnswer: (isCorrect: boolean, selectedDeity: string) => void
}

function pickRandomOptions(
  correctDeity: DeityTag,
  excludeFromWrong: DeityTag[],
  count: number,
): DeityOption[] {
  const correct = DEITY_OPTIONS.find(d => d.tag === correctDeity)
  if (!correct) return DEITY_OPTIONS.slice(0, count)

  // Wrong pool excludes the correct one AND any extra accepted deities,
  // so a co-correct option (e.g. allah for a sarva-dharma bhajan) never
  // appears as a decoy.
  const exclude = new Set<DeityTag>([correctDeity, ...excludeFromWrong])
  const wrong = DEITY_OPTIONS.filter(d => !exclude.has(d.tag))
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

export function DeityGrid({ correctDeity, acceptedDeities, onAnswer }: DeityGridProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const extras = acceptedDeities ?? []
  const options = useMemo(
    () => pickRandomOptions(correctDeity, extras, 6),
    // extras is recreated each render; key on its joined value to keep
    // the grid stable across re-renders for the same bhajan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [correctDeity, extras.join('|')],
  )

  const acceptedSet = useMemo(
    () => new Set<string>([correctDeity, ...extras]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [correctDeity, extras.join('|')],
  )

  const handleSelect = (tag: string) => {
    if (selected) return
    setSelected(tag)
    const isCorrect = acceptedSet.has(tag)
    setTimeout(() => onAnswer(isCorrect, tag), 600)
  }

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {options.map((deity) => {
        let state: 'idle' | 'correct' | 'wrong' = 'idle'
        if (selected) {
          if (acceptedSet.has(deity.tag)) state = 'correct'
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
