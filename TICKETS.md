# HabitLab — Tickets

> Assignable units of work derived from `ROADMAP.md`. Every ticket assumes the definitions in `PRODUCT.md` and the rules in `AGENTS.md`.
> **Before starting any ticket:** read `PRODUCT.md` (glossary is authoritative), the ticket's phase in `ROADMAP.md`, and `AGENTS.md` (conventions + definition of done).

IDs continue the existing HAB- series. `Depends on` lists tickets that must merge first. Tickets with no shared `Depends on` and no overlapping files can be assigned to different agents in parallel.

---

## Assignment order (dependency view)

```
Phase 1  HAB-60, HAB-81 → HAB-61 → HAB-62 → HAB-63 → HAB-64 → HAB-65, HAB-66, HAB-82
Phase 2                            └→ HAB-67 → HAB-68 → HAB-69 → HAB-70 → HAB-71
Phase 3                                                                    └→ HAB-72
Phase 4  (after HAB-70)  HAB-73 (no code dependency) ‖ HAB-74 ‖ HAB-75
Phase 5  HAB-76 (early) → HAB-77 ;  HAB-78 (also needs HAB-60, HAB-67) ‖ HAB-79 ‖ HAB-80
```

**Contention files** (never assign two open tickets that both edit these): `prisma/schema.prisma`, `src/lib/habits-db.ts`, `src/lib/habit-mapper.ts`, `src/app/habits/` (HAB-70 and HAB-82 both touch this directory with no formal dependency edge between them — sequence or coordinate rather than parallelize).

> **Note on numbering:** this series intentionally starts at `HAB-60`, skipping `HAB-59`. `HAB-59` was going to collide with real repo history — at the time, a lockfile fix (`fe63af5`, "HAB-59 fix: lockfile out of sync") already used that ID. Since then, that fix was redone more completely and correctly reticketed as **`HAB-56`** ("regenerate lockfile and pin CI to Node 24 LTS", commit `ded796e`), and `HAB-59` in real history now refers to the commit that authored these planning docs (`b9fe55b`) — neither of which is part of this ticket series. Rather than keep chasing a moving real-world ID, this series simply starts at `HAB-60` and stays there.
>
> **Changelog:** renumbered every ticket up by one (old HAB-59..HAB-81 → HAB-60..HAB-82) for the reason above. Everything below refers to the *new* numbers only. Same pass: added HAB-81 (timezone-aware `dates.ts`) and HAB-82 (un-archive); tightened HAB-61/64 to depend on HAB-81 — note HAB-81 itself has no dependency (it's an independent starting ticket alongside HAB-60, not downstream of it, hence the diagram shows `HAB-60, HAB-81 →` rather than `HAB-60 → HAB-81 →`); added `User.timezone` persistence (HAB-60) so shared-view stats can use the *owner's* timezone rather than the requesting viewer's (see HAB-60/64/68/71/72 below); added explicit archived-habit and re-invite/verified-email requirements to HAB-67/68/69; loosened Phase 4 dependencies from HAB-71 to HAB-70 (HAB-73 has no code dependency at all) per `ROADMAP.md`'s own stated intent; added HAB-60/HAB-67 as dependencies of HAB-78 so the migration-drift check can't merge before the migrations it covers exist.

---

# Phase 1 — Persistence + security (critical path)

### HAB-60 — Schema: add habit `archivedAt`, user `timezone` + confirm completion model
**Depends on:** — · **Files:** `prisma/schema.prisma`, migration
- Add nullable `archivedAt DateTime?` to `Habit` (soft-delete per `PRODUCT.md`).
- Add nullable `timezone String?` (IANA name, e.g. `America/Chicago`) to `User`. This is what lets a shared tracker compute "today" in the *owner's* timezone (`PRODUCT.md`) even when a different person is viewing it — see HAB-64 (persists it), HAB-68/71 (read it for shared-view stats).
- Confirm `HabitCompletion` models a **binary** done-day: one row per (habitId, date), `@@unique([habitId, date])`. No value field.
- Migration `add_habit_archive` (folds in the `User.timezone` column — same migration, low-risk additive change).
- **Done when:** migration applies cleanly; `prisma migrate status` clean; existing rows unaffected.

### HAB-81 — Timezone-aware date keys (`dates.ts`)
**Depends on:** — · **Files:** `src/lib/dates.ts` (+ tests)
- `PRODUCT.md` requires local-timezone day boundaries, but `getDateKey()` currently uses `date.toISOString().slice(0,10)` — pure UTC, no timezone parameter anywhere in the file, and `formatDateRowLabel`/`isWeekendDateKey` parse dates in the *server's* local zone (a third, inconsistent zone).
- Add an IANA timezone parameter to every function: `getDateKey(date, timeZone)`, `getRollingDateKeys(days, timeZone)`, `isDateInRollingWindow`, `isDateTrackable`, `formatDateRowLabel`, `isWeekendDateKey`. Use `Intl.DateTimeFormat`-based formatting (or equivalent) instead of `toISOString()`/bare `Date` parsing.
- Default to `UTC` only as an explicit, documented fallback when no timezone is supplied — never silently.
- **Done when:** unit tests cover a non-UTC timezone crossing a UTC-day boundary (e.g. 9pm `America/Los_Angeles` is still "yesterday" in UTC but "today" locally); existing 30-day-window/streak tests still pass when called with an explicit timezone argument.

### HAB-61 — `habit-mapper.ts` (Prisma ↔ API shape)
**Depends on:** HAB-60, HAB-81 · **Files:** `src/lib/habit-mapper.ts` (+ tests)
- Bidirectional map: category kebab ↔ `SCREAMING_SNAKE`, frequency, `createdAt` date, `completedDates[]` ↔ `completions[].date`.
- `toApiHabit()` adds `completedToday` via `getDateKey()`, passing through the caller-supplied IANA timezone (threaded from the API layer, see HAB-64) — no implicit UTC.
- Exclude archived habits by default; expose a flag if a caller needs them.
- **Done when:** round-trip unit tests pass; category mapping is the only place conversion happens; `completedToday` is correct for a non-UTC timezone.

### HAB-62 — `habits-db.ts` user-scoped repository
**Depends on:** HAB-61 · **Files:** `src/lib/habits-db.ts` (+ tests)
- All functions take `userId`. `listHabits` returns **active (non-archived)** habits with completions. `createHabit`, `updateHabit`, `archiveHabit` (sets `archivedAt`, does **not** delete), `unarchiveHabit` (clears `archivedAt`), `applyCompletions`.
- Ownership via `where: { id, userId }`. `applyCompletions` verifies each `habitId` belongs to `userId` and respects the trackable-day window.
- **Done when:** unit tests cover isolation (User A can't touch User B), archive hides but preserves rows, unarchive restores a habit to the active list, completions only within window.

### HAB-63 — Refactor `habit-store.ts`
**Depends on:** HAB-62 · **Files:** `src/lib/habit-store.ts`
- Keep validation helpers (30-day window, `isDateTrackable`, allowed categories). Remove the in-memory array. Switch IDs from `Date.now()` to Prisma autoincrement.
- **Done when:** no in-memory habit state remains; validation helpers still exported and tested.

### HAB-64 — Secure habit APIs
**Depends on:** HAB-63, HAB-81 · **Files:** `src/app/api/habits/route.ts`, `src/app/api/habits/completions/route.ts`
- `getServerSession(authOptions)` first; no session → **401**. Cross-user/absent `habitId` → **404**.
- Read the client's IANA timezone from a request header (e.g. `X-Timezone`), validate it, and thread it into `habit-mapper`/`habits-db` calls; fall back to `UTC` only if the header is missing or invalid.
- **Persist it:** on every authenticated request, upsert the validated header value onto `User.timezone` (HAB-60) so the owner's most-recent timezone stays available for shared-view stat computation (HAB-68/71) even when the owner isn't the one making the request.
- Route delete action to `archiveHabit` (soft-delete). Preserve `{ success, ... }` response shape.
- **Done when:** 401/404 behaviors tested; a request with a non-UTC `X-Timezone` header produces correct `completedToday`/date-key behavior and updates `User.timezone`; pages/components unchanged.

### HAB-65 — `middleware.ts` route protection
**Depends on:** HAB-64 · **Files:** `src/middleware.ts`
- `withAuth`. Public: `/`, `/login`, `/api/auth/*`, static. Protected: `/dashboard`, `/tracker`, `/habits`, `/api/habits*`. Redirect to `/login?callbackUrl=<path>`.
- **Done when:** unauthenticated page → redirect; unauthenticated API → 401.

### HAB-66 — Home page for signed-in users
**Depends on:** HAB-64 · **Files:** `src/app/page.tsx`
- Redirect signed-in users to `/dashboard` (or a clear CTA).
- **Done when:** signed-in `/` lands on the app, not the marketing landing.

### HAB-82 — Un-archive habit + archived-habits view
**Depends on:** HAB-64 · **Files:** `src/lib/habits-db.ts`, `src/app/api/habits/route.ts` (or a new `/api/habits/[id]/unarchive` route), `src/app/habits/`
- `PRODUCT.md` calls archiving "reversible," but no other ticket builds a restore path. Add `unarchiveHabit(userId, habitId)` (clears `archivedAt`, ownership-checked like every other write).
- Add a minimal "Archived habits" view (tab/filter in `/habits`) listing the requester's own archived habits with a Restore action.
- **Done when:** archiving then un-archiving a habit brings it back into the active tracker with history intact; the archived list only shows the requester's own archived habits, never another user's.

**Phase 1 exit:** create → restart → habit persists; two users isolated; archive keeps history and is reversible via HAB-82; a non-UTC timezone produces correct day boundaries; unauth blocked.

---

# Phase 2 — Sharing by email invite

### HAB-67 — `HabitShare` schema + migration
**Depends on:** HAB-62 · **Files:** `prisma/schema.prisma`, migration
- Model per `ROADMAP.md`: `ownerId`, `invitedEmail`, `invitedUserId?`, `permission (VIEW|EDIT default VIEW)`, `status (PENDING|ACCEPTED|REVOKED)`, `createdAt`; `@@unique([ownerId, invitedEmail])`; indexes on `invitedEmail`, `invitedUserId`. Back-relations on `User`.
- Set explicit `onDelete` per relation: `owner` → `Cascade` (deleting the owner removes their shares, consistent with `Account`/`Session`); `invitedUser` → `SetNull` (deleting an invited user's account shouldn't delete the owner's share row, just detach it).
- Migration `add_habit_sharing`.
- **Done when:** migration clean; drift check passes; deleting a `User` who owns shares or who is an invited viewer doesn't hit an FK constraint error.

### HAB-68 — Shared access helper + extend reads
**Depends on:** HAB-67 · **Files:** `src/lib/habits-db.ts`, `src/lib/shares-db.ts`
- One helper: `canView(requesterId, ownerId)` = requester is owner OR holds an ACCEPTED share. Reads for a tracker go through it. **Writes stay owner-only.**
- `listHabitsForOwner(ownerId, requesterId)` guarded by the helper. **Must exclude `archivedAt`-set habits for both the owner and an accepted-share requester** — this guarantee belongs at the data layer, not only in the tracker UI (HAB-71), so a future caller of this function can't accidentally leak archived habits.
- **Shared-view stats use the owner's timezone, not the requester's.** Any date-key/stat computation for a shared tracker must read the owner's `User.timezone` (persisted by HAB-64) rather than the requesting viewer's `X-Timezone` header — this is what makes `PRODUCT.md`'s "shared views use the owner's day boundaries" rule actually true rather than aspirational. Fall back to `UTC` if the owner has never sent a timezone.
- **Done when:** owner sees own; accepted viewer sees owner's; non-invited → denied; archived habits are absent from `listHabitsForOwner`'s result for both owner and shared-viewer callers; a shared tracker's streak/rate numbers are identical regardless of the viewer's own timezone. Unit-tested.

### HAB-69 — `/api/shares` route
**Depends on:** HAB-68 · **Files:** `src/app/api/shares/route.ts` (+ tests)
- `GET` (my shares both directions), `POST` (invite by email → PENDING; link `invitedUserId` if the account exists), `PATCH` (accept → ACCEPTED), `DELETE` (revoke).
- **Re-invite is an upsert, not an insert:** if a `HabitShare` row already exists for `(ownerId, invitedEmail)` (e.g. previously REVOKED), `POST` reactivates it to `PENDING` instead of failing on the unique constraint or creating a duplicate.
- On sign-in / first fetch, resolve PENDING invites matching the user's email — **gated on `emailVerified` being set** on the signing-in account, so an unverified email can't claim someone else's pending share (pending-until-signup).
- **Done when:** invite-any-email, accept, revoke, re-invite-after-revoke (reactivation, not duplicate/error), and verified-email pending-activation paths tested; session-guarded.

### HAB-70 — Share UI (invite + manage)
**Depends on:** HAB-69 · **Files:** `src/app/share/…` or dialog in `src/app/habits/`
- Enter an email to invite; list outgoing shares with status; revoke. Show incoming pending invites with accept.
- **Done when:** owner can invite + revoke; invitee can accept, from the UI.

### HAB-71 — "Shared with me" read-only tracker view
**Depends on:** HAB-70 · **Files:** `src/app/tracker/`, `src/app/dashboard/`, `src/components/`
- Context switcher: "viewing <owner>". Show owner's whole tracker + dashboard stats read-only; hide/disable all edit controls when not owner. Archived habits stay hidden. Stats render using the owner's timezone (HAB-68), so streaks/rates match what the owner themselves would see.
- **Done when:** accepted viewer sees owner's tracker + streaks, cannot edit; owner's own view unchanged.

**Phase 2 exit:** invite → accept → view read-only; non-invited blocked; revoke removes access.

---

# Phase 3 — Insights (minimal)

### HAB-72 — Verify streaks + rates against decided rules
**Depends on:** HAB-71 · **Files:** `src/lib/habit-stats.ts` (+ tests)
- This is a **verification** ticket, not an implementation one — timezone-aware day keys themselves are built in HAB-81 (`src/lib/dates.ts`), not here. Encode the definitions as tests against the now-timezone-aware `dates.ts`: **today pending** (run through yesterday counts), **one miss resets to 0**, rate = completions ÷ trackable days.
- Confirm identical correctness for owner view and shared view, including the owner's-timezone rule for shared trackers (`PRODUCT.md`): a fixture where the owner and viewer are in different timezones should produce identical streak/rate numbers regardless of who's requesting.
- **Done when:** hand-checked fixtures pass for both views, including a non-UTC timezone case and a cross-timezone owner/viewer case; no new charts (out of scope).

---

# Phase 4 — Docs + local test coverage  *(HAB-73/74/75 run in parallel)*

> Dependencies loosened from HAB-71 to match `ROADMAP.md`'s own stated intent ("Phase 4 can start once Phase 2 is merged"): HAB-73 touches no code and has no real dependency; HAB-74/75 only need sharing to be invite/accept-usable (through HAB-70, the share invite+manage UI, which itself depends on the API/data-layer tickets HAB-67/68/69), not the separate "shared with me" tracker view (HAB-71).

### HAB-73 — README: OAuth + deploy guide
**Depends on:** — (no code dependency; can start anytime) · **Files:** `README.md`
- Google Console setup, `NEXTAUTH_SECRET`, local sign-in, prod env + redirect URIs, Testing vs Published consent screen.

### HAB-74 — DB-backed E2E + happy path
**Depends on:** HAB-70 · **Files:** `tests/e2e/…`, `src/app/api/test/reset`
- Replace in-memory reset with test-DB truncation against a dedicated test database/schema — not the dev/Accelerate DB.
- Add a second guard on `/api/test/reset`: require `NODE_ENV !== "production"` in addition to the existing `E2E_TEST === "1"` check, so a single misconfigured env var can't wipe production data.
- Add E2E: sign in → create → persist → invite → accept → view shared.
- **Done when:** reset only ever runs against the test DB; the endpoint 404s if either guard fails; happy-path E2E passes against a real Postgres.

### HAB-75 — Unit test backfill
**Depends on:** HAB-70 · **Files:** `tests/unit/…`
- `habits-db`, `habit-mapper`, sharing access helper, API session-guards. Note: round-trip/isolation tests for `habits-db`/`habit-mapper` are already required as part of HAB-61/62's own "Done when" — this ticket should focus on what's not already covered there (sharing helper, session-guards, cross-cutting regression coverage) rather than duplicating them.

---

# Phase 5 — CI/CD gate + post-push hardening (GitHub Actions)

### HAB-76 — Extend `ci.yml` for DB-backed tests  *(do early — PR 0)*
**Depends on:** — · **Files:** `.github/workflows/ci.yml`
- Add a Postgres service container; run `prisma migrate deploy` before tests; run Vitest + Playwright against the real DB. Cache deps/Prisma client. No `continue-on-error`.
- **Bypass Prisma Accelerate for CI:** the app's normal `DATABASE_URL` points at Accelerate, which is incompatible with a local Postgres service container. Point migrations and the Prisma client at `DIRECT_DATABASE_URL` for CI runs instead — this isn't just "add a container," it's a distinct config path from the app's normal runtime setup.
- **Open question to resolve, not assume:** `prisma/schema.prisma`'s `datasource db` block currently has no `url`/`directUrl` field at all — the app instead builds its Prisma client at runtime via `accelerateUrl` in `src/lib/prisma.ts`. `migrate.yml` already passes both `DATABASE_URL` and `DIRECT_DATABASE_URL` as env vars to `prisma migrate deploy`, which normally requires a schema-level `url`. Confirm whether this already works as-is (Prisma 7 behavior) or whether `datasource db` needs an explicit `url`/`directUrl` added — if the latter, that's a `prisma/schema.prisma` change this ticket must include, not assume away.
- **Done when:** CI runs fully against the service-container Postgres via the direct URL, with no dependency on the hosted Accelerate endpoint.

### HAB-77 — Branch protection + required checks
**Depends on:** HAB-76 · **Files:** repo settings (+ `docs/`)
- Protect `main`: require CI green, require review, require up-to-date branch. Document the setup.

### HAB-78 — `migrate.yml` drift check
**Depends on:** HAB-76, HAB-60, HAB-67 · **Files:** `.github/workflows/migrate.yml`
- Ensure `prisma migrate deploy` runs on merge/deploy (covers `add_habit_archive`, `add_habit_sharing`). Fail CI if `prisma migrate status` shows drift.
- Explicitly depends on HAB-60 and HAB-67, not just HAB-76: the migrations this ticket is meant to cover (`add_habit_archive`, `add_habit_sharing`) must exist before the drift check can meaningfully validate them — otherwise this could merge and pass trivially before either migration is written.

### HAB-79 — Supply-chain hardening
**Depends on:** HAB-76 · **Files:** `.github/`, repo settings
- Enable Dependabot (deps + actions), secret scanning / push protection, `npm audit` / dependency-review step. Pin third-party actions to SHA; set minimal `permissions:` per workflow.

### HAB-80 — Post-deploy smoke test
**Depends on:** HAB-76 · **Files:** `.github/workflows/…`
- Hit `/`, `/login`, and one authenticated route against the preview/prod deploy; fail the release if any is unhealthy.

**Phase 5 exit:** full DB-backed suite green on every PR; `main` protected; migrations + drift enforced; hardening active; deploy smoke-tested.

---

---

# Post-MVP backlog (not part of the Phase 1–5 gate)

Tickets here are real, scoped work but are **not required for the MVP's "Done when" checklists** in `ROADMAP.md` — don't block a phase exit on them, and don't parallelize them against a ticket that shares their files without checking the note below.

### HAB-84 — Convert dashboard/habits/tracker to Server-Component shell + Client-Component island
**Depends on:** HAB-65, HAB-71 · **Files:** `src/app/dashboard/page.tsx`, `src/app/habits/page.tsx`, `src/app/tracker/page.tsx`, `tests/component/pages/DashboardPage.test.tsx`, `tests/component/pages/HabitsPage.test.tsx`, `tests/component/pages/TrackerPage.test.tsx`

**Why:** all three pages are marked `"use client"` top-to-bottom and fetch their data via `useEffect` + `fetch("/api/habits")` after mount, instead of using the App Router's Server-Component default to fetch during render. This costs a client-side mount→fetch waterfall (vs. data-ready-at-first-paint), and duplicates the same `useState(loading)` + `useEffect`-fetch + spinner shape across all three files. It does **not** by itself fix route-level auth gating — that's `middleware.ts` (HAB-65), independent of rendering strategy.

**Do:**
- Sequence *after* HAB-65 (so the session-scoped `habits-db.ts` data layer exists to fetch from) and *after* HAB-71 (so the "shared with me" read-only view's final shape lands first — otherwise this ticket and HAB-71 fight over the same three files, and HAB-71 would have to redo this ticket's split).
- Each page becomes an `async` Server Component: read the session (or rely on `middleware.ts` having already redirected), fetch via `habits-db.ts` directly, pass the result as props.
- Extract the interactive body into a `"use client"` child component that receives initial data as props instead of fetching it itself:
  - `dashboard/page.tsx` — do this one first; it's read-only stats, no mutations, simplest case.
  - `habits/page.tsx` — the create/edit/delete form + toast state becomes the client island.
  - `tracker/page.tsx` — the completion grid + debounced optimistic-save logic (`gridRef`, `pendingUpdatesRef`, `saveTimerRef`) is irreducibly client-only; it moves into the island as-is, not "boilerplate" to eliminate.
- Rewrite the three component tests in the same PR: render the client-island component directly with props instead of mocking `fetch` + advancing fake timers through a `useEffect`. Playwright E2E specs (`tests/e2e/dashboard.spec.ts` etc.) assert on final rendered state, not the fetch mechanism, so they need no changes.
- If `middleware.ts` (HAB-65) already redirects unauthenticated requests for these routes, don't duplicate a second `getServerSession`-redirect inside the page — confirm the overlap before adding one.

**Done when:** all three pages fetch server-side with no client-visible loading spinner on first paint; the three component test files pass against the new prop-driven island components; `lint`/`type-check`/`test`/`build` green; no page-level auth check duplicates what `middleware.ts` already does.

---

## Handing a ticket to an agent — template

> **Ticket:** HAB-XX <title>
> **Context to read first:** `PRODUCT.md` (glossary), `ROADMAP.md` Phase N, `AGENTS.md`.
> **Do:** <scope from this file>. Stay within scope; note adjacent work, don't do it.
> **Definition of done:** matches `AGENTS.md` — lint/type-check/test/build pass, tests added, migration included if schema changed, PR green in CI.
