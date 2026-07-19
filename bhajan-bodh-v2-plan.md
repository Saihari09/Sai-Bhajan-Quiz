# Bhajan Bodh V2 — PRD Scrutiny & Implementation Plan

**Prepared July 19, 2026 · against PRD v2.1 and the live V1 codebase**

This document does two things: (Part A) challenges every major PRD proposal against what V1 actually is, and (Part B) lays out the build plan that keeps the PRD's product vision while fixing the parts that don't survive contact with reality.

---

# Part A — Scrutiny: the PRD vs. the V1 model

## A1. What V1 actually is (facts the PRD gets wrong or ignores)

| Fact | V1 reality | PRD assumption |
|---|---|---|
| Library size | **98 bhajans**, full lyrics (original + transliteration + translation + per-line word arrays), deity tags, difficulty, occasion | "100-bhajan library" ✓ roughly right, but seed plan says "seed 10 bhajans" — we already have 98 fully structured |
| Audio | **One 20-second clip per bhajan** (~100 KB each, 27 MB total), already in the repo, plus a sairhythms.org full-track URL | 2s/5s/10s pre-cut clips + phrase clips + full track hosted in object storage — **none of this exists** |
| Stack | Vite 8 + React 19 + TS + Tailwind 4 + Zustand + Howler + PWA, **fully static on GitHub Pages, zero backend** | Next.js on Vercel + Supabase (Postgres, RLS, Edge Functions, Storage) |
| Day boundary | **Local midnight** per user (`getTodayString()`) | Server-side 00:00 IST global |
| Content ops | Sai edits JSON in the repo, git push, GitHub Actions deploys. Admin page just generates JSON. | Full DB-backed admin panel (CRUD, clip cutter, grid review, schedule calendar) |
| Player data | Streaks/history/game-state in localStorage (`sai-bhajan-streak`) | Fresh device-UUID identity + Postgres scores |
| Deity distribution | sai 19, krishna 14, shiva 12, ganesha 10, rama 9, sarva-dharma 9, devi 8, narayana 5, guru 5, hanuman+anjaneya 3, vittala 2, subrahmanya 2 | Weekday calendar requiring **Venkateswara (0 bhajans)** and **Surya (0 bhajans)** slots |

## A2. Item-by-item verdicts

### ✅ Keep as specced (fits V1 well)
- **Core principles §2** — recall over recognition, never-fail, relaxed default, large targets. All good and all achievable client-side. V1's 60s scoring windows and speed bonuses are the main casualty; that's a deliberate, correct product change for the elderly audience.
- **Hub-and-tiles IA §3** — V1 already has Home → Game → Reveal routing; the hub is a restyle + expansion, not a rearchitecture.
- **"Same puzzle for all users" §4** — V1 already does this (schedule.json + date-hash fallback). Not a new capability.
- **BhajanPicker §5.1** — the single best idea in the PRD. 98 titles is exactly the right size for a 2-char-filter picker. Needs diacritic-folding (titles are ASCII transliteration already, so this is cheap).
- **Word Search §6.4** — simplest new game, content (deity name banks) is easy to author, generator is a solved problem. Right choice to build first.
- **Heardle §6.1** — natural evolution of V1's Round 1 (audio + guess). Best flagship choice.
- **Lamps replacing streaks §7** — no-loss consistency metric is friendlier than V1's streak-with-reset. Keep V1's streak data and convert it (see A3.8).
- **Accessibility checklist §11** — nothing controversial; ship-blocking is right.

### ⚠️ Keep the idea, change the spec

**1. Audio strategy (§5.3, §6.1, §10) — the PRD's biggest reality gap.**
The PRD demands pre-cut 2s/5s/10s clips, phrase clips, and full tracks in object storage. None exist, and phrase clips (the "sung phrase per word-search name", "final phrase of the bhajan", "opening phrase") are a **large manual content project across 98 bhajans** — the single most expensive line item hiding in this PRD.
*Change (confirmed with Sai, July 19 2026):* the existing clips are **instrumental** versions and cannot change for now. V2.0 therefore adapts the first wave of games to them and treats richer audio as later improvisation. Mechanics: **Howler audio sprites over the existing 20-second clips**. A sprite is just `{offset, duration}` — 2s/5s/10s Heardle stages are three sprite definitions on one file we already have. Zero new audio files, zero new storage, no ffmpeg pipeline, no upload admin. Per-bhajan `heardleOffsetSec` (default 0) added to JSON.
*Instrumental adaptation — "the devotee provides the voice":* guessing from melody alone is the classic Heardle experience and works unchanged. The "earworm" principle is preserved by pairing audio with lyrics on screen: on solve (and on the Bhajan of the Day card) the instrumental plays while the transliterated lyrics display as a **sing-along panel** — instrumental accompaniment plus the devotee's own singing is exactly how bhajan practice works. Each bhajan's existing `fullUrl` (sairhythms.sathyasai.org) is surfaced as a "Listen to the sung version 🎧" link for vocals — link out, never rehost. Phrase-level and vocal clips become **later improvisation** added bhajan-by-bhajan (only with permission if sourced from SSSIO recordings), never a launch dependency.
*Consequence:* Antakshari's "final phrase plays" seed can't work as specced (our clips are the bhajan's opening, not its ending) — see next item.

**2. Antakshari (§6.2) — feasible, but the chain math is tighter than the PRD thinks.**
Measured against the real library: only **15 starting syllables have ≥3 titles** (Ja 8, Sa 7, Bh 5, Ga 5, Pr 5, Sh 5, Ma 4, Go 4, Sr 4, Ha 4, De 4, He 4, Es 3, Ra 3, Ka 3), covering 68 of 98 bhajans. The PRD's "chain syllables precomputed to guarantee ≥3 matches" is therefore achievable **only if the generator routes exclusively through that safe set** — and the seed link can't be "the day's bhajan's true final syllable" (which frequently won't land in the safe set).
*Change:* the seed prompt is a **chosen word from the day's bhajan lyrics whose ending syllable is in the safe set**, shown with its lyric line ("…the line ends *Govinda* → sing on with **Da**"). Audio for the seed = the day's normal clip (which the player just heard in Heardle anyway — nice continuity). On submitting a chain answer, play that bhajan's clip opening (sprite: first 4s). `start_syllable` is derivable by script from titles (first 2–3 chars, hand-reviewed once); `end_syllable` per bhajan is only needed if we later want true end-seeding, so drop it from the launch schema.

**3. Weekday deity calendar (§4) — doesn't fit the library.**
Sat = Venkateswara (0 bhajans) and Sun = Surya (0 bhajans) are impossible; Tue = Hanuman has 3 bhajans, which would repeat every ~3 weeks.
*Change to match actual holdings:*
- Mon **Shiva** (12) · Tue **Hanuman/Rama** (12 combined — traditional pairing, fixes the drought) · Wed **Krishna** (14) · Thu **Sai/Guru** (24) · Fri **Devi** (8) · Sat **Narayana/Vittala/Venkateswara-family** (7, backfilled by sarva-dharma) · Sun **Sarva-dharma/mixed** (9 + ganesha 10 as float).
- The calendar is a **weighted preference, not a hard constraint**: the scheduler picks the least-recently-played bhajan of the day's deity family, falls back to global least-recently-played. Festival table overrides everything. This also gives Fri/Devi (8 bhajans) a repeat cycle of ~8 weeks instead of forcing exact rotation.

**4. Crossword (§6.3) — the riskiest game for this audience; de-risk or defer.**
Transliterated Sanskrit has **no canonical spelling** (Vinayaka/Vinaayaka, Eshwari/Ishwari — our own library uses "Es" for Ishwar-words). A fill-in grid demands exact letters; that's a spelling test in a language with no agreed romanization, aimed at elderly users. This directly violates principle 1's spirit — it tests transliteration convention, not bhajan knowledge.
*Change:* ship V2.0 **without** the crossword; build it in Phase 2 with a constrained answer bank: deity names and bhakti vocabulary **with one unambiguous common spelling** (RAMA, DIYA, GURU, OM, SEVA, BHAKTI, ARATI…), auto-check ON, crossing-letter prefill, per-word hints as specced. Grid generation stays a build-time script with output committed to the repo, hand-reviewed in the PR diff (that *is* the "manual review in admin").

**5. Tech stack (§10) — a Next.js/Vercel/Supabase rewrite is not justified by the feature list.**
Scrutiny of what actually needs a server: **only leaderboards and satsang groups.** Everything else — daily engine, all four games, rangoli, lamps, share cards, PWA/offline — is static-file territory V1 already handles. Next.js adds a framework migration, a new deploy target, and server code to a solo-maintainer project, for zero user-visible gain; vite-plugin-pwa already does installable/offline.
*Change:* **keep Vite + React + GitHub Pages.** Add **Supabase via its browser JS client only** (no Edge Functions) in the leaderboard phase: three tables (`players`, `groups`, `group_members`, `scores`), RLS so devices write only their own rows, a view for daily boards. A static site talking to Supabase directly is a fully supported, zero-server-code pattern. Content (bhajans, quotes, schedule, deity banks, grids) **stays as JSON in the repo** — it preserves Sai's proven git-push workflow and makes every content change reviewable in a diff.

**6. Anti-peek server-side guess validation (§9) — over-engineered.**
The threat is a devotee opening DevTools to cheat a WhatsApp leaderboard. Server validation adds an Edge Function + latency to every guess for that. *Change:* ship the daily bundle with the answer's **salted SHA-256 hash**; validate client-side against the hash. Casual-peek-proof, zero server code. Revisit only if cheating is ever observed.

**7. 00:00 IST global day (§4) vs V1's local midnight.**
IST-fixed days give US users their "new day" at ~11:30 AM Los Angeles / 2:30 PM New York — a worse experience for the diaspora satsang audience, and a behavior change for existing players. The stated reason (shared leaderboards) doesn't require it: score rows keyed by the **puzzle date string** compare correctly across timezones — everyone who played "2026-07-19" is on the 2026-07-19 board, exactly like Wordle share grids.
*Change:* keep local-midnight puzzle rollover; leaderboard partitions by puzzle-date string. (Boards "settle" as the date finishes rolling around the globe — acceptable, and how Wordle-likes work.)

**8. Identity & migration (§8) — the PRD silently discards existing players' history.**
V1 players have streaks, longest-streak, games-played, and 30-day history in localStorage. *Change:* on first V2 load, a **migration step** reads `sai-bhajan-streak` and converts: `totalGamesPlayed` + history days → lifetime lamp count (credit toward the 108 Mala), longest streak preserved as a stat. Also: device-UUID identity means a lost phone = lost identity; the PRD already defers phone-link, but add the cheap mitigation — **show the user their code and let them re-enter it on a new device** (a "restore code" = the UUID, displayed in Settings).
Display names need a length cap (say 20 chars) and a trivial denylist before they render on shared boards.

**9. Rangoli petal count (§5.4, §7) — internal inconsistency.**
"4-petal rangoli, one petal per completed game" but the schedule yields 2-game days (Sun: Heardle+Antakshari) through 4-game days (Sat). *Change:* rangoli has **N petals where N = today's scheduled game count** (2–4); completing all of today's games completes the rangoli every day. Daily max points likewise varies (200–400); the leaderboard is per-day so this is fair — everyone has the same max on the same date.

**10. Admin panel (§10, build step 8) — mostly YAGNI for a solo git-native maintainer.**
A DB-backed CRUD admin is a second application to build and maintain. *Change:* extend the **existing `/admin` JSON-generator page** for the new fields (aliases, heardle offset with an audible offset-picker, syllables) plus **repo scripts** (`scripts/`) for: syllable derivation, chain generation + validation, word-search/crossword grid generation, schedule generation with festival overrides. All output is committed JSON — CI validates it (chain has ≥3 matches per link, grid words exist in name bank, schedule dates contiguous). The PR diff *is* the review UI.

### ❌ Drop / out of scope for V2.0 (PRD already partly agrees)
- Timed mode (+speed bonus) — PRD §13 already defers; agree. Note this also kills V1's speed-bonus scoring, simplifying everything.
- Language toggle (Devanagari/Telugu) — deferred per §13; our lyrics JSON already stores `original`, so the door stays open.
- Phase-3 occasional games (Deity Match, Line Builder, Quote Fill, Stop the Line) — deferred per §6.5. Note **Line Builder is V1's Round 2/3 mechanic** — we keep that code aside rather than deleting it.
- Supabase Realtime for live boards — polling on tab-open is plenty.
- Edge Functions entirely (see A2.5, A2.6).

### 📋 Missing from the PRD (things it never addresses)
1. **The companion prototype `bhajan-bodh-v2.html` is not in the repo or Downloads** — the plan reproduces the visual system from §10's tokens; the prototype file should be added to the repo if it exists elsewhere.
2. **What happens to V1 on launch day** — same URL? V2 replaces it in place (recommended: yes, same repo/URL so PWA users auto-update; keep V1 tagged `v1-final`).
3. **Quote bank content** — 30 quotes need sourcing/writing (small, but someone must do it; short original paraphrases or public-domain sources, not copied copyrighted translations).
4. **Deity name banks** — 5–6 naamavali names per deity × ~10 deities; must be ≤9 letters for a 9×9 grid ("VENKATESWARA" is 12 — either use shorter names like GOVINDA/SRINIVASA→ no, 9 — or bump the grid to 11×11; decision: **names ≤9 letters, curated per deity**).
5. **GoatCounter analytics** — V1 has it; PRD never mentions instrumentation. Keep it; add per-game completion events so we learn which games devotees actually finish.

---

# Part B — Implementation plan

## B1. Architecture summary

- **Stack:** Vite 8 + React 19 + TS + Tailwind 4 + Zustand + Howler + vite-plugin-pwa (unchanged). React Router for hub/game routes.
- **Hosting:** GitHub Pages, same repo, same Actions deploy (unchanged).
- **Content:** repo JSON — `bhajans.json` (extended), `quotes.json`, `deities.json` (with name banks + weekday map), `festivals.json`, `schedule/` (generated per-quarter files), `grids/` (generated word-search + crossword layouts), all produced/validated by `scripts/*.ts` run locally + in CI.
- **Backend (Phase 4 only):** Supabase free tier, browser client, tables `players / groups / group_members / scores`, RLS, one leaderboard view. No server code anywhere.
- **Audio:** existing 20s clips + Howler sprites. New per-bhajan fields: `heardleOffsetSec`, `aliases[]`, `startSyllable`.
- **Day model:** local midnight (unchanged); all daily artifacts keyed by `YYYY-MM-DD` string.

## B2. Schema additions to `bhajans.json` (superset of V1 — V1 fields untouched)

```jsonc
{
  // ...all existing V1 fields remain...
  "aliases": ["Vinayaka Vinayaka"],   // alternate titles accepted in Heardle
  "startSyllable": "Su",              // derived by script, hand-reviewed once
  "heardleOffsetSec": 0               // where the 2s stage starts within the 20s clip
}
```

`deities.json` (new): `{ tag, displayName, imageUrl, weekday[], nameBank[] (≤9 letters each), emoji }` — folds in V1's hardcoded `DEITY_OPTIONS`.

## B3. Phases

Each phase ends runnable, deployable, and demoable on the live URL behind no flag (hub tiles for unbuilt games simply don't render until their phase ships).

### Phase 0 — Decisions locked & content prep (no code)
- Confirm: same URL replaces V1; crossword deferred to Phase 2; calendar per A2.3.
- Locate/commit the `bhajan-bodh-v2.html` prototype if it exists.
- Author: 30 quotes, deity name banks, festival table for the next 12 months, alias list for ambiguous titles.
- Run syllable-derivation script; hand-review the 98 `startSyllable` values (one sitting).

**Content sourcing map (where each bank comes from):**
| Content | Source | Notes |
|---|---|---|
| Quotes (hub quote-of-the-day, future Quote Fill) | [saispeaks.sathyasai.org](https://saispeaks.sathyasai.org/) (official SSSIO discourse archive, searchable); "Thought for the Day" from Prasanthi Nilayam (archives at saibabaofindia.com; official SSSIO media channels) | Discourses are copyright Sri Sathya Sai Sadhana Trust: keep quotes short, always attributed ("— Sri Sathya Sai Baba"), free non-commercial devotional app; paraphrase where long. Mix in public-domain scripture (Gita, Upanishads — old translations) for the sarva-dharma spirit. |
| Bhajan metadata, lyrics, sung versions | [sairhythms.sathyasai.org](https://sairhythms.sathyasai.org) (already V1's source; every bhajan has its `fullUrl`) | Link out for sung audio; do not rehost recordings without SSSIO permission. |
| Deity name banks (word search) | Ashtottara Shatanamavali (108-names) lists for each deity — names themselves are not copyrightable; curate 8–12 per deity, ≤9 letters, from any stotra reference | Hand-pick familiar names (GAJANANA, VINAYAKA over obscure ones); Sai reviews. |
| Festival dates | drikpanchang.com or any panchang, entered once a year into `festivals.json` | Dates shift yearly (lunar calendar) — annual 30-minute task. |
| Crossword clue bank (Phase 3.5) | Derived from our own lyrics/translations + bhakti glossary | Original clues written by us; no copyright exposure. |

### Phase 1 — Theme + hub shell + migration (the app *feels* like V2)
- Design tokens (§10 palette), Rozha One/Mukta via self-hosted fonts, temple-arch card component, A/A+/A++ text scaling persisted (html-level `font-size: 100/115/130%` — everything in rem).
- New hub: header, date + deity chip, quote of the day, rangoli progress, game tiles (Heardle live, others "coming soon"), lamps row, Bhajan of the Day card, settings sheet (name, text size, sound).
- **V1 → V2 localStorage migration** (streaks→lamps credit, per A2.8).
- V1's 3-round game keeps working during this phase as the "daily game" until Phase 3 replaces it — no dead app mid-migration.
- `prefers-reduced-motion`, contrast pass on every token pair.
- **Exit criteria:** accessibility checklist §11 items 1, 2, 4, 6 pass; Lighthouse a11y ≥ 95.

### Phase 2 — Shared components + daily engine
- **BhajanPicker**: 2-char filter, diacritic/case folding, word-start matching, 6-row scroll, `filterPrefix` prop, empty state. *Component tests: filtering incl. folding.*
- **AudioClip**: sprite player over Howler (stage sprites, replay-free, visible play state, preload on game open).
- **Rangoli** (N-petal, date-seeded pattern), **Lamps**, **Toast**, **ShareCard** (canvas → WhatsApp image: quote + rangoli + score + link).
- **Scheduler script**: generates `schedule/2026-Q3.json` etc. — per day: bhajanId (weighted deity calendar + least-recently-played + festival override), games list, antakshari chain (safe-syllable routing, ≥3 matches validated), word-search grid, quote id. CI job re-validates all committed schedule files.
- Salted-hash answer field in the daily bundle (A2.6).

### Phase 3 — The games (order: simplest → hardest)
1. **Naamavali Word Search** — 9×9, H/V only, tap-first/last-letter, found-name lock + clip flourish (generic chime until phrase clips exist), 100 pts.
2. **Guess the Bhajan (Heardle)** — 2s/5s/10s sprite stages, BhajanPicker guessing, alias matching, 100/80/60/reveal-40, refrain (full clip) on solve. Replaces V1's rounds as the daily flagship. V1 Round 2/3 code moves to `src/legacy/` for the future Line Builder.
3. **Antakshari** — per A2.2: 3-link chains, prefix-filtered picker, any-valid-answer, hint −10, "Sing it for me" resolve at 10, chain beads. *Tests: chain validation.*
4. *(Phase 3.5, after launch)* **Crossword** — constrained answer bank per A2.4, LetterPad component, auto-check ON. *Tests: crossing-letter logic.*
- Scoring: base-points-only per §7; day max = 100 × today's game count.
- **Exit criteria per game:** its §6 acceptance list, minus items amended in Part A.

### Phase 4 — Community (the only backend phase)
- Supabase project; tables + RLS (`players(device_id pk, display_name, created_at)`, `groups(id, code, name)`, `group_members`, `scores(device_id, date, game, points, completed_at)`); daily + weekly-lamps views.
- Leaderboard screen: My Satsang / Everyone / Weekly Lamps tabs; Top-10 + own row; no exact rank below 10; visible only after playing.
- Group create/join: 6-char unambiguous code, WhatsApp share link (`?join=CODE` deep link), 5-group cap, display-name prompt with cap + denylist.
- Offline/failed-post queue: scores buffer in localStorage and retry — the game never blocks on the network.
- Restore-code in Settings (A2.8).

### Phase 5 — Meta & polish
- Garland gallery (rangolis persisted locally + mirrored to Supabase `rangolis` if signed-in-ish).
- 108-lamp Mala badge, 7-day special share card.
- PWA: precache today's + tomorrow's bundle and clips; install prompt (V1 component restyled); icons.
- GoatCounter events per game completion; full §11 checklist sign-off on real devices (one older Android phone mandatory).

### Later (explicitly parked)
Timed mode · script toggle · phrase-clip enrichment pipeline · Phase-3 occasional games (Line Builder first — code already saved) · phone-number identity linking · true end-syllable antakshari seeding.

## B4. Test plan (mirrors PRD §12 but scoped to real risks)
- Unit: BhajanPicker folding/filtering; chain validator; grid generators (word placement, single-solution crossword); scheduler determinism (same date → same bundle); salted-hash guess check; localStorage migration (V1 fixture → expected lamps).
- CI: schema validation of all content JSON + regeneration check of committed schedules/grids.
- Manual: §11 checklist on iOS Safari + older Android Chrome; text-scaling at A++ on every screen; offline day-bundle replay.

## B5. Effort shape (relative, not dates)
Phase 1 ≈ Phase 2 ≈ each a solid chunk; Phase 3 is the biggest (three games); Phase 4 is small-medium thanks to no-server-code Supabase; Phase 5 is polish. The critical path runs through Phase 2's scheduler script — every game consumes its output, so it gets built and validated first, with games layering on top.
