interface Props {
  onLetter: (ch: string) => void
  onBackspace: () => void
  onHint: () => void
  hintLabel: string
}

const ROWS = ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ']

/**
 * On-screen keypad for the crossword — the OS keyboard never appears
 * (PRD §5.2: unreliable, small, covers the grid).
 */
export function LetterPad({ onLetter, onBackspace, onHint, hintLabel }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {ROWS.map((row, i) => (
        <div key={row} className="flex justify-center gap-1.5">
          {row.split('').map((ch) => (
            <button
              key={ch}
              onClick={() => onLetter(ch)}
              className="min-h-11 flex-1 max-w-12 rounded-lg border border-line bg-paper text-lg font-bold text-ink active:bg-turmeric active:text-paper"
              aria-label={`Letter ${ch}`}
            >
              {ch}
            </button>
          ))}
          {i === 2 && (
            <button
              onClick={onBackspace}
              className="min-h-11 flex-1 max-w-16 rounded-lg border border-line bg-ivory text-lg font-bold text-ink active:bg-line"
              aria-label="Backspace"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onHint}
        className="mx-auto mt-1 min-h-11 rounded-full border-2 border-line bg-paper px-5 py-2 text-lg text-ink"
      >
        {hintLabel}
      </button>
    </div>
  )
}
