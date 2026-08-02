import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useProgressStore, dayPoints, dayLampLit, lifetimeLamps } from '../store/progressStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { getTodayString, formatSeconds } from '../lib/dateUtils'
import { flushScores } from '../lib/scoreSync'
import {
  isConfigured,
  ensureSession,
  fetchDailyBoard,
  fetchWeeklyLamps,
  fetchGroupMemberIds,
  createGroup,
  joinGroup,
  type Group,
  type BoardRow,
  type LampRow,
} from '../lib/backend'
import { trackEvent } from '../lib/analytics'

type Tab = 'satsang' | 'everyone' | 'lamps'

const GROUPS_KEY = 'bhajan-bodh-groups'
const PENDING_JOIN_KEY = 'bhajan-bodh-pending-join'
const MAX_GROUPS = 5

function loadGroups(): Group[] {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveGroups(groups: Group[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function LeaderboardPage() {
  const today = getTodayString()
  const days = useProgressStore((s) => s.days)
  const { displayName, setDisplayName } = useSettingsStore()
  const showToast = useToastStore((s) => s.show)

  const playedToday = dayLampLit(days[today])
  const myPoints = dayPoints(days[today])
  const weekCutoff = new Date(today + 'T12:00:00')
  weekCutoff.setDate(weekCutoff.getDate() - 6)
  const cutoffStr = weekCutoff.toISOString().slice(0, 10)
  const myWeekDays = Object.entries(days).filter(
    ([date, d]) => date >= cutoffStr && date <= today && dayLampLit(d),
  ).length

  const [tab, setTab] = useState<Tab>('satsang')
  const [groups, setGroups] = useState<Group[]>(loadGroups)
  const [activeGroup, setActiveGroup] = useState<Group | null>(() => loadGroups()[0] ?? null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardRow[] | null>(null)
  const [lamps, setLamps] = useState<LampRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [nameDraft, setNameDraft] = useState(displayName)
  const [joinCode, setJoinCode] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  const configured = isConfigured()

  const refresh = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setFailed(false)
    try {
      await flushScores()
      const uid = await ensureSession()
      setDeviceId(uid)
      let memberIds: string[] | undefined
      if (tab === 'satsang' && activeGroup) {
        memberIds = (await fetchGroupMemberIds(activeGroup.id)) ?? undefined
        if (!memberIds) {
          setFailed(true)
          return
        }
      }
      if (tab === 'lamps') {
        const rows = await fetchWeeklyLamps()
        if (!rows) setFailed(true)
        setLamps(rows)
      } else {
        const rows = await fetchDailyBoard(today, memberIds)
        if (!rows) setFailed(true)
        setBoard(rows)
      }
    } finally {
      setLoading(false)
    }
  }, [configured, tab, activeGroup, today])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // A join link (?join=CODE) captured at app start lands here.
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_JOIN_KEY)
    if (!pending || !configured) return
    localStorage.removeItem(PENDING_JOIN_KEY)
    void (async () => {
      const uid = await ensureSession()
      if (!uid) return
      const g = await joinGroup(pending, uid)
      if (g) {
        const next = [...loadGroups().filter((x) => x.id !== g.id), g].slice(0, MAX_GROUPS)
        saveGroups(next)
        setGroups(next)
        setActiveGroup(g)
        showToast(`Joined ${g.name} 🙏`)
        trackEvent('group_join')
      }
    })()
  }, [configured, showToast])

  const doCreate = async () => {
    if (!newGroupName.trim()) return
    const uid = await ensureSession()
    if (!uid) return
    const g = await createGroup(newGroupName.trim(), uid)
    if (!g) {
      showToast("Couldn't create the group — try again 🙏")
      return
    }
    const next = [...groups, g].slice(0, MAX_GROUPS)
    saveGroups(next)
    setGroups(next)
    setActiveGroup(g)
    setNewGroupName('')
    trackEvent('group_create')
    void refresh()
  }

  const doJoin = async () => {
    if (!joinCode.trim()) return
    const uid = await ensureSession()
    if (!uid) return
    const g = await joinGroup(joinCode, uid)
    if (!g) {
      showToast('No satsang found with that code — check with your group 🙏')
      return
    }
    const next = [...groups.filter((x) => x.id !== g.id), g].slice(0, MAX_GROUPS)
    saveGroups(next)
    setGroups(next)
    setActiveGroup(g)
    setJoinCode('')
    void refresh()
  }

  const shareGroup = async (g: Group) => {
    const appUrl = window.location.origin + import.meta.env.BASE_URL
    const text = `Join our satsang "${g.name}" on Bhajan Bodh! 🪔\nCode: ${g.code}\n${appUrl}?join=${g.code}`
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        showToast('Invite copied — paste it in WhatsApp 🙏')
      }
    } catch {
      /* cancelled */
    }
  }

  const myRow = useMemo(
    () => (board && deviceId ? board.findIndex((r) => r.device_id === deviceId) : -1),
    [board, deviceId],
  )

  if (!playedToday) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="text-4xl">🪔</span>
        <p className="text-xl text-ink">Play at least one game today, then come see how the satsang is singing!</p>
        <Link to="/" className="min-h-12 rounded-full bg-turmeric px-6 py-3 text-lg font-semibold text-paper">
          Today's games
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="text-center">
        <h2 className="font-display text-2xl text-maroon">Leaderboard</h2>
        <p className="text-lg text-ink-soft">You today: {myPoints} pts 🪔</p>
      </div>

      {/* Display name */}
      {!displayName && (
        <p className="-mb-2 text-center text-lg text-turmeric-deep">
          Add your name so your satsang can cheer for you 🙏
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={20}
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="Your name on the board"
          aria-label="Display name"
          className={`min-h-12 flex-1 rounded-2xl border-2 bg-paper px-4 text-lg focus:border-turmeric focus:outline-none ${
            displayName ? 'border-line' : 'border-gold'
          }`}
        />
        {nameDraft.trim() !== displayName && (
          <button
            onClick={() => {
              setDisplayName(nameDraft.trim())
              void flushScores().then(refresh)
            }}
            className="min-h-12 rounded-2xl bg-turmeric px-4 text-lg font-semibold text-paper"
          >
            Save
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(
          [
            ['satsang', 'My Satsang'],
            ['everyone', 'Everyone'],
            ['lamps', 'Weekly Lamps'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-12 flex-1 rounded-2xl border-2 px-2 text-base font-semibold ${
              tab === t ? 'border-turmeric bg-turmeric text-paper' : 'border-line bg-paper text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-line bg-ivory px-5 py-4 text-center">
          <p className="text-lg text-ink">
            The shared satsang board opens soon 🙏 Until then your scores are safe on this
            device and will sync the moment it does.
          </p>
          <p className="mt-2 text-lg text-ink-soft">
            Today: {myPoints} pts · Lifetime lamps: {lifetimeLamps({ days })} of 108
          </p>
        </div>
      ) : tab === 'satsang' && groups.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper px-5 py-4">
          <p className="text-lg text-ink">Sing together! Start a satsang group or join one:</p>
          <div className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              maxLength={30}
              placeholder="New group name"
              className="min-h-12 flex-1 rounded-2xl border-2 border-line bg-ivory px-4 text-lg focus:border-turmeric focus:outline-none"
            />
            <button onClick={doCreate} className="min-h-12 rounded-2xl bg-turmeric px-4 text-lg font-semibold text-paper">
              Create
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="6-letter code"
              className="min-h-12 flex-1 rounded-2xl border-2 border-line bg-ivory px-4 text-lg tracking-widest focus:border-turmeric focus:outline-none"
            />
            <button onClick={doJoin} className="min-h-12 rounded-2xl bg-maroon px-4 text-lg font-semibold text-paper">
              Join
            </button>
          </div>
        </div>
      ) : (
        <>
          {tab === 'satsang' && activeGroup && (
            <div className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-2.5">
              <div className="flex items-center gap-2 overflow-x-auto">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1 text-base ${
                      activeGroup.id === g.id ? 'border-turmeric bg-turmeric text-paper' : 'border-line text-ink'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <button onClick={() => shareGroup(activeGroup)} className="min-h-10 shrink-0 rounded-full bg-maroon px-3.5 py-1.5 text-base font-semibold text-paper">
                Invite 📨
              </button>
            </div>
          )}

          {loading ? (
            <p className="py-6 text-center text-lg text-ink-soft">Listening for the satsang…</p>
          ) : failed ? (
            <p className="py-6 text-center text-lg text-ink-soft">
              Couldn't reach the satsang — your scores are safe on this device 🙏
            </p>
          ) : tab === 'lamps' ? (
            <ol className="flex flex-col gap-1.5">
              {(lamps ?? []).slice(0, 50).map((r, i) => (
                <li
                  key={r.device_id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-lg ${
                    r.device_id === deviceId ? 'bg-turmeric/15 border border-turmeric' : 'bg-paper border border-line'
                  }`}
                >
                  <span>
                    {i + 1}. {r.display_name}
                  </span>
                  <span>{'🪔'.repeat(Math.min(r.days, 7))}</span>
                </li>
              ))}
              {lamps && deviceId && !lamps.slice(0, 50).some((r) => r.device_id === deviceId) && (
                <li className="flex items-center justify-between rounded-2xl border border-turmeric bg-turmeric/15 px-4 py-2.5 text-lg">
                  <span>You</span>
                  <span>{'🪔'.repeat(Math.min(myWeekDays, 7))}</span>
                </li>
              )}
            </ol>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {(board ?? []).slice(0, 50).map((r, i) => (
                <li
                  key={r.device_id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-lg ${
                    r.device_id === deviceId ? 'bg-turmeric/15 border border-turmeric' : 'bg-paper border border-line'
                  }`}
                >
                  <span>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {r.display_name}
                  </span>
                  <span className="font-semibold">
                    {r.total}
                    {r.total_seconds != null && r.total_seconds > 0 && (
                      <span className="ml-1.5 text-base font-normal text-ink-soft">
                        ⏱ {formatSeconds(r.total_seconds)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
              {/* Own row, kindly rank-free when outside the top 50 */}
              {board && (myRow === -1 || myRow >= 50) && (
                <li className="flex items-center justify-between rounded-2xl border border-turmeric bg-turmeric/15 px-4 py-2.5 text-lg">
                  <span>You</span>
                  <span className="font-semibold">{myPoints} 🪔</span>
                </li>
              )}
              {board && board.length === 0 && (
                <p className="py-4 text-center text-lg text-ink-soft">
                  {tab === 'satsang' ? 'Your satsang has not sung today yet — be the first!' : "Be the first to light today's board!"}
                </p>
              )}
            </ol>
          )}

          {tab === 'satsang' && groups.length > 0 && groups.length < MAX_GROUPS && (
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="Join another: code"
                className="min-h-12 flex-1 rounded-2xl border-2 border-line bg-paper px-4 text-lg tracking-widest focus:border-turmeric focus:outline-none"
              />
              <button onClick={doJoin} className="min-h-12 rounded-2xl bg-maroon px-4 text-lg font-semibold text-paper">
                Join
              </button>
            </div>
          )}
        </>
      )}

      <Link to="/" className="text-center text-lg text-ink-soft underline">
        Back to today's games
      </Link>
    </div>
  )
}
