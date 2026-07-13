# HabitLab — Tickets

> Assignable units of work derived from `ROADMAP.md`. Every ticket assumes the definitions in `PRODUCT.md` and the rules in `AGENTS.md`.
> **Before starting any ticket:** read `PRODUCT.md` (glossary is authoritative), the ticket's phase in `ROADMAP.md`, and `AGENTS.md` (conventions + definition of done).

Phase 1 IDs below are **real Jira issues** (project `HAB` at `habit-lab.atlassian.net`) — created 2026-07-12. `Depends on` lists tickets that must merge first. Tickets with no shared `Depends on` and no overlapping files can be assigned to different agents in parallel.

---

## Assignment order (dependency view)

```
Phase 1  HAB-60 → HAB-61 ─────────────────────────┐
         HAB-62, HAB-63 → HAB-64 → HAB-65 ─→ HAB-66 → HAB-67 → HAB-68, HAB-69, HAB-70
                                        (HAB-66 also needs HAB-61 · HAB-67 also needs HAB-63)
Phase 2  (not yet in Jira)   HabitShare schema → Shared access helper → /api/shares → Share UI → Shared tracker view
Phase 3  (not yet in Jira)   Verify streaks + rates
Phase 4  (not yet in Jira)   README (no code dependency) ‖ DB-backed E2E: sharing flow ‖ Unit test backfill
Phase 5  (not yet in Jira)   Branch protection ; migrate.yml drift check (needs HAB-62 + Phase 2's HabitShare schema) ‖ Supply-chain hardening ‖ Post-deploy smoke test
```

**Contention files** (never assign two open tickets that both edit these): `prisma/schema.prisma`, `src/lib/habits-db.ts`, `src/lib/habit-mapper.ts`, `src/app/habits/` (`HAB-70` and Phase 2's "Share UI" ticket both touch this directory with no formal dependency edge between them — sequence or coordinate rather than parallelize).

> **Numbering history:** this series originally used a docs-only placeholder scheme (`HAB-60` through `HAB-82`, itself a renumbering of an even earlier `HAB-59`-based scheme — see git history on this file for that old note) that was never actually created in Jira. On 2026-07-12, Phase 1's tickets were created for real in Jira, plus two new tickets pulled forward from other phases (see below) — real Jira assigns IDs sequentially regardless of what a doc calls a ticket, so the real numbers (`HAB-60`–`HAB-70`) **do not match** the old placeholder numbers. Phase 1 below has been rewritten to use the real IDs. Phases 2–5 and the post-MVP backlog are **not yet created in Jira** — their old placeholder numbers (`HAB-67` onward) would now collide with real Phase 1 tickets, so those numeric IDs have been removed below; they'll get real numbers when actually filed.
>
> **2026-07-12 changes, on top of the renumbering:** two new tickets were added ahead of `HAB-60` (the first two real IDs): a **CI-connectable test database** (`HAB-60`) — a second, persistent Prisma Postgres project for CI, replacing the bare-container approach the old Phase 5 CI ticket assumed (that old ticket is now superseded, not just renumbered — see the Phase 5 section) — and a **DB-backed test reset** (`HAB-61`), pulling forward the Phase-1-reachable portion of the old `HAB-74` (DB-backed E2E). The sharing-flow E2E portion of old `HAB-74` still waits for Phase 2 and is called out there.

---

# Phase 1 — Persistence + security (critical path)

> Real Jira issues: [habit-lab.atlassian.net/browse/HAB-60](https://habit-lab.atlassian.net/browse/HAB-60) through `HAB-70`.

### HAB-60 — CI-connectable test database
**Depends on:** — (parallel with everything else; recommended to land first/concurrent with HAB-62 so its migration gets CI-validated) · **Files:** `.github/workflows/ci.yml`, `.github/workflows/migrate.yml` (awareness only — don't touch prod), repo secrets
- Provision a second, persistent Prisma Postgres project for testing (e.g. `habit-lab-test`) — account/infra step only Austin can do — and add its Accelerate + direct URLs as GitHub Actions secrets (`TEST_DATABASE_URL` / `TEST_DIRECT_DATABASE_URL`).
- Wire `ci.yml`'s `e2e` job (and `ci` once repository-layer tests need a real DB) to those secrets instead of today's inert placeholders.
- Add a `prisma migrate deploy` step against `TEST_DIRECT_DATABASE_URL` before tests run — doesn't exist in `ci.yml` today (only `migrate.yml` runs `migrate deploy`, against production, on push to `main`).
- No `src/lib/prisma.ts` changes needed — same `accelerateUrl` code path, different project.
- **Done when:** `ci.yml` runs `prisma migrate deploy` against the real test project and succeeds; a smoke check (create + read a row through the existing API) proves the connection is real.

### HAB-61 — DB-backed test reset
**Depends on:** HAB-60 (needs a real DB to truncate); must land no later than HAB-66 (the ticket that breaks the current in-memory reset) · **Files:** `src/app/api/test/reset/route.ts`, `tests/e2e/helpers.ts` if needed
- Replace `resetHabitsForTests()` (in-memory) with a real truncate against the test database (`Habit`, `HabitCompletion`, etc.).
- Require `NODE_ENV !== "production"` in addition to the existing `E2E_TEST === "1"` check, so one misconfigured env var can't wipe production.
- Scope note: the old `HAB-74` idea also covered "invite → accept → view shared" E2E — that needs Phase 2 sharing, which doesn't exist yet. This ticket covers only the Phase-1-reachable happy path (sign in → create → persist → archive/unarchive); the sharing-flow E2E is tracked separately under Phase 4, once sharing lands.
- **Done when:** reset only ever runs against the test project; the endpoint 404s if either guard fails; the Phase-1 happy-path E2E passes against the real test DB.

### HAB-62 — Schema: add habit `archivedAt`, user `timezone` + confirm completion model
**Depends on:** — (parallel with HAB-60/61) · **Files:** `prisma/schema.prisma`, migration
- Add nullable `archivedAt DateTime?` to `Habit` (soft-delete per `PRODUCT.md`).
- Add nullable `timezone String?` (IANA name, e.g. `America/Chicago`) to `User`. This is what lets a shared tracker compute "today" in the *owner's* timezone (`PRODUCT.md`) even when a different person is viewing it — see HAB-67 (persists it), Phase 2's shared-access/stats tickets (read it for shared-view stats).
- Confirm `HabitCompletion` models a **binary** done-day: one row per (habitId, date), `@@unique([habitId, date])`. No value field.
- Migration `add_habit_archive` (folds in the `User.timezone` column — same migration, low-risk additive change).
- **Done when:** migration applies cleanly (locally, and in CI via HAB-60's `migrate deploy` step); `prisma migrate status` clean; existing rows unaffected.

### HAB-63 — Timezone-aware date keys (`dates.ts`)
**Depends on:** — (parallel with HAB-62 — no shared files) · **Files:** `src/lib/dates.ts` (+ tests)
- `PRODUCT.md` requires local-timezone day boundaries, but `getDateKey()` currently uses `date.toISOString().slice(0,10)` — pure UTC, no timezone parameter anywhere in the file, and `formatDateRowLabel`/`isWeekendDateKey` parse dates in the *server's* local zone (a third, inconsistent zone).
- Add an IANA timezone parameter to every function: `getDateKey(date, timeZone)`, `getRollingDateKeys(days, timeZone)`, `isDateInRollingWindow`, `isDateTrackable`, `formatDateRowLabel`, `isWeekendDateKey`. Use `Intl.DateTimeFormat`-based formatting (or equivalent) instead of `toISOString()`/bare `Date` parsing.
- Default to `UTC` only as an explicit, documented fallback when no timezone is supplied — never silently.
- **Done when:** unit tests cover a non-UTC timezone crossing a UTC-day boundary (e.g. 9pm `America/Los_Angeles` is still "yesterday" in UTC but "today" locally); existing 30-day-window/streak tests still pass when called with an explicit timezone argument.

### HAB-64 — `habit-mapper.ts` (Prisma ↔ API shape)
**Depends on:** HAB-62, HAB-63 · **Files:** `src/lib/habit-mapper.ts` (+ tests)
- Bidirectional map: category kebab ↔ `SCREAMING_SNAKE`, frequency, `createdAt` date, `completedDates[]` ↔ `completions[].date`.
- `toApiHabit()` adds `completedToday` via `getDateKey()`, passing through the caller-supplied IANA timezone (threaded from the API layer, see HAB-67) — no implicit UTC.
- Exclude archived habits by default; expose a flag if a caller needs them.
- **Done when:** round-trip unit tests pass; category mapping is the only place conversion happens; `completedToday` is correct for a non-UTC timezone.

### HAB-65 — `habits-db.ts` user-scoped repository
**Depends on:** HAB-64 · **Files:** `src/lib/habits-db.ts` (+ tests)
- All functions take `userId`. `listHabits` returns **active (non-archived)** habits with completions. `createHabit`, `updateHabit`, `archiveHabit` (sets `archivedAt`, does **not** delete), `unarchiveHabit` (clears `archivedAt`), `applyCompletions`.
- Ownership via `where: { id, userId }`. `applyCompletions` verifies each `habitId` belongs to `userId` and respects the trackable-day window.
- **Done when:** unit tests cover isolation (User A can't touch User B), archive hides but preserves rows, unarchive restores a habit to the active list, completions only within window.

### HAB-66 — Refactor `habit-store.ts`
**Depends on:** HAB-65, HAB-61 (must land no later than this) · **Files:** `src/lib/habit-store.ts`
- Keep validation helpers (30-day window, `isDateTrackable`, allowed categories). Remove the in-memory array. Switch IDs from `Date.now()` to Prisma autoincrement.
- **Done when:** no in-memory habit state remains; validation helpers still exported and tested; E2E suite still runs (HAB-61 already replaced the reset endpoint, so this shouldn't be a surprise by the time this ticket lands).

### HAB-67 — Secure habit APIs
**Depends on:** HAB-66, HAB-63 · **Files:** `src/app/api/habits/route.ts`, `src/app/api/habits/completions/route.ts`
- `getServerSession(authOptions)` first; no session → **401**. Cross-user/absent `habitId` → **404**.
- Read the client's IANA timezone from a request header (e.g. `X-Timezone`), validate it, and thread it into `habit-mapper`/`habits-db` calls; fall back to `UTC` only if the header is missing or invalid.
- **Persist it:** on every authenticated request, upsert the validated header value onto `User.timezone` (HAB-62) so the owner's most-recent timezone stays available for shared-view stat computation (Phase 2) even when the owner isn't the one making the request.
- Route delete action to `archiveHabit` (soft-delete). Preserve `{ success, ... }` response shape.
- **Done when:** 401/404 behaviors tested; a request with a non-UTC `X-Timezone` header produces correct `completedToday`/date-key behavior and updates `User.timezone`; pages/components unchanged.

### HAB-68 — `src/proxy.ts` route protection (corrected from `middleware.ts`)
**Depends on:** HAB-67 · **Files:** `src/proxy.ts`
- **File target corrected:** Next.js 16 deprecates `middleware.ts`/`middleware()` in favor of `proxy.ts`/`proxy()` — confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Read that doc (and the `version-16.md` migration note) before writing anything — this is exactly the training-data mismatch `AGENTS.md`'s header warns about.
- Public: `/`, `/login`, `/api/auth/*`, static. Protected: `/dashboard`, `/tracker`, `/habits`, `/api/habits*`. Redirect to `/login?callbackUrl=<path>`.
- **Done when:** unauthenticated page → redirect; unauthenticated API → 401.

### HAB-69 — Home page for signed-in users
**Depends on:** HAB-67 · **Files:** `src/app/page.tsx`
- Redirect signed-in users to `/dashboard` (or a clear CTA).
- **Done when:** signed-in `/` lands on the app, not the marketing landing.

### HAB-70 — Un-archive habit + archived-habits view
**Depends on:** HAB-67 · **Files:** `src/lib/habits-db.ts`, `src/app/api/habits/route.ts` (or a new `/api/habits/[id]/unarchive` route), `src/app/habits/`
- `PRODUCT.md` calls archiving "reversible," but no other ticket builds a restore path. Add `unarchiveHabit(userId, habitId)` (clears `archivedAt`, ownership-checked like every other write).
- Add a minimal "Archived habits" view (tab/filter in `/habits`) listing the requester's own archived habits with a Restore action.
- **Done when:** archiving then un-archiving a habit brings it back into the active tracker with history intact; the archived list only shows the requester's own archived habits, never another user's.

**Phase 1 exit:** create → restart → habit persists; two users isolated; archive keeps history and is reversible via HAB-70; a non-UTC timezone produces correct day boundaries; unauth blocked — and every ticket's own branch/PR shows green `ci` + `e2e` CI runs, not just locally passing.

---

# Phase 2 — Sharing by email invite

> **Not yet created in Jira.** These tickets used to be numbered `HAB-67`–`HAB-71` in this file, but those numbers are now real Phase 1 Jira issues (see the numbering note above) — using descriptive IDs (`P2.1` etc.) here instead of asserting a future Jira number that may not match once these are actually filed.

### P2.1 — `HabitShare` schema + migration
**Depends on:** HAB-65 (habits-db.ts) · **Files:** `prisma/schema.prisma`, migration
- Model per `ROADMAP.md`: `ownerId`, `invitedEmail`, `invitedUserId?`, `permission (VIEW|EDIT default VIEW)`, `status (PENDING|ACCEPTED|REVOKED)`, `createdAt`; `@@unique([ownerId, invitedEmail])`; indexes on `invitedEmail`, `invitedUserId`. Back-relations on `User`.
- Set explicit `onDelete` per relation: `owner` → `Cascade` (deleting the owner removes their shares, consistent with `Account`/`Session`); `invitedUser` → `SetNull` (deleting an invited user's account shouldn't delete the owner's share row, just detach it).
- Migration `add_habit_sharing`.
- **Done when:** migration clean; drift check passes; deleting a `User` who owns shares or who is an invited viewer doesn't hit an FK constraint error.

### P2.2 — Shared access helper + extend reads
**Depends on:** P2.1 · **Files:** `src/lib/habits-db.ts`, `src/lib/shares-db.ts`
- One helper: `canView(requesterId, ownerId)` = requester is owner OR holds an ACCEPTED share. Reads for a tracker go through it. **Writes stay owner-only.**
- `listHabitsForOwner(ownerId, requesterId)` guarded by the helper. **Must exclude `archivedAt`-set habits for both the owner and an accepted-share requester** — this guarantee belongs at the data layer, not only in the tracker UI (P2.5), so a future caller of this function can't accidentally leak archived habits.
- **Shared-view stats use the owner's timezone, not the requester's.** Any date-key/stat computation for a shared tracker must read the owner's `User.timezone` (persisted by HAB-67, Secure habit APIs) rather than the requesting viewer's `X-Timezone` header — this is what makes `PRODUCT.md`'s "shared views use the owner's day boundaries" rule actually true rather than aspirational. Fall back to `UTC` if the owner has never sent a timezone.
- **Done when:** owner sees own; accepted viewer sees owner's; non-invited → denied; archived habits are absent from `listHabitsForOwner`'s result for both owner and shared-viewer callers; a shared tracker's streak/rate numbers are identical regardless of the viewer's own timezone. Unit-tested.

### P2.3 — `/api/shares` route
**Depends on:** P2.2 · **Files:** `src/app/api/shares/route.ts` (+ tests)
- `GET` (my shares both directions), `POST` (invite by email → PENDING; link `invitedUserId` if the account exists), `PATCH` (accept → ACCEPTED), `DELETE` (revoke).
- **Re-invite is an upsert, not an insert:** if a `HabitShare` row already exists for `(ownerId, invitedEmail)` (e.g. previously REVOKED), `POST` reactivates it to `PENDING` instead of failing on the unique constraint or creating a duplicate.
- On sign-in / first fetch, resolve PENDING invites matching the user's email — **gated on `emailVerified` being set** on the signing-in account, so an unverified email can't claim someone else's pending share (pending-until-signup).
- **Done when:** invite-any-email, accept, revoke, re-invite-after-revoke (reactivation, not duplicate/error), and verified-email pending-activation paths tested; session-guarded.

### P2.4 — Share UI (invite + manage)
**Depends on:** P2.3 · **Files:** `src/app/share/…` or dialog in `src/app/habits/`
- Enter an email to invite; list outgoing shares with status; revoke. Show incoming pending invites with accept.
- **Done when:** owner can invite + revoke; invitee can accept, from the UI.

### P2.5 — "Shared with me" read-only tracker view
**Depends on:** P2.4 · **Files:** `src/app/tracker/`, `src/app/dashboard/`, `src/components/`
- Context switcher: "viewing <owner>". Show owner's whole tracker + dashboard stats read-only; hide/disable all edit controls when not owner. Archived habits stay hidden. Stats render using the owner's timezone (P2.2), so streaks/rates match what the owner themselves would see.
- **Done when:** accepted viewer sees owner's tracker + streaks, cannot edit; owner's own view unchanged.

**Phase 2 exit:** invite → accept → view read-only; non-invited blocked; revoke removes access.

---

# Phase 3 — Insights (minimal)

> **Not yet created in Jira** — descriptive ID (`P3.1`), see the Phase 2 note above for why.

### P3.1 — Verify streaks + rates against decided rules
**Depends on:** P2.5 · **Files:** `src/lib/habit-stats.ts` (+ tests)
- This is a **verification** ticket, not an implementation one — timezone-aware day keys themselves are built in HAB-63 (`src/lib/dates.ts`), not here. Encode the definitions as tests against the now-timezone-aware `dates.ts`: **today pending** (run through yesterday counts), **one miss resets to 0**, rate = completions ÷ trackable days.
- Confirm identical correctness for owner view and shared view, including the owner's-timezone rule for shared trackers (`PRODUCT.md`): a fixture where the owner and viewer are in different timezones should produce identical streak/rate numbers regardless of who's requesting.
- **Done when:** hand-checked fixtures pass for both views, including a non-UTC timezone case and a cross-timezone owner/viewer case; no new charts (out of scope).

---

# Phase 4 — Docs + local test coverage  *(P4.1/P4.2/P4.3 run in parallel)*

> **Not yet created in Jira** — descriptive IDs (`P4.1` etc.), see the Phase 2 note above for why. Dependencies loosened from the old "P2.5-equivalent" to match `ROADMAP.md`'s own stated intent ("Phase 4 can start once Phase 2 is merged"): `P4.1` touches no code and has no real dependency; `P4.2`/`P4.3` only need sharing to be invite/accept-usable (through `P2.4`, the share invite+manage UI, which itself depends on the API/data-layer tickets `P2.1`/`P2.2`/`P2.3`), not the separate "shared with me" tracker view (`P2.5`).

### P4.1 — README: OAuth + deploy guide
**Depends on:** — (no code dependency; can start anytime) · **Files:** `README.md`
- Google Console setup, `NEXTAUTH_SECRET`, local sign-in, prod env + redirect URIs, Testing vs Published consent screen.

### P4.2 — DB-backed E2E: sharing flow
**Depends on:** P2.4 · **Files:** `tests/e2e/…`
- The Phase-1-reachable portion of this (test-DB truncation, the `NODE_ENV`/`E2E_TEST` double guard, sign in → create → persist → archive/unarchive) already shipped as **HAB-61**. This ticket is only the remaining sharing-flow E2E that HAB-61 explicitly deferred: invite → accept → view shared.
- **Done when:** the sharing-flow E2E passes against the real test DB alongside the Phase-1 happy-path E2E from HAB-61.

### P4.3 — Unit test backfill
**Depends on:** P2.4 · **Files:** `tests/unit/…`
- Sharing access helper (`P2.2`), API session-guards for `/api/shares` (`P2.3`). Note: round-trip/isolation tests for `habits-db`/`habit-mapper` are already required as part of HAB-64/65's own "Done when" — this ticket should focus on what's not already covered there rather than duplicating them.

---

# Phase 5 — CI/CD gate + post-push hardening (GitHub Actions)

> **Not yet created in Jira** — descriptive IDs (`P5.1` etc.), see the Phase 2 note above for why.

### ~~Extend `ci.yml` for DB-backed tests~~ — superseded by HAB-60
This used to be the first Phase 5 ticket (a bare Postgres service container in `ci.yml`). **Superseded, not merely renumbered:** `HAB-60` (CI-connectable test database, pulled forward into Phase 1 on 2026-07-12) already solves this via a second, persistent Prisma Postgres project instead of a service container — no `src/lib/prisma.ts`/`accelerateUrl` rewrite needed, unlike the container approach this ticket originally assumed. Don't implement a separate container; treat this entry as closed once HAB-60 lands.

### P5.1 — Branch protection + required checks
**Depends on:** HAB-60 · **Files:** repo settings (+ `docs/`)
- Protect `main`: require CI green, require review, require up-to-date branch. Document the setup.

### P5.2 — `migrate.yml` drift check
**Depends on:** HAB-60, HAB-62, P2.1 · **Files:** `.github/workflows/migrate.yml`
- Ensure `prisma migrate deploy` runs on merge/deploy (covers `add_habit_archive`, `add_habit_sharing`). Fail CI if `prisma migrate status` shows drift. Note: HAB-60 already added a `migrate deploy` step to `ci.yml` for the test DB — confirm this ticket isn't duplicating that; its scope is the deploy-time drift check, not another test-time migration run.
- Explicitly depends on HAB-62 and `P2.1`, not just HAB-60: the migrations this ticket is meant to cover (`add_habit_archive`, `add_habit_sharing`) must exist before the drift check can meaningfully validate them — otherwise this could merge and pass trivially before either migration is written.

### P5.3 — Supply-chain hardening
**Depends on:** HAB-60 · **Files:** `.github/`, repo settings
- Enable Dependabot (deps + actions), secret scanning / push protection, `npm audit` / dependency-review step. Pin third-party actions to SHA; set minimal `permissions:` per workflow.

### P5.4 — Post-deploy smoke test
**Depends on:** HAB-60 · **Files:** `.github/workflows/…`
- Hit `/`, `/login`, and one authenticated route against the preview/prod deploy; fail the release if any is unhealthy.

**Phase 5 exit:** full DB-backed suite green on every PR; `main` protected; migrations + drift enforced; hardening active; deploy smoke-tested.

---

---

# Post-MVP backlog (not part of the Phase 1–5 gate)

Tickets here are real, scoped work but are **not required for the MVP's "Done when" checklists** in `ROADMAP.md` — don't block a phase exit on them, and don't parallelize them against a ticket that shares their files without checking the note below.

### PM.1 — Convert dashboard/habits/tracker to Server-Component shell + Client-Component island
*(Not yet created in Jira — descriptive ID, see the Phase 2 note above for why.)*
**Depends on:** HAB-68 (`src/proxy.ts`), P2.5 (shared tracker view) · **Files:** `src/app/dashboard/page.tsx`, `src/app/habits/page.tsx`, `src/app/tracker/page.tsx`, `tests/component/pages/DashboardPage.test.tsx`, `tests/component/pages/HabitsPage.test.tsx`, `tests/component/pages/TrackerPage.test.tsx`

**Why:** all three pages are marked `"use client"` top-to-bottom and fetch their data via `useEffect` + `fetch("/api/habits")` after mount, instead of using the App Router's Server-Component default to fetch during render. This costs a client-side mount→fetch waterfall (vs. data-ready-at-first-paint), and duplicates the same `useState(loading)` + `useEffect`-fetch + spinner shape across all three files. It does **not** by itself fix route-level auth gating — that's `src/proxy.ts` (HAB-68), independent of rendering strategy.

**Do:**
- Sequence *after* HAB-68 (so the session-scoped `habits-db.ts` data layer exists to fetch from) and *after* P2.5 (so the "shared with me" read-only view's final shape lands first — otherwise this ticket and P2.5 fight over the same three files, and P2.5 would have to redo this ticket's split).
- Each page becomes an `async` Server Component: read the session (or rely on `src/proxy.ts` having already redirected), fetch via `habits-db.ts` directly, pass the result as props.
- Extract the interactive body into a `"use client"` child component that receives initial data as props instead of fetching it itself:
  - `dashboard/page.tsx` — do this one first; it's read-only stats, no mutations, simplest case.
  - `habits/page.tsx` — the create/edit/delete form + toast state becomes the client island.
  - `tracker/page.tsx` — the completion grid + debounced optimistic-save logic (`gridRef`, `pendingUpdatesRef`, `saveTimerRef`) is irreducibly client-only; it moves into the island as-is, not "boilerplate" to eliminate.
- Rewrite the three component tests in the same PR: render the client-island component directly with props instead of mocking `fetch` + advancing fake timers through a `useEffect`. Playwright E2E specs (`tests/e2e/dashboard.spec.ts` etc.) assert on final rendered state, not the fetch mechanism, so they need no changes.
- If `src/proxy.ts` (HAB-68) already redirects unauthenticated requests for these routes, don't duplicate a second `getServerSession`-redirect inside the page — confirm the overlap before adding one.

**Done when:** all three pages fetch server-side with no client-visible loading spinner on first paint; the three component test files pass against the new prop-driven island components; `lint`/`type-check`/`test`/`build` green; no page-level auth check duplicates what `src/proxy.ts` already does.

---

## Handing a ticket to an agent — template

> **Ticket:** HAB-XX <title>
> **Context to read first:** `PRODUCT.md` (glossary), `ROADMAP.md` Phase N, `AGENTS.md`.
> **Do:** <scope from this file>. Stay within scope; note adjacent work, don't do it.
> **Definition of done:** matches `AGENTS.md` — lint/type-check/test/build pass, tests added, migration included if schema changed, PR green in CI.
