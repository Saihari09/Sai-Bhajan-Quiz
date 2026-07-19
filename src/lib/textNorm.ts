/** Case- and diacritic-insensitive normalization for picker matching. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** True when any word of `title` starts with the query (PRD §5.1). */
export function titleMatches(title: string, query: string): boolean {
  const q = normalize(query)
  if (!q) return true
  return normalize(title)
    .split(/\s+/)
    .some((w) => w.startsWith(q))
}
