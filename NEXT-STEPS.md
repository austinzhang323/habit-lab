# HabitLab — Next Steps

> Bridges `HANDOFF.md` (ticket/build state), `LEARNING.md` (Austin's tour), and the subagents in `.claude/agents/` into one handoff document. This file is written to be given to a fresh agent session directly — read the next section first if that's you.

**Confirmed against repo state (2026-07-12):** no HAB-60+ ticket commits exist yet (`git log` still ends at HAB-56/HAB-83 docs/CI fixes); `prisma/schema.prisma` has no `archivedAt`/`timezone` fields; `tests/unit/lib/dates.test.ts` doesn't exist yet. 13 subagents are installed in `.claude/agents/` (see the lookup table below). `ROADMAP.md`/`TICKETS.md` now also include a **post-MVP backlog** section with `HAB-84` (Server-Component conversion) — not part of the Phase 1–5 gate, sequenced separately below. Nothing below assumes progress that hasn't actually happened.

---

## If you're a fresh agent session starting from this file

Read `HANDOFF.md`, `AGENTS.md`, `PRODUCT.md`, and `ROADMAP.md`/`TICKETS.md` first — this file assumes that context and doesn't repeat it. Then follow these rules for how to actually execute the work:

1. **Delegate to subagents, don't do everything in the main thread.** 13 subagents live in `.claude/agents/`, each mapped to specific tickets in the lookup table below. Spin up the relevant subagent(s) for a ticket (schema/API design → `backend-architect`/`database-optimizer`; auth/sharing → `security-engineer`; UI → `frontend-developer`; every ticket → `minimal-change-engineer` for diff discipline and `code-reviewer` before calling it done).
2. **Work one phase at a time — this is a hard stop, not a suggestion.** Phase 1 is a strict dependency chain (see below); its tickets can be worked through in sequence, and HAB-60/HAB-81 can run in parallel with each other since they share no files. Once every ticket in a phase meets its "Done when" criteria and the phase's exit criteria (stated at the end of each phase section) are met, **stop and report back to Austin.** Do not automatically continue into the next phase's tickets. Wait for his explicit go-ahead before starting Phase 2, Phase 3, etc.
3. **Within a phase, per-ticket collaboration still applies exactly as `HANDOFF.md` describes** — this is additive to the phase-level stop, not a replacement for it. Don't silently implement a full ticket end-to-end and hand back a finished PR; check in, explain what you're doing and why, leave room for Austin to type some of it himself. The phase boundary is an extra, stricter checkpoint on top of that per-ticket style — it exists so a whole phase's worth of tickets never lands without Austin having seen and approved the phase that came before it.
4. **Respect the contention-file rules in `TICKETS.md`** — never run two tickets in parallel that both touch `prisma/schema.prisma`, `src/lib/habits-db.ts`, `src/lib/habit-mapper.ts`, or (between HAB-70/HAB-82) `src/app/habits/`.
5. **`minimal-change-engineer` and `code-reviewer` apply to every ticket**, not just the ones listed for them below — treat them as standing discipline/quality gates, not ticket-specific specialists.

## Ticket → subagent lookup

| Ticket | Subagent(s) to use |
|---|---|
| HAB-60 (schema) | `backend-architect`, `database-optimizer` |
| HAB-81 (timezone dates.ts) | `test-engineer` |
| HAB-61 (habit-mapper) | `test-engineer`, `code-reviewer` |
| HAB-62 (habits-db.ts) | `database-optimizer`, `test-engineer` |
| HAB-63 (refactor habit-store) | `minimal-change-engineer` |
| HAB-64 (secure APIs) | `security-engineer`, `api-tester` |
| HAB-65 (middleware) | `security-engineer` |
| HAB-66 (home redirect) | `frontend-developer` |
| HAB-82 (unarchive + view) | `frontend-developer`, `accessibility-auditor` |
| HAB-67 (HabitShare schema) | `backend-architect`, `database-optimizer` |
| HAB-68 (canView helper) | `security-engineer`, `test-engineer` |
| HAB-69 (/api/shares) | `security-engineer`, `api-tester` |
| HAB-70 (share UI) | `frontend-developer`, `accessibility-auditor` |
| HAB-71 (shared tracker view) | `frontend-developer`, `accessibility-auditor` |
| HAB-72 (verify stats) | `test-engineer` |
| HAB-73 (README) | `technical-writer` |
| HAB-74 (DB-backed E2E) | `api-tester`, `test-engineer` |
| HAB-75 (unit backfill) | `test-engineer` |
| HAB-76 (CI Postgres) | `devops-automator` |
| HAB-77 (branch protection) | `git-workflow-master` |
| HAB-78 (drift check) | `devops-automator` |
| HAB-79 (supply-chain) | `security-engineer`, `devops-automator` |
| HAB-80 (smoke test) | `devops-automator` |
| HAB-84 (Server-Component conversion, post-MVP) | `frontend-developer`, `test-engineer` |
| Every ticket | `minimal-change-engineer` (diff discipline), `code-reviewer` (pre-merge) |

---

## Right now: finish the LEARNING.md tour, then start HAB-60

Two loose ends from `LEARNING.md` before the first real ticket:

1. Do the `isValidDateKeyFormat` exercise (Part 1) — add the function to `src/lib/dates.ts`, create `tests/unit/lib/dates.test.ts`, run `npm run test`. Small, safe, no ticket conflict.
2. Finish the Part 4 checklist skim (`Providers.tsx` → `habit-mapper.ts` isn't listed but everything through `prisma/schema.prisma` skim is) if any boxes are still unchecked.

Then open `prisma/schema.prisma` together for HAB-60, as `LEARNING.md` Part 5 already sets up.

---

## Phase 1 sequence (build ↔ learn pairing)

**HAB-60 — schema: `Habit.archivedAt`, `User.timezone`**
Depends on nothing. Build: two nullable fields + one migration. Learn: Prisma schema syntax (`?`, `@default`), and `npx prisma migrate dev` — the first time a change in this repo touches a real database rather than in-memory state. Already primed by `LEARNING.md` Part 5.

**HAB-81 — timezone-aware `dates.ts`** *(parallel with HAB-60, no shared files)*
Build: thread an IANA timezone parameter through every function in `dates.ts`, replacing `toISOString()`/bare `Date` parsing with `Intl.DateTimeFormat`-based logic. Learn: this is a direct continuation of the Part 1 exercise — same file, same "pure function + test" pattern, just with a real `Intl` API instead of a regex. Worth reading MDN's `Intl.DateTimeFormat` page once before starting; it's the one genuinely new API here.

**HAB-61 — `habit-mapper.ts`**
Depends on HAB-60 + HAB-81. Build: bidirectional Prisma ↔ API shape conversion (category kebab ↔ `SCREAMING_SNAKE`, frequency, dates). Learn: this is where the `type` aliases and intersection types from `LEARNING.md` Part 1 (`habit-stats.ts`) get used for real — you're defining the shapes on both sides of a conversion function, not just reading ones that already existed.

**HAB-62 — `habits-db.ts`**
Depends on HAB-61. Build: user-scoped repository functions (`listHabits`, `createHabit`, `archiveHabit`, `unarchiveHabit`, `applyCompletions`), all `where: { id, userId }`. Learn: first real use of the Prisma client for queries (as opposed to just the schema file) — `await prisma.habit.findMany({ where: ... })` style calls. Good moment to skim the Prisma Client docs' query section since nothing in the tour so far has touched it.

**HAB-63 — refactor `habit-store.ts`**
Depends on HAB-62. Build: delete the in-memory array, switch IDs to Prisma autoincrement, keep validation helpers. Learn: less new syntax, more a "seeing a real migration off in-memory state" moment — useful to notice what *doesn't* need to change (the pure validation functions) vs what does (anything holding state).

**HAB-64 — secure habit APIs**
Depends on HAB-63 + HAB-81. Build: `getServerSession(authOptions)` guard, 401/404s, read + persist `X-Timezone` header. Learn: `LEARNING.md` Part 3 already flags this as the ticket that adds session-checking to the currently-open `route.ts` handlers — this is that moment. Look up `getServerSession` before starting, per the Part 3 "try it yourself" note.

**HAB-65 / HAB-66 / HAB-82** *(all depend on HAB-64, can split across sessions)*
- HAB-65: `src/middleware.ts` — new file, new concept (Next.js middleware, `withAuth`, route matching). Read the Next.js 16 middleware doc in `node_modules/next/dist/docs/` first — this is exactly the kind of API the repo's `AGENTS.md` warns may not match training data.
- HAB-66: `src/app/page.tsx` redirect for signed-in users — small, no new concepts, good one to do solo.
- HAB-82: unarchive + archived-habits view — first ticket that's a full slice (API route + `habits-db.ts` + real UI). Good checkpoint for "can I build a small feature top to bottom now."

**Phase 1 exit (stop here and check in before Phase 2):** persistence + per-user isolation + timezone correctness + auth-gated routes, per `TICKETS.md`.

---

## Phase 2 preview (sharing) — concepts to expect

Not sequenced in detail yet since Phase 1 isn't done, but worth knowing what's coming so it's not a surprise:

- HAB-67 adds a `HabitShare` model with `onDelete: Cascade` vs `SetNull` per relation — first time relation-level delete behavior matters, not just field types.
- HAB-68's `canView(requesterId, ownerId)` helper is the first authorization-as-a-function pattern in the repo (distinct from the session-guard-at-the-route pattern from HAB-64).
- HAB-69's `/api/shares` route introduces upsert-not-insert logic (re-invite reactivates a REVOKED row) — a real "what does idempotent mean for a POST" case.
- HAB-71's "viewing as owner X" context switcher is the first piece of UI state that isn't just this-user's-own-data — worth revisiting the `useState`/props "data down, events up" notes from `LEARNING.md` Part 2 before building it.

**Phase 2 exit (stop here and check in before Phase 3):** invite → accept → view read-only; non-invited blocked; revoke removes access, per `TICKETS.md`.

---

## Post-MVP backlog — HAB-84 (Server-Component conversion)

New since the last pass: `TICKETS.md` now has a "Post-MVP backlog" section, separate from the Phase 1–5 gate. **Don't block any phase exit on this ticket** — it's real, scoped work, but not required for the MVP.

**HAB-84 — convert `dashboard`/`habits`/`tracker` pages to a Server-Component shell + Client-Component island.**
Depends on HAB-65 (middleware needs to exist so auth-gating isn't duplicated) and HAB-71 (the shared-tracker view's final shape should land first, since HAB-84 and HAB-71 both touch the same three page files — sequencing avoids the two fighting over one diff). Build: each page becomes an `async` Server Component fetching via `habits-db.ts` directly; the interactive parts (forms, the completion grid's debounced optimistic-save logic) move into a `"use client"` child component that receives initial data as props. Component tests get rewritten to render the client island directly with props instead of mocking `fetch`; Playwright E2E specs need no changes since they assert on rendered state, not fetch mechanics.

Learn: this is the exact thing `LEARNING.md` Part 3 flagged and told you not to be confused by — "most Next.js tutorials lead with Server Components... this repo's pages are the classic client-side-fetch SPA pattern instead... a deliberate, existing choice, not a mistake." HAB-84 is the ticket where that choice gets revisited on purpose. Worth re-reading that Part 3 paragraph immediately before starting this ticket — you'll be doing the exact conversion it described as *not* being how this repo currently works.

Sequence this after Phase 2 (its dependencies HAB-65/HAB-71 are Phase 1/2 tickets) but treat it as its own optional phase — stop and check in after it same as any other phase, since it touches three page files at once.

---

## Keeping this current

When a ticket in this list lands: update `HANDOFF.md`'s Current state section (as it already instructs), check off the relevant `LEARNING.md` Part 4 box if applicable, and strike or annotate the row here. Check `TICKETS.md`'s post-MVP backlog section periodically too — that's where tickets like HAB-84 show up before they're folded into a numbered phase. If a ticket surfaces a new concept not anticipated above, or a new subagent gets installed in `.claude/agents/`, add a line rather than silently building around it.
