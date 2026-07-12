# HabitLab — Tickets

> Assignable units of work derived from `ROADMAP.md`. Every ticket assumes the definitions in `PRODUCT.md` and the rules in `AGENTS.md`.
> **Before starting any ticket:** read `PRODUCT.md` (glossary is authoritative), the ticket's phase in `ROADMAP.md`, and `AGENTS.md` (conventions + definition of done).

IDs continue the existing HAB- series. `Depends on` lists tickets that must merge first. Tickets with no shared `Depends on` and no overlapping files can be assigned to different agents in parallel.

---

## Assignment order (dependency view)

```
Phase 1  HAB-59 → HAB-60 → HAB-61 → HAB-62 → HAB-63 → HAB-64, HAB-65
Phase 2                                   └→ HAB-66 → HAB-67 → HAB-68 → HAB-69, HAB-70
Phase 3                                                                     └→ HAB-71
Phase 4  (after HAB-70)  HAB-72 ‖ HAB-73 ‖ HAB-74
Phase 5  HAB-75 (early) → HAB-76 ;  HAB-77 ‖ HAB-78 ‖ HAB-79
```

**Contention files** (never assign two open tickets that both edit these): `prisma/schema.prisma`, `src/lib/habits-db.ts`, `src/lib/habit-mapper.ts`.

---

# Phase 1 — Persistence + security (critical path)

### HAB-59 — Schema: add habit `archivedAt` + confirm completion model
**Depends on:** — · **Files:** `prisma/schema.prisma`, migration
- Add nullable `archivedAt DateTime?` to `Habit` (soft-delete per `PRODUCT.md`).
- Confirm `HabitCompletion` models a **binary** done-day: one row per (habitId, date), `@@unique([habitId, date])`. No value field.
- Migration `add_habit_archive`.
- **Done when:** migration applies cleanly; `prisma migrate status` clean; existing rows unaffected.

### HAB-60 — `habit-mapper.ts` (Prisma ↔ API shape)
**Depends on:** HAB-59 · **Files:** `src/lib/habit-mapper.ts` (+ tests)
- Bidirectional map: category kebab ↔ `SCREAMING_SNAKE`, frequency, `createdAt` date, `completedDates[]` ↔ `completions[].date`.
- `toApiHabit()` adds `completedToday` via `getDateKey()` in the user's timezone.
- Exclude archived habits by default; expose a flag if a caller needs them.
- **Done when:** round-trip unit tests pass; category mapping is the only place conversion happens.

### HAB-61 — `habits-db.ts` user-scoped repository
**Depends on:** HAB-60 · **Files:** `src/lib/habits-db.ts` (+ tests)
- All functions take `userId`. `listHabits` returns **active (non-archived)** habits with completions. `createHabit`, `updateHabit`, `archiveHabit` (sets `archivedAt`, does **not** delete), `applyCompletions`.
- Ownership via `where: { id, userId }`. `applyCompletions` verifies each `habitId` belongs to `userId` and respects the trackable-day window.
- **Done when:** unit tests cover isolation (User A can't touch User B), archive hides but preserves rows, completions only within window.

### HAB-62 — Refactor `habit-store.ts`
**Depends on:** HAB-61 · **Files:** `src/lib/habit-store.ts`
- Keep validation helpers (30-day window, `isDateTrackable`, allowed categories). Remove the in-memory array. Switch IDs from `Date.now()` to Prisma autoincrement.
- **Done when:** no in-memory habit state remains; validation helpers still exported and tested.

### HAB-63 — Secure habit APIs
**Depends on:** HAB-62 · **Files:** `src/app/api/habits/route.ts`, `src/app/api/habits/completions/route.ts`
- `getServerSession(authOptions)` first; no session → **401**. Cross-user/absent `habitId` → **404**.
- Route delete action to `archiveHabit` (soft-delete). Preserve `{ success, ... }` response shape.
- **Done when:** 401/404 behaviors tested; pages/components unchanged.

### HAB-64 — `middleware.ts` route protection
**Depends on:** HAB-63 · **Files:** `src/middleware.ts`
- `withAuth`. Public: `/`, `/login`, `/api/auth/*`, static. Protected: `/dashboard`, `/tracker`, `/habits`, `/api/habits*`. Redirect to `/login?callbackUrl=<path>`.
- **Done when:** unauthenticated page → redirect; unauthenticated API → 401.

### HAB-65 — Home page for signed-in users
**Depends on:** HAB-63 · **Files:** `src/app/page.tsx`
- Redirect signed-in users to `/dashboard` (or a clear CTA).
- **Done when:** signed-in `/` lands on the app, not the marketing landing.

**Phase 1 exit:** create → restart → habit persists; two users isolated; archive keeps history; unauth blocked.

---

# Phase 2 — Sharing by email invite

### HAB-66 — `HabitShare` schema + migration
**Depends on:** HAB-61 · **Files:** `prisma/schema.prisma`, migration
- Model per `ROADMAP.md`: `ownerId`, `invitedEmail`, `invitedUserId?`, `permission (VIEW|EDIT default VIEW)`, `status (PENDING|ACCEPTED|REVOKED)`, `createdAt`; `@@unique([ownerId, invitedEmail])`; indexes on `invitedEmail`, `invitedUserId`. Back-relations on `User`.
- Migration `add_habit_sharing`.
- **Done when:** migration clean; drift check passes.

### HAB-67 — Shared access helper + extend reads
**Depends on:** HAB-66 · **Files:** `src/lib/habits-db.ts`, `src/lib/shares-db.ts`
- One helper: `canView(requesterId, ownerId)` = requester is owner OR holds an ACCEPTED share. Reads for a tracker go through it. **Writes stay owner-only.**
- `listHabitsForOwner(ownerId, requesterId)` guarded by the helper.
- **Done when:** owner sees own; accepted viewer sees owner's; non-invited → denied. Unit-tested.

### HAB-68 — `/api/shares` route
**Depends on:** HAB-67 · **Files:** `src/app/api/shares/route.ts` (+ tests)
- `GET` (my shares both directions), `POST` (invite by email → PENDING; link `invitedUserId` if the account exists), `PATCH` (accept → ACCEPTED), `DELETE` (revoke).
- On sign-in / first fetch, resolve PENDING invites matching the user's email (pending-until-signup).
- **Done when:** invite-any-email, accept, revoke, and pending-activation paths tested; session-guarded.

### HAB-69 — Share UI (invite + manage)
**Depends on:** HAB-68 · **Files:** `src/app/share/…` or dialog in `src/app/habits/`
- Enter an email to invite; list outgoing shares with status; revoke. Show incoming pending invites with accept.
- **Done when:** owner can invite + revoke; invitee can accept, from the UI.

### HAB-70 — "Shared with me" read-only tracker view
**Depends on:** HAB-69 · **Files:** `src/app/tracker/`, `src/app/dashboard/`, `src/components/`
- Context switcher: "viewing <owner>". Show owner's whole tracker + dashboard stats read-only; hide/disable all edit controls when not owner. Archived habits stay hidden.
- **Done when:** accepted viewer sees owner's tracker + streaks, cannot edit; owner's own view unchanged.

**Phase 2 exit:** invite → accept → view read-only; non-invited blocked; revoke removes access.

---

# Phase 3 — Insights (minimal)

### HAB-71 — Verify streaks + rates against decided rules
**Depends on:** HAB-70 · **Files:** `src/lib/habit-stats.ts` (+ tests)
- Encode the definitions as tests: **today pending** (run through yesterday counts), **one miss resets to 0**, timezone-aware day keys, rate = completions ÷ trackable days.
- Confirm identical correctness for owner view and shared view.
- **Done when:** hand-checked fixtures pass for both views; no new charts (out of scope).

---

# Phase 4 — Docs + local test coverage  *(HAB-72/73/74 run in parallel)*

### HAB-72 — README: OAuth + deploy guide
**Depends on:** HAB-70 · **Files:** `README.md`
- Google Console setup, `NEXTAUTH_SECRET`, local sign-in, prod env + redirect URIs, Testing vs Published consent screen.

### HAB-73 — DB-backed E2E + happy path
**Depends on:** HAB-70 · **Files:** `tests/e2e/…`, `src/app/api/test/reset`
- Replace in-memory reset with test-DB truncation. Add E2E: sign in → create → persist → invite → accept → view shared.

### HAB-74 — Unit test backfill
**Depends on:** HAB-70 · **Files:** `tests/unit/…`
- `habits-db`, `habit-mapper`, sharing access helper, API session-guards.

---

# Phase 5 — CI/CD gate + post-push hardening (GitHub Actions)

### HAB-75 — Extend `ci.yml` for DB-backed tests  *(do early — PR 0)*
**Depends on:** — · **Files:** `.github/workflows/ci.yml`
- Add a Postgres service container; run `prisma migrate deploy` before tests; run Vitest + Playwright against the real DB. Cache deps/Prisma client. No `continue-on-error`.

### HAB-76 — Branch protection + required checks
**Depends on:** HAB-75 · **Files:** repo settings (+ `docs/`)
- Protect `main`: require CI green, require review, require up-to-date branch. Document the setup.

### HAB-77 — `migrate.yml` drift check
**Depends on:** HAB-75 · **Files:** `.github/workflows/migrate.yml`
- Ensure `prisma migrate deploy` runs on merge/deploy (covers `add_habit_archive`, `add_habit_sharing`). Fail CI if `prisma migrate status` shows drift.

### HAB-78 — Supply-chain hardening
**Depends on:** HAB-75 · **Files:** `.github/`, repo settings
- Enable Dependabot (deps + actions), secret scanning / push protection, `npm audit` / dependency-review step. Pin third-party actions to SHA; set minimal `permissions:` per workflow.

### HAB-79 — Post-deploy smoke test
**Depends on:** HAB-75 · **Files:** `.github/workflows/…`
- Hit `/`, `/login`, and one authenticated route against the preview/prod deploy; fail the release if any is unhealthy.

**Phase 5 exit:** full DB-backed suite green on every PR; `main` protected; migrations + drift enforced; hardening active; deploy smoke-tested.

---

## Handing a ticket to an agent — template

> **Ticket:** HAB-XX <title>
> **Context to read first:** `PRODUCT.md` (glossary), `ROADMAP.md` Phase N, `AGENTS.md`.
> **Do:** <scope from this file>. Stay within scope; note adjacent work, don't do it.
> **Definition of done:** matches `AGENTS.md` — lint/type-check/test/build pass, tests added, migration included if schema changed, PR green in CI.
