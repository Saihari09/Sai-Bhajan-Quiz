import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The anon key is Supabase's *publishable* client key — safe in a public
// bundle by design; row-level security (supabase/schema.sql) protects the
// data. Env vars still override for a different project (e.g. staging).
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://chifjhbzlxpnijdqrbni.supabase.co'
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaWZqaGJ6bHhwbmlqZHFyYm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzA2MTIsImV4cCI6MjEwMDA0NjYxMn0.Bh0ygI3Cgug8Tj9-wRlaktzlG7I99OFSqbDa0Na4lGI'

let client: SupabaseClient | null = null
let sessionPromise: Promise<string | null> | null = null

/** True when Supabase keys were baked into this build. */
export function isConfigured(): boolean {
  return Boolean(url && anonKey)
}

function getClient(): SupabaseClient | null {
  if (!isConfigured()) return null
  if (!client) client = createClient(url!, anonKey!)
  return client
}

/**
 * Device identity = Supabase anonymous session; auth.uid() is the device id
 * and RLS enforces that each device writes only its own rows.
 */
export async function ensureSession(): Promise<string | null> {
  const c = getClient()
  if (!c) return null
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const { data } = await c.auth.getSession()
        if (data.session) return data.session.user.id
        const { data: anon, error } = await c.auth.signInAnonymously()
        if (error) return null
        return anon.user?.id ?? null
      } catch {
        return null
      }
    })()
  }
  return sessionPromise
}

export async function upsertPlayer(deviceId: string, displayName: string): Promise<boolean> {
  const c = getClient()
  if (!c) return false
  const { error } = await c
    .from('players')
    .upsert({ device_id: deviceId, display_name: displayName.slice(0, 20) || 'Devotee' })
  return !error
}

export interface ScoreRow {
  device_id: string
  date: string
  game: string
  points: number
  completed_at: string
}

export async function submitScores(rows: ScoreRow[]): Promise<boolean> {
  const c = getClient()
  if (!c || rows.length === 0) return false
  const { error } = await c
    .from('scores')
    .upsert(rows, { onConflict: 'device_id,date,game', ignoreDuplicates: true })
  return !error
}

export interface BoardRow {
  device_id: string
  display_name: string
  total: number
}

export async function fetchDailyBoard(
  date: string,
  memberIds?: string[],
): Promise<BoardRow[] | null> {
  const c = getClient()
  if (!c) return null
  let q = c.from('daily_totals').select('device_id, display_name, total').eq('date', date)
  if (memberIds) q = q.in('device_id', memberIds)
  const { data, error } = await q.order('total', { ascending: false }).limit(50)
  if (error) return null
  return data as BoardRow[]
}

export interface LampRow {
  device_id: string
  display_name: string
  days: number
}

export async function fetchWeeklyLamps(memberIds?: string[]): Promise<LampRow[] | null> {
  const c = getClient()
  if (!c) return null
  let q = c.from('weekly_lamps').select('device_id, display_name, days')
  if (memberIds) q = q.in('device_id', memberIds)
  const { data, error } = await q.order('days', { ascending: false }).limit(50)
  if (error) return null
  return data as LampRow[]
}

export interface Group {
  id: string
  code: string
  name: string
}

/** No 0/O/1/I — codes get read aloud over WhatsApp voice notes. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export async function createGroup(name: string, deviceId: string): Promise<Group | null> {
  const c = getClient()
  if (!c) return null
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(
      crypto.getRandomValues(new Uint32Array(6)),
      (n) => CODE_ALPHABET[n % CODE_ALPHABET.length],
    ).join('')
    const { data, error } = await c
      .from('groups')
      .insert({ code, name: name.slice(0, 30), created_by: deviceId })
      .select()
      .single()
    if (!error && data) {
      await c.from('group_members').insert({ group_id: data.id, device_id: deviceId })
      return { id: data.id, code: data.code, name: data.name }
    }
    // Unique-code collision → retry with a fresh code; other errors → stop.
    if (error && !`${error.message}`.includes('duplicate')) return null
  }
  return null
}

export async function joinGroup(code: string, deviceId: string): Promise<Group | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c
    .from('groups')
    .select('id, code, name')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()
  if (error || !data) return null
  const { error: joinErr } = await c
    .from('group_members')
    .upsert({ group_id: data.id, device_id: deviceId })
  if (joinErr && !`${joinErr.message}`.includes('duplicate')) return null
  return data as Group
}

export async function fetchGroupMemberIds(groupId: string): Promise<string[] | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c
    .from('group_members')
    .select('device_id')
    .eq('group_id', groupId)
  if (error) return null
  return (data as { device_id: string }[]).map((r) => r.device_id)
}
