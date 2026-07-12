# HabitLab — Handoff

> For any agent (or human) picking up work in this repo. Read this first, then `AGENTS.md` (conventions), `PRODUCT.md` (glossary), `ROADMAP.md` (phases), `TICKETS.md` (assignable units of work).

---

## Current state

~55%+ complete: a polished, tested single-user demo with working Google sign-in and a ready-to-extend Prisma schema, but habits still live in a shared in-memory array (`src/lib/habit-store.ts`) — nothing persisted or isolated per user yet. Phases 1–5 in `ROADMAP.md` cover the remaining work.

The planning docs (`PRODUCT.md`, `ROADMAP.md`, `TICKETS.md`) were reviewed by five parallel subagents across product/UX, technical/data-model, security/isolation, testability/CI, and scope/sequencing lenses, then revised based on decisions locked in with the repo owner (Austin) and checked by two adversarial follow-up reviews. That review work is done — the plans are considered solid and ready to build from. See `TICKETS.md`'s changelog note at the top for the numbering history.

**Ticket numbering:** the series is `HAB-60` through `HAB-82` (intentionally skips `HAB-59` — see the note at the top of `TICKETS.md` for why: it collided with real commits, most recently `HAB-56`, "regenerate lockfile and pin CI to Node 24 LTS"). **The next unblocked ticket is `HAB-60`** (Prisma schema: add `Habit.archivedAt` and `User.timezone`).

---

## How Austin wants to work

**Austin is building alongside whichever agent picks this up — this is not a "delegate the whole ticket and disappear" situation.** He's using these tickets partly to learn TypeScript/React/Next.js hands-on (he knows JS already, this stack is new). Concretely:

- Don't silently implement a full ticket end-to-end and hand back a finished PR. Check in, explain what you're doing and why as you go, and leave room for him to write some of it himself.
- If a ticket touches a concept he hasn't hit yet (Prisma migrations, Next.js route handlers, React hooks, etc.), briefly explain it in context rather than assuming familiarity — but don't over-explain things he's already touched in a prior ticket.
- His own learning notes and guided tour live in `LEARNING.md` (not meant for agents to follow as instructions, just useful context on where he's at and what's already been covered).
- Small, reviewable increments over one large diff — easier for him to follow and to actually type some of it himself.

---

## Where to start

1. Read `AGENTS.md`, `PRODUCT.md` (glossary is authoritative), `ROADMAP.md` Phase 1, `TICKETS.md` (HAB-60 entry).
2. `HAB-60` — Depends on nothing, touches `prisma/schema.prisma` only. Adds `Habit.archivedAt DateTime?` and `User.timezone String?`, plus a migration `add_habit_archive`.
3. `HAB-81` (timezone-aware `dates.ts`) has no dependency either and can run in parallel with HAB-60 if there are two of you working — they don't share files.
4. Everything else in Phase 1 is a strict chain: HAB-60/81 → HAB-61 → HAB-62 → HAB-63 → HAB-64 → HAB-65/66/82.

**Contention files** (never have two open tickets both editing these at once): `prisma/schema.prisma`, `src/lib/habits-db.ts`, `src/lib/habit-mapper.ts`, `src/app/habits/` (the last one only between HAB-70 and HAB-82, which have no formal dependency edge on each other).

---

## Conventions reminder (full version in `AGENTS.md`)

- Git identity for this repo: `Austin Zhang <austinzhang323@gmail.com>`.
- Every habit/completion query scoped by `userId`. Session-guard first, 401 on no session, 404 on cross-user resource access (don't leak existence).
- Category/date/frequency conversion only through `habit-mapper.ts` once it exists (HAB-61).
- Any schema change ships with a migration in the same PR.
- `lint`, `type-check`, `test`, `build` all pass locally before calling a ticket done.

---

## Known open items / caveats for whoever picks up specific tickets

- **HAB-76 (CI Postgres container):** `prisma/schema.prisma`'s `datasource db` block currently has no `url`/`directUrl` field — the app builds its Prisma client at runtime via `accelerateUrl` in `src/lib/prisma.ts` instead. `migrate.yml` already passes both `DATABASE_URL` and `DIRECT_DATABASE_URL` as env vars to `prisma migrate deploy`, which normally requires a schema-level `url`. Confirm whether this already works (Prisma 7 behavior) before assuming it does — flagged explicitly in the HAB-76 ticket text.
- **Known open items (flagged, not decided)** — see the bottom of `PRODUCT.md`: mid-session revocation UX, the "viewing as owner X" switcher UI (dropdown vs. tabs), stale pending invites on email reassignment, and the empty-shared-tracker-vs-revoked ambiguity. Don't build silently around these; if a ticket forces the question, surface it rather than guessing.
- **This is a bleeding-edge stack** (Next.js 16, React 19, Prisma 7, Tailwind 4, Vitest 4) — the repo's own `AGENTS.md` header warns training-data assumptions about Next.js APIs may be wrong. Check `node_modules/next/dist/docs/` for the actual current API before relying on memory.
- If you hit a `git` error like `Unable to create '.git/index.lock': File exists` while working in a sandboxed agent environment, that's usually specific to the sandbox's filesystem, not a real stale lock — see the conversation history for how it was resolved once. On Austin's actual machine, a normal `rm -f .git/index.lock .git/HEAD.lock` should be safe if it ever happens for real (crashed process, editor left it open).

---

## Updating this file

When you finish a ticket (or a work session ends), update the **Current state** section above: what shipped, what the new next-unblocked ticket is, and anything you learned that the next agent (or Austin) should know before continuing. Keep it terse — this file is a pointer, not a full changelog (git history is the changelog).
