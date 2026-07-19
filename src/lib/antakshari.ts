import type { Bhajan } from '../types/bhajan'
import { hashString, pickSeeded } from './seeded'

/** A link is playable only when the player has this many valid answers. */
export const MIN_ANSWERS = 3

export function startSyllableOf(b: Bhajan): string {
  return (b.startSyllable ?? b.title.trim().slice(0, 2)).slice(0, 2)
}

/** Ending syllable of a title/word, approximated as its last two letters. */
export function endingSyllable(text: string): string {
  const lastWord = text
    .trim()
    .split(/\s+/)
    .pop()!
    .replace(/[^A-Za-z]/g, '')
  const tail = lastWord.slice(-2)
  return tail.charAt(0).toUpperCase() + tail.slice(1).toLowerCase()
}

export function answersFor(
  syllable: string,
  bhajans: Bhajan[],
  usedIds: Set<string>,
): Bhajan[] {
  return bhajans.filter(
    (b) => !usedIds.has(b.id) && startSyllableOf(b).toLowerCase() === syllable.toLowerCase(),
  )
}

function safeSyllables(bhajans: Bhajan[], usedIds: Set<string>): string[] {
  const counts = new Map<string, number>()
  for (const b of bhajans) {
    if (usedIds.has(b.id)) continue
    const s = startSyllableOf(b)
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_ANSWERS)
    .map(([s]) => s)
    .sort()
}

export interface SeedPrompt {
  syllable: string
  /** Lyric line of the day's bhajan the syllable was taken from, if any. */
  sourceLine: string | null
  sourceWord: string | null
}

/**
 * Seed the chain from a word in the day's bhajan whose ending syllable has
 * ≥3 library answers (plan §A2.2) — like the lead singer in a satsang
 * calling out where to pick up. Falls back to a date-seeded safe syllable.
 */
export function seedPrompt(
  date: string,
  dayBhajan: Bhajan,
  bhajans: Bhajan[],
): SeedPrompt {
  const used = new Set([dayBhajan.id])
  const safe = new Set(safeSyllables(bhajans, used).map((s) => s.toLowerCase()))

  const candidates: { line: string; word: string; syllable: string }[] = []
  for (const line of dayBhajan.lyrics.transliteration.split('\n')) {
    for (const word of line.split(/\s+/)) {
      const clean = word.replace(/[^A-Za-z]/g, '')
      if (clean.length < 3) continue
      const syl = endingSyllable(clean)
      if (syl.length === 2 && safe.has(syl.toLowerCase())) {
        candidates.push({ line: line.trim(), word: clean, syllable: syl })
      }
    }
  }

  if (candidates.length > 0) {
    const chosen = candidates[hashString(date + ':seed') % candidates.length]
    return { syllable: chosen.syllable, sourceLine: chosen.line, sourceWord: chosen.word }
  }

  const all = safeSyllables(bhajans, used)
  return { syllable: pickSeeded(all, date + ':seed'), sourceLine: null, sourceWord: null }
}

/**
 * Next link's syllable after the player chose `chosen`: the chosen title's
 * own ending when it stays playable (authentic antakshari chaining), else a
 * deterministic safe syllable — never a dead end.
 */
export function nextSyllable(
  date: string,
  linkIndex: number,
  chosen: Bhajan,
  bhajans: Bhajan[],
  usedIds: Set<string>,
): string {
  const natural = endingSyllable(chosen.title)
  if (natural.length === 2 && answersFor(natural, bhajans, usedIds).length >= MIN_ANSWERS) {
    return natural
  }
  const safe = safeSyllables(bhajans, usedIds)
  return pickSeeded(safe, `${date}:link${linkIndex}`)
}
