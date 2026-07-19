import { seededRng, shuffleSeeded } from './seeded'

export interface OneSearchRound {
  name: string
  size: number
  grid: string[][]
  /** The single true placement. */
  start: { row: number; col: number }
  end: { row: number; col: number }
}

/** All 8 directions — the One-Word-Search signature (reverse included). */
const DIRS = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: -1, dc: -1 },
]

/** Count occurrences of `word` in the grid across all 8 directions. */
function countOccurrences(grid: string[][], word: string): number {
  const size = grid.length
  let count = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const { dr, dc } of DIRS) {
        const endR = r + dr * (word.length - 1)
        const endC = c + dc * (word.length - 1)
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue
        let match = true
        for (let i = 0; i < word.length; i++) {
          if (grid[r + dr * i][c + dc * i] !== word[i]) {
            match = false
            break
          }
        }
        if (match) count++
      }
    }
  }
  return count
}

/**
 * One round: a small grid whose decoys are drawn from the name's own
 * letters (near-misses everywhere), with EXACTLY one true placement.
 */
function generateRound(name: string, seed: string): OneSearchRound {
  const size = Math.max(5, Math.min(name.length, 9))

  for (let attempt = 0; ; attempt++) {
    const rng = seededRng(`${seed}:${name}:${attempt}`)
    const dir = DIRS[Math.floor(rng() * DIRS.length)]

    // Random placement that fits.
    const rowRange = { min: 0, max: size - 1 }
    const span = (name.length - 1)
    const rMin = dir.dr === -1 ? span : 0
    const rMax = dir.dr === 1 ? size - 1 - span : rowRange.max
    const cMin = dir.dc === -1 ? span : 0
    const cMax = dir.dc === 1 ? size - 1 - span : size - 1
    if (rMax < rMin || cMax < cMin) continue
    const row = rMin + Math.floor(rng() * (rMax - rMin + 1))
    const col = cMin + Math.floor(rng() * (cMax - cMin + 1))

    const grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => name[Math.floor(rng() * name.length)]),
    )
    for (let i = 0; i < name.length; i++) {
      grid[row + dir.dr * i][col + dir.dc * i] = name[i]
    }

    if (countOccurrences(grid, name) === 1) {
      return {
        name,
        size,
        grid,
        start: { row, col },
        end: { row: row + dir.dr * span, col: col + dir.dc * span },
      }
    }
    // Accidental duplicate — try a fresh layout (rare; loop is bounded in practice).
    if (attempt > 200) {
      // Pathological safety net: blank-fill decoys can't duplicate the word.
      const safeGrid = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => 'AEIOU'[Math.floor(rng() * 5)]),
      )
      for (let i = 0; i < name.length; i++) {
        safeGrid[row + dir.dr * i][col + dir.dc * i] = name[i]
      }
      if (countOccurrences(safeGrid, name) === 1) {
        return {
          name,
          size,
          grid: safeGrid,
          start: { row, col },
          end: { row: row + dir.dr * span, col: col + dir.dc * span },
        }
      }
    }
  }
}

/** The day's puzzle: one round per name of the day's deity. */
export function generateOneSearch(names: string[], seed: string): OneSearchRound[] {
  const order = shuffleSeeded(names, seededRng(seed + ':order'))
  return order.map((n) => generateRound(n.toUpperCase(), seed))
}

/** Whether a tapped (start, end) pair selects the round's true placement. */
export function isCorrectSelection(
  round: OneSearchRound,
  a: { row: number; col: number },
  b: { row: number; col: number },
): boolean {
  const fwd =
    a.row === round.start.row && a.col === round.start.col &&
    b.row === round.end.row && b.col === round.end.col
  const rev =
    b.row === round.start.row && b.col === round.start.col &&
    a.row === round.end.row && a.col === round.end.col
  return fwd || rev
}
