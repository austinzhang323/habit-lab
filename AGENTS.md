<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# AGENTS.md — HabitLab

> Shared engineering context for any agent (or human) working in this repo.
> Read `PRODUCT.md` for *what* HabitLab is, and `ROADMAP.md` for *what's next* and how tickets map to phases.
> This file is the contract for how work gets done here. If a change conflicts with it, update this file in the same PR.

---

## How to use this file (for an assigned agent)

When you're assigned a ticket:

1. Read `PRODUCT.md` (concepts, MVP definition) and the relevant `ROADMAP.md` phase.
2. Work only within your ticket's scope. If you discover adjacent work, note it — don't expand the PR.
3. Follow the conventions below. Add or update tests for what you change.
4. A ticket is **done only when its PR is green in CI** (see "Definition of done").

---

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Language:** TypeScript 5 (strict)
- **DB:** PostgreSQL via Prisma 7 (Accelerate `DATABASE_URL` + direct PG `DIRECT_DATABASE_URL`)
- **Auth:** NextAuth v4 + Google OAuth + Prisma adapter (database sessions)
- **Tests:** Vitest 4 (unit + component), Playwright 1.61 (E2E)
- **CI:** GitHub Actions — `ci.yml` (lint → type-check → vitest → build, + Playwright job), `migrate.yml` (prisma migrate deploy)

---

## Repository map

```
habit-lab/
├── prisma/            # schema.prisma + migrations (auth + habits models)
├── src/
│   ├── app/           # pages + API routes (App Router)
│   │   ├── dashboard/ tracker/ habits/ login/
│   │   └── api/       # habits, habits/completions, auth/[...nextauth], test/reset
│   ├── components/    # Header, Providers, HabitCompletionGrid
│   └── lib/           # habit-store, habit-stats, dates, auth, prisma
└── tests/             # unit / component / e2e
```

Key modules: `src/lib/habit-stats.ts` (streaks/rates), `src/lib/dates.ts` (30-day window, `isDateTrackable`, `getDateKey`), `src/lib/habit-store.ts` (validation + today's in-memory store, being replaced), `src/lib/prisma.ts` (dual clients), `src/lib/auth.ts` (NextAuth options).

---

## Commands

```bash
npm install
npm run dev            # local dev server
npm run lint           # eslint
npm run type-check     # tsc --noEmit  (must be clean)
npm run test           # vitest (unit + component)
npm run test:e2e       # playwright
npm run build          # next build
npm run db:migrate     # apply a schema change locally: migrate dev + generate
npx prisma generate    # regenerate client alone (e.g. after pulling a teammate's schema)
```

> If a script name here doesn't match `package.json`, trust `package.json` and fix this file.

---

## Conventions

**Data & auth (critical — this is where bugs become security issues)**
- Every habit/completion query is **scoped by `userId`**. Never query habits without the current user's id.
- API handlers for habit data start with `getServerSession(authOptions)`; no session → return **401**. Cross-user resource access → return **404** (don't leak existence).
- Sharing access is checked through **one shared helper** (owner OR has an ACCEPTED share). Don't reimplement the check per route.
- Writes are owner-only for the MVP (VIEW sharing). Reads may be owner or accepted-share.

**Prisma**
- Category/date/frequency conversion between API and DB goes through the mapper (`habit-mapper.ts`) — the single source of truth. Don't hand-roll `SCREAMING_SNAKE` conversions elsewhere.
- Any schema change ships with a migration in the same PR. CI checks `prisma migrate status` for drift.
- Use Prisma autoincrement IDs, not `Date.now()`.
- Prisma 7 removed `migrate dev`'s automatic client regeneration (breaking change vs. earlier versions) — always run `npm run db:migrate`, never bare `npx prisma migrate dev`, or the generated client in `src/generated/prisma` goes stale silently until something throws `Unknown argument`.

**Code style**
- TypeScript strict; no `any` without a comment justifying it.
- Keep `src/lib/*` logic pure and testable; side effects (DB, session) live at the API/route layer.
- Preserve existing API response shape (`{ success, ... }`) so pages/components don't need rewrites.
- Small, focused PRs mapped to one ticket.

**Tests**
- New logic in `src/lib` → unit tests. New/changed API → route + session-guard tests. New user-facing flow → Playwright E2E.
- Don't rely on the in-memory `test/reset` once habits are DB-backed; reset via truncating test-DB tables.

---

## Definition of done (every ticket)

- [ ] Scope matches the ticket; no unrelated changes.
- [ ] `lint`, `type-check`, `test`, `build` all pass locally.
- [ ] Tests added/updated for the change.
- [ ] Schema changes include a migration.
- [ ] PR is green in GitHub Actions and reviewed before merge (branch protection on `main`).

---

## Environment

Required vars (documented in `.env.example`): `DATABASE_URL`, `DIRECT_DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Never commit secrets; secret scanning / push protection is enabled (Phase 5).

---

## Working across tickets in parallel

The roadmap is ordered so multiple agents can work with minimal collisions:
- **Phase 1 (persistence + security)** is the gate — land it before sharing/insights agents start, since they depend on DB-backed, user-scoped habits.
- **Phase 4 (docs + tests)** and **Phase 5 (CI/CD)** can run alongside once Phase 2 exists.
- If two tickets both touch `habits-db.ts` or `schema.prisma`, sequence them or coordinate — those are the shared-contention files.

---

## When to split this into scoped AGENTS.md files

Keep everything in this one root file **until** a directory develops rules that *narrow or contradict* the root. Good future triggers:
- `src/app/api/AGENTS.md` — once the session/401/404 and rate-limit rules get detailed enough to distract from the root file.
- `src/lib/AGENTS.md` — to enforce "pure, no I/O, fully unit-tested" as that layer grows.
- `prisma/AGENTS.md` — migration authoring rules if schema churn increases.

When you split, move the area-specific rules down and leave a one-line pointer here. Don't pre-split empty files.
