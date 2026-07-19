import { useMemo, useState } from 'react'
import type { Bhajan } from '../../types/bhajan'
import { titleMatches, normalize } from '../../lib/textNorm'
import { startSyllableOf } from '../../lib/antakshari'
import { DEITY_OPTIONS } from '../../types/bhajan'

interface Props {
  bhajans: Bhajan[]
  onSelect: (b: Bhajan) => void
  /** Antakshari: only titles starting with this syllable are shown. */
  filterPrefix?: string
  /** Recall mode: even with a filterPrefix, show nothing until the player types. */
  requireTyping?: boolean
  excludeIds?: string[]
  placeholder?: string
}

function deityName(tag: string): string {
  return DEITY_OPTIONS.find((d) => d.tag === tag)?.displayName ?? tag
}

export function BhajanPicker({ bhajans, onSelect, filterPrefix, requireTyping, excludeIds = [], placeholder }: Props) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const excluded = new Set(excludeIds)
    let pool = bhajans.filter((b) => !excluded.has(b.id))
    if (filterPrefix) {
      pool = pool.filter(
        (b) => normalize(startSyllableOf(b)) === normalize(filterPrefix),
      )
      if (requireTyping && query.trim().length === 0) return []
    }
    // Without a prefix, require 2+ typed characters (recall, not browsing).
    if (!filterPrefix && query.trim().length < 2) return []
    if (query.trim().length > 0) {
      pool = pool.filter(
        (b) =>
          titleMatches(b.title, query) ||
          (b.aliases ?? []).some((a) => titleMatches(a, query)),
      )
    }
    return pool.sort((a, b) => a.title.localeCompare(b.title))
  }, [bhajans, query, filterPrefix, requireTyping, excludeIds])

  return (
    <div className="w-full">
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? 'Type the bhajan name…'}
        aria-label="Search bhajans"
        className="w-full min-h-12 rounded-2xl border-2 border-line bg-paper px-4 py-3 text-lg text-ink placeholder:text-ink-soft focus:border-turmeric focus:outline-none"
      />
      {results.length > 0 && (
        <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border-2 border-line bg-paper divide-y divide-line" role="listbox">
          {results.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(b)
                  setQuery('')
                }}
                className="w-full min-h-12 px-4 py-3 text-left flex items-center justify-between gap-2 active:bg-ivory"
                role="option"
                aria-selected="false"
              >
                <span className="text-lg text-ink">{b.title}</span>
                <span className="shrink-0 rounded-full bg-ivory border border-line px-2.5 py-0.5 text-sm text-ink-soft">
                  {deityName(b.deity)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2 px-2 text-lg text-ink-soft">No bhajan found — try fewer letters.</p>
      )}
    </div>
  )
}
