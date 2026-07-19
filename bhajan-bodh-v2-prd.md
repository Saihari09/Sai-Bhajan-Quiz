# Bhajan Bodh — V2 Product Requirements & Build Specification

**Version 2.1 · July 2026 · Status: ready for implementation**
**Companion file:** `bhajan-bodh-v2.html` — approved design prototype. Treat its theme, layout, and tone as the visual reference; game input methods in this spec supersede the prototype (crossword and antakshari changed from option-based to recall-based).

---

## 1. Product overview

A daily devotional games hub — "Puzzmo for bhakti." One page, four small daily games, all powered by a 100-bhajan library and devotional content. Games are the draw; learning and singing bhajans is the outcome. Inclusive across Hindu traditions via a weekday deity calendar; Sai bhajans are the content backbone. Primary users include elderly devotees, so every interaction is large, calm, and forgiving.

**Success looks like:** a devotee opens the app with morning coffee, plays 5–10 minutes, completes the rangoli, checks the satsang leaderboard, and leaves humming the bhajan of the day.

## 2. Core principles (apply to every feature)

1. **Recall over recognition.** Games should make players *produce* answers from memory (search, type, sing along in the head), not merely pick from options. Options are a fallback for hint states only.
2. **Never a fail state.** Wrong answer → "Try once more 🙏" → gentle reveal that still awards partial points. No red X screens, no "game over."
3. **Relaxed by default.** No timers unless the user opts into timed mode. Timed and relaxed players share one leaderboard via base points; speed bonus displayed separately.
4. **Every game leaves an earworm.** Wherever possible, correct answers are rewarded with the *sung phrase* playing.
5. **One task per screen. Tap targets ≥ 48px. Body text ≥ 18px** with A/A+/A++ scaling (100/115/130%).

## 3. Screens & information architecture

```
Hub (home)
├── Guess the Bhajan (daily)
├── Antakshari (Wed/Sat/Sun)
├── Naamavali Word Search (Tue/Fri/Sat)
├── Bhajan Crossword (Mon/Thu/Sat)
├── Bhajan of the Day (always accessible)
├── Leaderboard (tabs: My Satsang / Everyone / Weekly Lamps)
├── Rangoli Garland gallery
└── Settings (text size, timed mode, sound, name, group)
```

**Hub layout, top to bottom** (as in prototype): header with brand + text-size toggle → date + weekday deity chip → quote of the day → today's rangoli progress → game tiles (temple-arch cards, ✓ + points when done) → weekly lamps row → Bhajan of the Day card → leaderboard + share cards.

## 4. Daily content engine

- **One bhajan powers the day.** The scheduler selects the day's bhajan by the weekday deity calendar: Mon Shiva · Tue Hanuman · Wed Krishna · Thu Guru/Sai · Fri Devi · Sat Venkateswara · Sun Surya/mixed. Festival dates override (festival table, editable in admin).
- All bhajan-derived puzzles (Heardle clips, word-search names, some crossword clues, antakshari seed) are generated from the day's bhajan + deity; the full bhajan is the day's reward card.
- Content resolves server-side at 00:00 IST. Everyone worldwide gets the same daily puzzle (Wordle model) — this is what makes leaderboards and WhatsApp sharing meaningful.

## 5. Shared components

### 5.1 BhajanPicker (the key input component)

A search-select over the bhajan library. Used by Guess the Bhajan and Antakshari.

- Large input field; typing ≥ 2 characters filters library titles (case/diacritic-insensitive, matches title start of any word).
- Results as large tappable rows (title + deity chip), max 6 visible, scrollable.
- Tap a row to submit. No free-text submission — the answer must be a library bhajan, which keeps validation exact and typo-proof.
- Optional `filterPrefix` prop (used by Antakshari): only titles beginning with the given syllable are shown; typing narrows within that set.
- Empty state: "No bhajan found — try fewer letters."

### 5.2 LetterPad

Custom on-screen keypad for the crossword: A–Z in large keys (min 44px, 3 rows), plus ⌫ and "Hint". Always visible below the grid on mobile — never invoke the OS keyboard (unreliable, small, covers the grid).

### 5.3 AudioClip player

Plays pre-cut clips (2s/5s/10s variants + phrase clips + full track). Big pill button, shows play state, replay always allowed and free. All clips preloaded on game open. Files served from object storage (see §10).

### 5.4 Rangoli, Lamps, Toast, ShareCard

As built in the prototype: 4-petal SVG rangoli (one petal per completed game, ॐ + lamp + chime on completion); 7-diya weekly lamp row; toast notifications; WhatsApp-optimised share image (quote + rangoli + score + link).

## 6. Game specifications

### 6.1 Guess the Bhajan (Heardle format) — daily flagship

**Flow:**
1. Player taps ▶ — a 2-second clip of the day's bhajan plays (start offset chosen per-bhajan in admin; vary offsets across repeat cycles).
2. Player guesses via **BhajanPicker** (full library, no options shown).
3. Wrong guess or "Unlock longer clip" → 5-second clip; next → 10-second clip.
4. Stage points: 100 / 80 / 60. After a wrong guess at 10s, reveal with 40 points.
5. On solve: the refrain plays in full while confetti-free success state shows title, deity, and "you named it at X seconds."

**Rules:** replays are unlimited and free; only advancing stages costs points. Guesses that match the answer's *alternate titles* (admin-set aliases) count as correct.

**Acceptance criteria:** picker filters correctly with diacritics; stage bar reflects state; partial-point reveal path works; same puzzle for all users on a given date.

### 6.2 Antakshari — Wed/Sat/Sun

Real antakshari: **any valid bhajan counts, recalled from memory.**

**Flow (chain of 3 links; Thursday special weeks may use 5):**
1. Seed: the day's bhajan plays its final phrase; UI highlights the ending syllable ("…Govin-**DA** → sing on with **Da**").
2. Player recalls and finds a bhajan via **BhajanPicker with `filterPrefix`** = the syllable. **Every library bhajan starting with that syllable is a correct answer** — exactly like the family game. (The picker being pre-filtered is not a spoiler; it mirrors how antakshari allows any song that fits.)
3. On submit: that bhajan's opening phrase plays 🎵, a chain bead is added, and *its* ending syllable becomes the next prompt.
4. Chain syllables are precomputed by the scheduler to guarantee ≥ 3 library matches at every link.

**Scoring:** 34 per link first try (max ~100). "Hint" reveals the first word of one valid answer (−10). If the player is stuck, "Sing it for me" resolves the link with a beautiful valid answer playing (link scores 10). No dead ends, ever.

**Acceptance:** every link has ≥3 valid answers; any valid answer accepted; chain beads display; ending-syllable extraction stored per bhajan in DB (`end_syllable` column), not computed by string hacks at runtime.

### 6.3 Bhajan Crossword — Mon/Thu/Sat

A real fill-in mini crossword (5×7-ish grid, 5–7 interlocking words), clued from bhajans, deities, and bhakti vocabulary.

**Input:** tap a cell or clue → the word's cells highlight → type via **LetterPad**, auto-advance through the word, auto-jump to next unsolved word at word end. Tap a filled cell to overwrite. Correctly completed words lock green with a soft tick; letters contributed by crossing solved words pre-fill.

**Hints (Puzzmo's "easy path on every clue" principle, adapted):** per-word Hint button — first press reveals one letter (−5), second press reveals the word (−15). Auto-check is ON by default (wrong letters shake gently and clear — elderly-friendly immediate feedback); purists can turn auto-check off in settings.

**Content:** clue bank in admin (clue text, answer, category, difficulty 1–3). Weekly grids assembled by a generator script (place longest word, branch crossings, validate single-solution) with manual review in admin. At least one clue per grid references the day's/week's bhajan.

**Acceptance:** LetterPad only, OS keyboard never appears; crossing letters shared correctly; hint costs applied; grid completes → 100 base minus hint costs (floor 40).

### 6.4 Naamavali Word Search — Tue/Fri/Sat

As prototyped: 9×9 grid, 5–6 names of the day's deity, tap-first-letter-then-last-letter selection, found words lock green. **Each found name plays its sung phrase** (clip mapped per name in admin). All names found → 100 points. Generator places words H/V (no diagonals — elderly scanning comfort), fills with letters drawn from the placed words' letter distribution.

### 6.5 Occasional pool (Phase 3)

Deity Match (memory pairs) · Line Builder (V1 word-tile mechanic) · Quote Fill · Stop the Line (imposter lyric while audio plays) · festival specials. Same principles; specs to be added when scheduled.

## 7. Scoring, lamps, rangoli

| Source | Max |
|---|---|
| Guess the Bhajan | 100 |
| Each second game (2–3/day) | 100 |
| Daily max (typical 4-game day) | 400 |

- Timed mode (opt-in): +up to 20% speed bonus, displayed separately, excluded from leaderboard ranking.
- **Lamps:** one diya per day played (≥1 game). No streak-loss punishment. 108 lifetime lamps = "Mala complete" badge; 7 consecutive = special share card.
- **Rangoli:** each completed game fills one petal; all petals → rangoli completes (ॐ appears, lamp lights, chime), and the day's rangoli — a date-seeded generated pattern, different every day — is saved to the **Garland gallery**. The gallery is the long-term collection meta.

## 8. Leaderboard & satsang groups

- **Daily board:** total base points, resets 00:00 IST. Visible only after the user has played ≥1 game. Shows Top 10 + own row; never displays exact rank below 10 ("You: 240 🪔"), never shows last place.
- **Satsang groups:** create → 6-char code (unambiguous alphabet, no 0/O/1/I) → share on WhatsApp → join via link or code + display name. A user can be in up to 5 groups. Group tab shows all members ranked.
- **Weekly Lamps tab:** days-played this week — consistency beats speed.
- **Identity:** anonymous device ID (UUID in local storage) + display name; optional phone-link for multi-device in a later phase. No passwords.

## 9. Data model (Supabase / Postgres)

```
bhajans        id, title, aliases[], deity, secondary_deities[], language,
               occasion_tags[], lyrics_original, lyrics_translit, translation,
               meaning, start_syllable, end_syllable, audio_full_url,
               clip_2s_url, clip_5s_url, clip_10s_url, phrase_clips jsonb,
               heardle_offset_sec, active bool
quotes         id, text, author, tradition, theme_tags[], blank_words int[]
deities        id, name, weekday, name_bank[] (naamavali), symbol_emoji
schedule       date pk, bhajan_id, deity_id, games[] , festival_id null
festivals      id, date_rule, name, deity_id, note
xw_clues       id, answer, clue, category, difficulty
xw_grids       id, week_start, layout jsonb, status(draft|approved)
users          device_id pk, display_name, font_pref, timed_mode, sound_on
groups         id, code unique, name, created_by
group_members  group_id, device_id
scores         device_id, date, game, base_points, speed_bonus, completed_at
rangolis       device_id, date, pattern_seed, complete bool
```

Row-level security: users write only their own `scores/rangolis/users` rows; boards read via views. Daily puzzle payload served by one edge function `GET /daily?date=` returning the full day bundle (bhajan meta minus answers where hidden, clips, word search grid, crossword grid, antakshari chain spec).

**Anti-peek note:** answers must not ship to the client in plain sight before solving (e.g., Heardle answer id). Validate guesses server-side or ship salted hashes; casual devotees won't cheat, but WhatsApp-shared boards deserve basic integrity.

## 10. Tech stack & structure

- **Frontend:** Next.js (App Router) PWA, installable, offline-tolerant for the current day's bundle. Tailwind with the token palette below. Deploy: Vercel.
- **Backend:** Supabase (Postgres, Auth-less device identity, Edge Functions for /daily and /guess validation, Realtime optional for boards).
- **Audio:** clips pre-cut at upload time (admin runs ffmpeg trim server-side or a local script), stored in Supabase Storage or S3/Cloudinary; ~64kbps mono AAC is plenty and loads fast on elderly users' phones.
- **Admin panel:** protected route: bhajan CRUD + clip upload + offset picker, quote bank, clue bank, grid review, schedule calendar, festival table.

**Design tokens (from approved prototype):** ivory `#FBF3DF`, paper `#FFFBF0`, turmeric `#D97E00`, turmeric-deep `#A85E00`, maroon `#7A1E2E`, gold `#C9A227`, ink `#3B2712`, ink-soft `#77603F`, green `#3E7A45`, line `#E8D9B8`. Display font Rozha One, body Mukta. Temple-arch game cards (border-radius 120px 120px 20px 20px, turmeric top border). Diya lamps and rangoli as in prototype. `prefers-reduced-motion` respected; all sounds mutable.

## 11. Accessibility checklist (ship-blocking)

- [ ] All text ≥ 18px at base; A/A+/A++ persists (localStorage)
- [ ] All interactive elements ≥ 48px, spacing ≥ 8px between targets
- [ ] LetterPad and BhajanPicker fully operable by tap only; OS keyboard optional for picker, never required
- [ ] Contrast AA on every text/background pair in the token set
- [ ] No timers in default mode anywhere
- [ ] Audio has visible play state; nothing auto-plays with sound before first user tap (mobile autoplay policies + courtesy)
- [ ] Screen-reader labels on grid cells, clues, picker rows

## 12. Build order (for Claude Code)

1. **Scaffold + theme:** Next.js PWA, tokens, hub shell with static demo data matching the prototype.
2. **Supabase schema + seed:** tables above; seed 10 bhajans (placeholder audio URLs until clips are delivered), deities, 30 quotes, 40 crossword clues.
3. **Shared components:** BhajanPicker, LetterPad, AudioClip, Rangoli, Lamps, Toast.
4. **Games** in order: Word Search (simplest) → Heardle → Crossword → Antakshari (needs end_syllable data).
5. **Daily engine:** `/daily` edge function + scheduler + festival overrides.
6. **Scores, lamps, rangoli persistence + Garland gallery.**
7. **Leaderboards + groups + share card.**
8. **Admin panel.**
9. **PWA polish:** install prompt, offline day-bundle cache, icons.

Each step should end runnable and demoable. Write component tests for BhajanPicker filtering (diacritics!), crossword letter-crossing logic, and antakshari chain validation.

## 13. Open items

1. **Audio clips:** the Drive folder `Sai_Bhajan_quiz/Bhajans` is not readable via the current connector — deliver clips as a zip or bucket upload, one file per bhajan, filename = bhajan title. The admin clip-cutter handles the rest.
2. **Library metadata:** each bhajan needs lyrics + deity tag + start/end syllables; a CSV template will be generated in step 2 for bulk fill.
3. Timed mode, language toggle (Devanagari/Telugu), and Phase-3 games are out of the first build.
