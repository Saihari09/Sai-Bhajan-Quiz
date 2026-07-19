import { seededRng, shuffleSeeded } from './seeded'

export const GRID_SIZE = 9

export interface PlacedWord {
  word: string
  row: number
  col: number
  dir: 'H' | 'V'
}

export interface WordSearchPuzzle {
  grid: string[][]
  words: PlacedWord[]
}

/**
 * Date-seeded 9×9 word search. Horizontal/vertical only (elderly scanning
 * comfort, PRD §6.4); blanks filled from the placed words' own letter
 * distribution so the grid reads devotional, not random.
 */
export function generateWordSearch(names: string[], seed: string): WordSearchPuzzle {
  const rng = seededRng(seed + ':ws')
  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array<string | null>(GRID_SIZE).fill(null),
  )
  const placed: PlacedWord[] = []

  const candidates = shuffleSeeded(
    names.filter((w) => w.length >= 3 && w.length <= GRID_SIZE),
    rng,
  ).sort((a, b) => b.length - a.length)

  for (const word of candidates) {
    if (placed.length >= 6) break
    let done = false
    for (let attempt = 0; attempt < 80 && !done; attempt++) {
      const dir = rng() < 0.5 ? 'H' : 'V'
      const maxRow = dir === 'H' ? GRID_SIZE : GRID_SIZE - word.length
      const maxCol = dir === 'H' ? GRID_SIZE - word.length : GRID_SIZE
      const row = Math.floor(rng() * maxRow)
      const col = Math.floor(rng() * maxCol)

      let fits = true
      for (let i = 0; i < word.length; i++) {
        const r = dir === 'V' ? row + i : row
        const c = dir === 'H' ? col + i : col
        const cell = grid[r][c]
        if (cell !== null && cell !== word[i]) {
          fits = false
          break
        }
      }
      if (!fits) continue

      for (let i = 0; i < word.length; i++) {
        const r = dir === 'V' ? row + i : row
        const c = dir === 'H' ? col + i : col
        grid[r][c] = word[i]
      }
      placed.push({ word, row, col, dir })
      done = true
    }
  }

  const letterPool = placed.flatMap((p) => p.word.split(''))
  const filled = grid.map((rowArr) =>
    rowArr.map((cell) => cell ?? letterPool[Math.floor(rng() * letterPool.length)]),
  )

  return { grid: filled, words: placed }
}

/** Cells covered by a placed word, as "r,c" keys. */
export function wordCells(p: PlacedWord): string[] {
  return Array.from({ length: p.word.length }, (_, i) =>
    p.dir === 'H' ? `${p.row},${p.col + i}` : `${p.row + i},${p.col}`,
  )
}

/**
 * The word (if any) between two tapped cells: must be a straight H/V line
 * exactly covering a placed word, in either direction.
 */
export function matchSelection(
  puzzle: WordSearchPuzzle,
  a: { row: number; col: number },
  b: { row: number; col: number },
): PlacedWord | null {
  for (const p of puzzle.words) {
    const cells = wordCells(p)
    const first = cells[0]
    const last = cells[cells.length - 1]
    const aKey = `${a.row},${a.col}`
    const bKey = `${b.row},${b.col}`
    if ((aKey === first && bKey === last) || (aKey === last && bKey === first)) {
      return p
    }
  }
  return null
}
