import type { Bhajan } from '../types/bhajan'
import { seededRng, shuffleSeeded } from './seeded'

export interface TrailCell {
  row: number
  col: number
}

export interface TrailWord {
  text: string
  startIdx: number
  endIdx: number // exclusive
}

export interface TrailPuzzle {
  size: number
  grid: string[][]
  /** The lyric's cells in trace order — the "one word" snake. */
  path: TrailCell[]
  letters: string
  words: TrailWord[]
  /** The display lines, as sung. */
  lines: string[]
}

const MAX_LETTERS = 32

function lettersOf(line: string): string {
  return line.replace(/[^A-Za-z]/g, '').toUpperCase()
}

/**
 * Pick one or two CONTINUOUS lines from the day's bhajan — always starting
 * at the first line (the refrain devotees know best). Two lines only when
 * both fit the grid budget.
 */
export function pickTrailLines(bhajan: Bhajan): string[] {
  const lines = bhajan.lyrics.transliteration
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []
  const first = lines[0]
  if (lines.length > 1) {
    const combined = lettersOf(first).length + lettersOf(lines[1]).length
    if (lettersOf(first).length < 16 && combined <= MAX_LETTERS) {
      return [first, lines[1]]
    }
  }
  if (lettersOf(first).length <= MAX_LETTERS) return [first]
  // Very long first line: fall back to its first few words within budget.
  const words = first.split(/\s+/)
  const kept: string[] = []
  let total = 0
  for (const w of words) {
    const n = lettersOf(w).length
    if (total + n > MAX_LETTERS) break
    kept.push(w)
    total += n
  }
  return [kept.join(' ')]
}

const DIRS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
]

/** Self-avoiding orthogonal path of `length` cells via seeded DFS. */
function findPath(size: number, length: number, rng: () => number): TrailCell[] | null {
  const visited = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  const path: TrailCell[] = []

  const dfs = (row: number, col: number): boolean => {
    visited[row][col] = true
    path.push({ row, col })
    if (path.length === length) return true
    for (const { dr, dc } of shuffleSeeded(DIRS, rng)) {
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < size && c >= 0 && c < size && !visited[r][c]) {
        if (dfs(r, c)) return true
      }
    }
    visited[row][col] = false
    path.pop()
    return false
  }

  const start = {
    row: Math.floor(rng() * size),
    col: Math.floor(rng() * size),
  }
  return dfs(start.row, start.col) ? path : null
}

/**
 * One-word-search over a bhajan: the lyric snakes through the grid as a
 * single continuous path; the rest is decoy letters drawn from the lyric's
 * own distribution. Deterministic per (bhajan, seed).
 */
export function generateLyricTrail(bhajan: Bhajan, seed: string): TrailPuzzle {
  const lines = pickTrailLines(bhajan)
  const displayWords = lines.flatMap((l) => l.split(/\s+/)).filter(Boolean)

  const words: TrailWord[] = []
  let letters = ''
  for (const w of displayWords) {
    const clean = lettersOf(w)
    if (!clean) continue
    words.push({ text: w, startIdx: letters.length, endIdx: letters.length + clean.length })
    letters += clean
  }

  const size = letters.length <= 24 ? 6 : 7

  let path: TrailCell[] | null = null
  for (let attempt = 0; attempt < 20 && !path; attempt++) {
    path = findPath(size, letters.length, seededRng(`${seed}:trail${attempt}`))
  }
  if (!path) {
    // Degenerate fallback: boustrophedon fill — always fits.
    path = Array.from({ length: letters.length }, (_, i) => {
      const row = Math.floor(i / size)
      return { row, col: row % 2 === 0 ? i % size : size - 1 - (i % size) }
    })
  }

  const rng = seededRng(seed + ':fill')
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => letters[Math.floor(rng() * letters.length)]),
  )
  path.forEach((cell, i) => {
    grid[cell.row][cell.col] = letters[i]
  })

  return { size, grid, path, letters, words, lines }
}
