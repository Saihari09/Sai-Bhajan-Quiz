import { describe, it, expect } from 'vitest'
import bhajansJson from '../public/data/bhajans.json'
import deitiesJson from '../public/data/deities.json'
import type { Bhajan } from '../src/types/bhajan'
import { seededRng, hashString, shuffleSeeded, pickSeeded } from '../src/lib/seeded'
import { normalize, titleMatches } from '../src/lib/textNorm'
import {
  seedPrompt,
  nextSyllable,
  answersFor,
  endingSyllable,
  MIN_ANSWERS,
} from '../src/lib/antakshari'
import { buildAnswerBank, generateCrossword, entryCells } from '../src/lib/crossword'
import { generateOneSearch } from '../src/lib/onesearch'
import { generateLyricTrail } from '../src/lib/lyrictrail'

const bhajans = bhajansJson as unknown as Bhajan[]
const nameBanks = (deitiesJson as { nameBanks: Record<string, string[]> }).nameBanks
const FAMILY = { label: 'Test', tags: [], emoji: '🪔' }
const DATES = ['2026-07-20', '2026-08-01', '2026-09-15', '2026-12-25', '2027-01-01']

describe('seeded PRNG', () => {
  it('is deterministic for the same seed', () => {
    const a = seededRng('2026-07-20:x')
    const b = seededRng('2026-07-20:x')
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
  })

  it('differs across seeds and stays in [0,1)', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
    const rng = seededRng('spread')
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('shuffle keeps all items; pick stays in range', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffleSeeded(items, seededRng('s'))
    expect([...shuffled].sort()).toEqual(items)
    for (const d of DATES) expect(items).toContain(pickSeeded(items, d))
  })
})

describe('BhajanPicker normalization (PRD acceptance: diacritics)', () => {
  it('folds diacritics and case', () => {
    expect(normalize('Sāī Rām')).toBe('sai ram')
    expect(titleMatches('Jaya Ho Jaya Ho Anjaneya', 'anj')).toBe(true)
    expect(titleMatches('Jaya Ho Jaya Ho Anjaneya', 'ANJANEYA')).toBe(true)
    expect(titleMatches('Sundara Sundara Vinayaka', 'vīnā')).toBe(true)
  })

  it('matches any word start, not substrings', () => {
    expect(titleMatches('Bala Gopala Sai', 'gopa')).toBe(true)
    expect(titleMatches('Bala Gopala Sai', 'opala')).toBe(false)
  })
})

describe('Antakshari chain guarantees (PRD acceptance: ≥3 valid answers per link)', () => {
  it('every (date × day-bhajan) seed has enough answers', () => {
    for (const date of DATES) {
      for (const b of bhajans) {
        const seed = seedPrompt(date, b, bhajans)
        const answers = answersFor(seed.syllable, bhajans, new Set([b.id]))
        expect(answers.length, `${date} ${b.id} → "${seed.syllable}"`).toBeGreaterThanOrEqual(MIN_ANSWERS)
      }
    }
  })

  it('never dead-ends across full chains regardless of player choice', () => {
    for (const date of DATES.slice(0, 2)) {
      for (const dayBhajan of bhajans.slice(0, 25)) {
        const seed = seedPrompt(date, dayBhajan, bhajans)
        // Player picks each of the first 3 valid answers at link 1.
        for (const first of answersFor(seed.syllable, bhajans, new Set([dayBhajan.id])).slice(0, 3)) {
          const used = new Set([dayBhajan.id, first.id])
          const syl2 = nextSyllable(date, 1, first, bhajans, used)
          const answers2 = answersFor(syl2, bhajans, used)
          expect(answers2.length, `link2 "${syl2}"`).toBeGreaterThanOrEqual(MIN_ANSWERS)
          const second = answers2[0]
          used.add(second.id)
          const syl3 = nextSyllable(date, 2, second, bhajans, used)
          expect(answersFor(syl3, bhajans, used).length, `link3 "${syl3}"`).toBeGreaterThanOrEqual(MIN_ANSWERS)
        }
      }
    }
  })

  it('extracts ending syllables sensibly', () => {
    expect(endingSyllable('Govinda')).toBe('Da')
    expect(endingSyllable('Jaya Ho Jaya Ho Anjaneya')).toBe('Ya')
    expect(endingSyllable('Rama!')).toBe('Ma')
  })
})

describe('Crossword generator (PRD acceptance: interlocking, crossing letters shared)', () => {
  it('always yields ≥5 interlocked words with a consistent solution, phone-sized', () => {
    for (const date of DATES) {
      for (const b of bhajans) {
        const puzzle = generateCrossword(buildAnswerBank(b, FAMILY, date), date)
        expect(puzzle.entries.length, `${b.id} ${date}`).toBeGreaterThanOrEqual(5)
        expect(puzzle.width).toBeLessThanOrEqual(12)
        expect(puzzle.height).toBeLessThanOrEqual(12)
        for (const e of puzzle.entries) {
          const cells = entryCells(e)
          // Solution letters match the answer.
          cells.forEach((c, i) => expect(puzzle.solution[c.row][c.col]).toBe(e.answer[i]))
          // Every word crosses at least one other (fully interlocked).
          const mine = new Set(cells.map((c) => `${c.row},${c.col}`))
          const crosses = puzzle.entries.some(
            (o) => o !== e && entryCells(o).some((c) => mine.has(`${c.row},${c.col}`)),
          )
          expect(crosses, `${e.answer} isolated in ${b.id} ${date}`).toBe(true)
        }
      }
    }
  })

  it('daily answers come from the bhajan itself', () => {
    const bank = buildAnswerBank(bhajans[0], FAMILY, '2026-07-20')
    const answers = bank.map((e) => e.answer)
    expect(answers).toContain('GANESHA') // deity of bhajan-001
    expect(answers.every((a) => /^[A-Z]{3,9}$/.test(a))).toBe(true)
  })
})

describe('One-Word-Search (exactly one hidden placement)', () => {
  const DIRS = [
    [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1],
  ]
  function occurrences(grid: string[][], word: string): number {
    let n = 0
    const size = grid.length
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        for (const [dr, dc] of DIRS) {
          const er = r + dr * (word.length - 1)
          const ec = c + dc * (word.length - 1)
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue
          let ok = true
          for (let i = 0; i < word.length; i++)
            if (grid[r + dr * i][c + dc * i] !== word[i]) { ok = false; break }
          if (ok) n++
        }
    return n
  }

  it('every name bank generates rounds with exactly one occurrence', () => {
    for (const date of DATES) {
      for (const [tag, names] of Object.entries(nameBanks)) {
        for (const round of generateOneSearch(names, date + tag)) {
          expect(occurrences(round.grid, round.name), `${tag} ${round.name} ${date}`).toBe(1)
          expect(round.grid[round.start.row][round.start.col]).toBe(round.name[0])
          expect(round.grid[round.end.row][round.end.col]).toBe(round.name[round.name.length - 1])
        }
      }
    }
  })
})

describe('Lyric Trail (kept as hidden route)', () => {
  it('produces a connected path spelling the lyric for every bhajan', () => {
    for (const b of bhajans) {
      const p = generateLyricTrail(b, '2026-07-20')
      expect(p.path.length).toBe(p.letters.length)
      for (let i = 1; i < p.path.length; i++) {
        const d =
          Math.abs(p.path[i].row - p.path[i - 1].row) + Math.abs(p.path[i].col - p.path[i - 1].col)
        expect(d).toBe(1)
      }
      p.path.forEach((c, i) => expect(p.grid[c.row][c.col]).toBe(p.letters[i]))
    }
  })
})
