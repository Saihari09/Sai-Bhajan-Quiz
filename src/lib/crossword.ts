import type { Bhajan } from '../types/bhajan'
import type { WeekdayFamily } from './daily'
import { DEITY_OPTIONS } from '../types/bhajan'
import { seededRng, shuffleSeeded } from './seeded'

export interface XwEntry {
  answer: string
  clue: string
  /** Daily-fresh (from today's bhajan/quote/names) — placed with priority. */
  fresh?: boolean
}

export interface PlacedEntry extends XwEntry {
  row: number
  col: number
  dir: 'A' | 'D'
  number: number
}

export interface CrosswordPuzzle {
  width: number
  height: number
  entries: PlacedEntry[]
  /** solution[r][c] is the letter, or null for a block. */
  solution: (string | null)[][]
}

/** Unambiguously-spelled bhakti vocabulary (plan §A2.4 — no translit traps). */
const STATIC_BANK: XwEntry[] = [
  { answer: 'SEVA', clue: 'Selfless service' },
  { answer: 'DIYA', clue: 'The little lamp we light' },
  { answer: 'ARATI', clue: 'The waving of the flame in worship' },
  { answer: 'BHAJAN', clue: 'A devotional song — this app is full of them' },
  { answer: 'MANDIR', clue: 'House of God' },
  { answer: 'PREMA', clue: 'Divine love' },
  { answer: 'SHANTI', clue: 'Peace, chanted three times' },
  { answer: 'DHARMA', clue: 'Righteous duty' },
  { answer: 'KIRTAN', clue: 'Singing the Lord’s glory together' },
  { answer: 'MALA', clue: 'A garland of 108 beads' },
  { answer: 'GURU', clue: 'The one who leads from darkness to light' },
  { answer: 'PRASAD', clue: 'Blessed offering shared after worship' },
  { answer: 'VEDA', clue: 'Ancient book of sacred knowledge' },
  { answer: 'ATMA', clue: 'The soul within' },
  { answer: 'BHAKTI', clue: 'The path of devotion' },
  { answer: 'TABLA', clue: 'The drums beside the harmonium' },
  { answer: 'MOKSHA', clue: 'Liberation, the final freedom' },
  { answer: 'KARMA', clue: 'As you sow, so shall you reap' },
  { answer: 'JAPA', clue: 'Repeating the divine name' },
  { answer: 'NAMASTE', clue: 'Greeting with folded hands' },
  { answer: 'DARSHAN', clue: 'The blessing of seeing the divine' },
  { answer: 'MANTRA', clue: 'Sacred sounds repeated in prayer' },
  { answer: 'TILAK', clue: 'The sacred mark on the forehead' },
  { answer: 'ASHRAM', clue: 'A place of spiritual retreat' },
  { answer: 'PUJA', clue: 'The daily ritual of worship' },
  { answer: 'HAVAN', clue: 'Offering into the sacred fire' },
  { answer: 'GHEE', clue: 'What feeds the lamp’s flame' },
  { answer: 'LOTUS', clue: 'The flower that rises pure from the mud' },
  { answer: 'CONCH', clue: 'Blown to begin the worship (shankha)' },
  { answer: 'TULSI', clue: 'The sacred basil plant' },
  { answer: 'GANGA', clue: 'The holiest of rivers' },
  { answer: 'KASHI', clue: 'Shiva’s eternal city, Varanasi' },
  { answer: 'MOUNA', clue: 'The discipline of silence' },
  { answer: 'AHIMSA', clue: 'Harming no living being' },
  { answer: 'SATYA', clue: 'Truth, the first value' },
  { answer: 'DAYA', clue: 'Compassion for all beings' },
  { answer: 'KSHAMA', clue: 'Forgiveness, the strength of saints' },
  { answer: 'ANANDA', clue: 'Divine bliss' },
  { answer: 'JYOTHI', clue: 'The sacred flame of light' },
  { answer: 'NAIVEDYA', clue: 'Food offered to the Lord first' },
  { answer: 'PARTHI', clue: 'Puttaparthi, endearingly short' },
  { answer: 'SEVADAL', clue: 'The volunteers in scarves who serve' },
]

function lettersOnly(s: string): string {
  return s.replace(/[^A-Za-z]/g, '').toUpperCase()
}

const STOPWORDS = new Set([
  'THE', 'AND', 'WHO', 'THAT', 'WITH', 'FROM', 'THIS', 'YOUR', 'THEY', 'HAVE',
  'ARE', 'FOR', 'HIS', 'HER', 'OUR', 'ALL', 'ONE', 'YOU', 'THEIR', 'WHICH',
  'BEEN', 'WILL', 'WHEN', 'WHAT', 'ALSO', 'INTO', 'UPON', 'THEM', 'THOSE',
])

/**
 * Daily answers drawn from the day itself — bhajan lyrics, title, deity,
 * naamavali names, the quote, even the English meaning — so most of each
 * grid is new every day; the bhakti vocabulary bank only fills gaps.
 */
export function buildAnswerBank(
  bhajan: Bhajan,
  family: WeekdayFamily,
  seed: string,
  quote?: { text: string; author: string },
  nameBank?: string[],
): XwEntry[] {
  const bank: XwEntry[] = []
  const used = new Set<string>()
  const add = (answer: string, clue: string, fresh = true) => {
    const a = lettersOnly(answer)
    if (a.length >= 3 && a.length <= 9 && !used.has(a)) {
      used.add(a)
      bank.push({ answer: a, clue, fresh })
    }
  }

  // 1. Today's deity.
  const deity = DEITY_OPTIONS.find((d) => d.tag === bhajan.deity)
  if (deity) add(deity.displayName, `${family.emoji} The deity of today's bhajan`)

  // 2. Complete-the-line clues from today's lyrics (up to six).
  const lines = bhajan.lyrics.transliteration.split('\n').map((l) => l.trim()).filter(Boolean)
  const lineWords: { word: string; line: string }[] = []
  for (const line of lines) {
    for (const word of line.split(/\s+/)) {
      const clean = lettersOnly(word)
      if (clean.length >= 4 && clean.length <= 9 && !used.has(clean)) {
        lineWords.push({ word, line })
      }
    }
  }
  const picked = shuffleSeeded(lineWords, seededRng(seed + ':xwl'))
  for (const { word, line } of picked.slice(0, 6)) {
    const blanked = line.replace(word, '______')
    add(word, `Complete today's line: “${blanked}”`)
  }

  // 3. Longest word of the title.
  const titleWord = bhajan.title.split(/\s+/).sort((a, b) => b.length - a.length)[0]
  if (titleWord && !used.has(lettersOnly(titleWord))) {
    add(titleWord, `From today's bhajan title: “${bhajan.title.replace(titleWord, '______')}”`)
  }

  // 4. Today's quote, blanked (Sai's suggestion).
  if (quote) {
    const qWords = quote.text
      .split(/\s+/)
      .filter((w) => {
        const c = lettersOnly(w)
        return c.length >= 4 && c.length <= 9 && !STOPWORDS.has(c) && !used.has(c)
      })
    const qPick = shuffleSeeded(qWords, seededRng(seed + ':xwq')).slice(0, 2)
    for (const w of qPick) {
      add(w, `From today's quote: “${quote.text.replace(w, '______')}” — ${quote.author}`)
    }
  }

  // 5. Two of the day's naamavali names.
  if (nameBank) {
    const names = shuffleSeeded(
      nameBank.filter((n) => !used.has(lettersOnly(n))),
      seededRng(seed + ':xwn'),
    ).slice(0, 2)
    for (const n of names) add(n, `${family.emoji} One of the divine names sung today`)
  }

  // 6. A word from the English meaning.
  const meaningWords = bhajan.lyrics.translation
    .split(/\s+/)
    .filter((w) => {
      const c = lettersOnly(w)
      return c.length >= 5 && c.length <= 9 && !STOPWORDS.has(c) && !used.has(c)
    })
  const mPick = shuffleSeeded(meaningWords, seededRng(seed + ':xwm')).slice(0, 1)
  for (const w of mPick) {
    const blanked = bhajan.lyrics.translation.split(/\s+/).slice(0, 24).join(' ').replace(w, '______')
    add(w, `From today's meaning: “${blanked}…”`)
  }

  // 7. Bhakti vocabulary fills any remaining gaps.
  for (const e of shuffleSeeded(STATIC_BANK, seededRng(seed + ':xws'))) {
    if (!used.has(e.answer)) {
      used.add(e.answer)
      bank.push({ ...e, fresh: false })
    }
  }
  return bank
}

interface Placement {
  row: number
  col: number
  dir: 'A' | 'D'
}

const WORK = 12 // working canvas; cropped afterward — small keeps grids phone-sized

function canPlace(cells: Map<string, string>, answer: string, p: Placement): number {
  const dr = p.dir === 'D' ? 1 : 0
  const dc = p.dir === 'A' ? 1 : 0
  // Cell before start and after end must be empty.
  if (cells.has(`${p.row - dr},${p.col - dc}`)) return -1
  if (cells.has(`${p.row + dr * answer.length},${p.col + dc * answer.length}`)) return -1

  let crossings = 0
  for (let i = 0; i < answer.length; i++) {
    const r = p.row + dr * i
    const c = p.col + dc * i
    if (r < 0 || r >= WORK || c < 0 || c >= WORK) return -1
    const existing = cells.get(`${r},${c}`)
    if (existing !== undefined) {
      if (existing !== answer[i]) return -1
      crossings++
    } else {
      // A fresh cell must not touch a parallel word sideways.
      if (cells.has(`${r + dc},${c + dr}`) || cells.has(`${r - dc},${c - dr}`)) return -1
    }
  }
  return crossings
}

/**
 * Seeded interlocking mini-crossword: 5–6 words, every word after the
 * first crosses at least one other. Deterministic per date.
 */
export function generateCrossword(bank: XwEntry[], seed: string, target = 6): CrosswordPuzzle {
  let best: { placed: (XwEntry & Placement)[]; score: number } | null = null

  for (let attempt = 0; attempt < 24; attempt++) {
    const rng = seededRng(`${seed}:xw${attempt}`)
    // Daily-fresh answers first — statics only pad the pool (repeat fix).
    const fresh = shuffleSeeded(bank.filter((e) => e.fresh), rng)
    const statics = shuffleSeeded(bank.filter((e) => !e.fresh), rng)
    const pool = [...fresh, ...statics].slice(0, target + 5)
    pool.sort((a, b) => b.answer.length - a.answer.length)

    const cells = new Map<string, string>()
    const placed: (XwEntry & Placement)[] = []

    for (const entry of pool) {
      if (placed.length >= target) break
      if (placed.length === 0) {
        const p: Placement = {
          row: Math.floor(WORK / 2),
          col: Math.floor((WORK - entry.answer.length) / 2),
          dir: 'A',
        }
        placed.push({ ...entry, ...p })
        entry.answer.split('').forEach((ch, i) => cells.set(`${p.row},${p.col + i}`, ch))
        continue
      }
      // Try to cross an existing letter.
      let bestP: { p: Placement; crossings: number } | null = null
      for (const [key, ch] of cells) {
        for (let i = 0; i < entry.answer.length; i++) {
          if (entry.answer[i] !== ch) continue
          const [r, c] = key.split(',').map(Number)
          for (const dir of ['A', 'D'] as const) {
            const p: Placement = {
              row: dir === 'D' ? r - i : r,
              col: dir === 'A' ? c - i : c,
              dir,
            }
            const crossings = canPlace(cells, entry.answer, p)
            if (crossings > 0 && (!bestP || crossings > bestP.crossings || (crossings === bestP.crossings && rng() < 0.5))) {
              bestP = { p, crossings }
            }
          }
        }
      }
      if (bestP) {
        placed.push({ ...entry, ...bestP.p })
        const dr = bestP.p.dir === 'D' ? 1 : 0
        const dc = bestP.p.dir === 'A' ? 1 : 0
        entry.answer.split('').forEach((ch, i) =>
          cells.set(`${bestP!.p.row + dr * i},${bestP!.p.col + dc * i}`, ch),
        )
      }
    }

    // Compactness matters on a phone: penalize sprawling bounding boxes.
    let rMinA = WORK, rMaxA = 0, cMinA = WORK, cMaxA = 0
    for (const [key] of cells) {
      const [r, c] = key.split(',').map(Number)
      rMinA = Math.min(rMinA, r); rMaxA = Math.max(rMaxA, r)
      cMinA = Math.min(cMinA, c); cMaxA = Math.max(cMaxA, c)
    }
    const bbox = (rMaxA - rMinA + 1) + (cMaxA - cMinA + 1)
    const score = placed.length * 1000 + placed.reduce((s, e) => s + e.answer.length, 0) * 10 - bbox
    if (!best || score > best.score) best = { placed, score }
    if (placed.length >= target && bbox <= 19) break
  }

  const placed = best!.placed

  // Crop to bounding box.
  let rMin = WORK, rMax = 0, cMin = WORK, cMax = 0
  for (const e of placed) {
    const dr = e.dir === 'D' ? 1 : 0
    const dc = e.dir === 'A' ? 1 : 0
    for (let i = 0; i < e.answer.length; i++) {
      const r = e.row + dr * i
      const c = e.col + dc * i
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r)
      cMin = Math.min(cMin, c); cMax = Math.max(cMax, c)
    }
  }
  const height = rMax - rMin + 1
  const width = cMax - cMin + 1
  const solution: (string | null)[][] = Array.from({ length: height }, () =>
    Array<string | null>(width).fill(null),
  )
  for (const e of placed) {
    e.row -= rMin
    e.col -= cMin
    const dr = e.dir === 'D' ? 1 : 0
    const dc = e.dir === 'A' ? 1 : 0
    e.answer.split('').forEach((ch, i) => {
      solution[e.row + dr * i][e.col + dc * i] = ch
    })
  }

  // Standard numbering: row-major over entry-start cells.
  const starts = [...placed].sort((a, b) => a.row - b.row || a.col - b.col)
  const numberAt = new Map<string, number>()
  let n = 0
  const entries: PlacedEntry[] = []
  for (const e of starts) {
    const key = `${e.row},${e.col}`
    if (!numberAt.has(key)) numberAt.set(key, ++n)
    entries.push({ ...e, number: numberAt.get(key)! })
  }

  return { width, height, entries, solution }
}

export function entryCells(e: PlacedEntry): { row: number; col: number }[] {
  const dr = e.dir === 'D' ? 1 : 0
  const dc = e.dir === 'A' ? 1 : 0
  return e.answer.split('').map((_, i) => ({ row: e.row + dr * i, col: e.col + dc * i }))
}
