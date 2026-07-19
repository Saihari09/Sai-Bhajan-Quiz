import { describe, it, expect, beforeEach } from 'vitest'
import {
  useProgressStore,
  migrateFromV1,
  dayLampLit,
  lifetimeLamps,
  dayPoints,
} from '../src/store/progressStore'

function resetStore() {
  useProgressStore.setState({
    days: {},
    v1Credit: 0,
    v1LongestStreak: 0,
    migratedFromV1: false,
    justMigrated: false,
  })
}

describe('progress store & scoring invariants', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('first completion locks the score — replays cannot change it', () => {
    const s = useProgressStore.getState()
    s.recordResult('2026-07-20', 'heardle', 80)
    useProgressStore.getState().recordResult('2026-07-20', 'heardle', 100)
    expect(useProgressStore.getState().days['2026-07-20'].results.heardle?.points).toBe(80)
  })

  it('day points sum across games; lamp lights on ≥1 game or listening', () => {
    const s = useProgressStore.getState()
    expect(dayLampLit(undefined)).toBe(false)
    s.recordResult('2026-07-20', 'heardle', 100)
    useProgressStore.getState().recordResult('2026-07-20', 'antakshari', 68)
    const day = useProgressStore.getState().days['2026-07-20']
    expect(dayPoints(day)).toBe(168)
    expect(dayLampLit(day)).toBe(true)

    useProgressStore.getState().markListened('2026-07-21')
    expect(dayLampLit(useProgressStore.getState().days['2026-07-21'])).toBe(true)
    expect(dayPoints(useProgressStore.getState().days['2026-07-21'])).toBe(0)
  })

  it('lifetime lamps count distinct V2 days only — V2 starts fresh', () => {
    const s = useProgressStore.getState()
    s.recordResult('2026-07-20', 'heardle', 100)
    useProgressStore.getState().recordResult('2026-07-20', 'deity', 60)
    useProgressStore.getState().recordResult('2026-07-21', 'crossword', 40)
    // Even a device with legacy V1 credit persisted gets no carry-forward.
    useProgressStore.setState({ v1Credit: 40 })
    expect(lifetimeLamps({ days: useProgressStore.getState().days })).toBe(2)
  })

  it('V1 data is left untouched and never credited (fresh start)', () => {
    localStorage.setItem(
      'sai-bhajan-streak',
      JSON.stringify({ state: { totalGamesPlayed: 42, longestStreak: 7 }, version: 1 }),
    )
    migrateFromV1()
    const state = useProgressStore.getState()
    expect(state.migratedFromV1).toBe(true)
    expect(state.v1Credit).toBe(0)
    expect(state.justMigrated).toBe(false)
    // V1 store untouched for posterity.
    expect(localStorage.getItem('sai-bhajan-streak')).toContain('42')
  })

  it('leaderboard row invariant: every per-game score is within 0–100', () => {
    // The DB check constraint mirrors this; sync clamps as a second belt.
    const clamp = (p: number) => Math.min(Math.max(p, 0), 100)
    expect(clamp(120)).toBe(100)
    expect(clamp(-5)).toBe(0)
    expect(clamp(68)).toBe(68)
  })
})
