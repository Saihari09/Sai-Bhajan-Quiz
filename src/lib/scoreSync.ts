import { useProgressStore } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import {
  isConfigured,
  ensureSession,
  upsertPlayer,
  submitScores,
  type ScoreRow,
} from './backend'

const SYNC_KEY = 'bhajan-bodh-synced'

function loadSynced(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SYNC_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

let flushing = false

/**
 * Push any unsynced game results to the leaderboard. Offline-first: the
 * game never waits on this — scores queue in the progress store and this
 * retries on every app open and after every completion.
 */
export async function flushScores(): Promise<void> {
  if (!isConfigured() || flushing) return
  flushing = true
  try {
    const deviceId = await ensureSession()
    if (!deviceId) return

    const name = useSettingsStore.getState().displayName || 'Devotee'
    if (!(await upsertPlayer(deviceId, name))) return

    const synced = loadSynced()
    const rows: ScoreRow[] = []
    for (const [date, day] of Object.entries(useProgressStore.getState().days)) {
      for (const [game, result] of Object.entries(day.results)) {
        const key = `${date}:${game}`
        if (result && !synced.has(key)) {
          rows.push({
            device_id: deviceId,
            date,
            game,
            points: Math.min(Math.max(result.points, 0), 100),
            completed_at: result.completedAt,
            ...(result.seconds != null ? { seconds: result.seconds } : {}),
          })
        }
      }
    }
    if (rows.length === 0) return
    if (await submitScores(rows)) {
      rows.forEach((r) => synced.add(`${r.date}:${r.game}`))
      localStorage.setItem(SYNC_KEY, JSON.stringify([...synced]))
    }
  } finally {
    flushing = false
  }
}

/** Wire once at app start: sync now, then after every recorded result. */
export function startScoreSync(): void {
  void flushScores()
  useProgressStore.subscribe((state, prev) => {
    if (state.days !== prev.days) void flushScores()
  })
}
