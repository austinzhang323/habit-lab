# HabitLab — Product Context

> Shared product context for anyone (human or agent) working on HabitLab.
> For *how to build* (stack, commands, conventions), see `AGENTS.md`. For *what to build next*, see `ROADMAP.md`.

---

## What HabitLab is

A personal habit-tracking web app. A user creates daily habits, marks completions on a rolling 30-day grid, and sees streaks and completion rates on a dashboard.

**Product purpose:** explore how daily habits impact performance, and surface meaningful insights from personal data.

**One-line MVP goal:** a persistent, private habit tracker that a user can **share with another account by email**, that **computes streaks**, and **surfaces (minimal) insights**.

---

## The MVP, precisely

A build is "MVP-complete" when all of these are true:

1. **Persistent** — habits and completions live in Postgres and survive a server restart.
2. **Private** — each user sees only their own habits; unauthenticated access is blocked.
3. **Shareable by email invite** — an owner can invite another account by email to *view* their tracker; the invited user accepts and sees it read-only.
4. **Streaks** — current streak and per-habit streaks are computed and shown.
5. **Insights (minimal)** — completion rates alongside streaks. No charts or generated "smart insights" for the MVP.
6. **Shipped behind green CI** — merged only after GitHub Actions passes (see `ROADMAP.md` Phase 5).

---

## Core concepts / glossary

These definitions are **decisions, not suggestions**. Use them consistently in code, tickets, and PRs. Each carries the resolved edge-case behavior.

### Habit
A recurring thing a user tracks: `name`, `category`, `frequency`, `createdAt`, `userId`, `archivedAt?`.
- **Daily-only** for the MVP, even though the schema allows WEEKLY/MONTHLY.
- **Removal = archive (soft-delete), not hard delete.** Setting `archivedAt` hides the habit from the active tracker but keeps the row and its completions in the DB, so history and stats are preserved and the action is reversible. Never `DELETE` a habit's rows in normal use.
- Editing name/category keeps the same habit `id`, so history carries over.

### Completion
A record that a habit was done on a specific day.
- **Binary** — a day is either done or not. Model as one row per (habit, date) that is done; absence = not done. No quantity/value field for the MVP.
- Stored per **date key** (`YYYY-MM-DD`), produced by `getDateKey()`.
- **Editable across the window:** a user may check/uncheck **any trackable day** in the rolling 30-day window (back to the habit's creation date), not just today.

### Day boundary ("today")
- "Today" rolls over at **midnight in the user's local timezone** (the viewer's browser timezone), not UTC or a fixed server zone. All completion date keys and streak math must be timezone-aware.
- **Shared views use the owner's data as-is.** A viewer sees the owner's completions by their stored date keys; streaks/rates for a shared tracker are computed over those keys. *(Assumption to confirm: the owner's day boundaries define the shared tracker's days. Flag if you'd rather compute in the viewer's timezone.)*

### Streak (per habit)
Consecutive completed days for a habit, using a **strict consecutive-day rule**.
- **Today is pending:** if every day through yesterday is done but today isn't marked yet, the current streak = the run through yesterday. Today does **not** break it until the day ends; marking today extends it.
- **One miss resets to 0.** No grace or rest-day allowance for the MVP.

### Completion rate
Completions ÷ **trackable days** in the 30-day window, per habit.

### Trackable day
A day that is within the rolling 30-day window **and** on/after the habit's creation date (`dates.ts`, `isDateTrackable`). Days before creation are greyed out and never count against streaks or rates.

### Tracker
The 30-day rolling completion grid across all of a user's *active* (non-archived) habits; the primary interaction surface (`/tracker`). One tracker per user.

### Dashboard
Read view of streaks + completion rates (`/dashboard`).

### Owner
The user who created a habit / tracker. **Writes are owner-only.**

### Share
An invitation from an owner to another account, by email, to view the owner's **whole tracker plus its stats** (habits, completions, streaks, rates) **read-only**.
- **States:** PENDING → ACCEPTED, or REVOKED.
- **Invite any email:** if no account exists for that email yet, the share stays PENDING and activates when someone signs in with that Google email.
- **Many-to-many:** an owner may invite many people; a user may hold many shares.
- **VIEW-only** for the MVP — no edit permission, no per-habit selection (the whole tracker is shared).
- Archived habits stay hidden in shared views too.

---

## Users & primary stories

- *As a user,* I sign in with Google and see only my own habits.
- *As a user,* I create habits and mark them done each day on the tracker.
- *As a user,* I check my dashboard for streaks and completion rates.
- *As an owner,* I invite someone by email to view my tracker.
- *As an invited user,* I accept an invite and view that tracker read-only; I can't edit it.

---

## Categories & frequency

- **Categories** (7): UI uses kebab-case (`spiritual-growth`), Prisma uses `SCREAMING_SNAKE` (`SPIRITUAL_GROWTH`). A mapper is the single source of truth for conversion.
- **Frequency:** DAILY / WEEKLY / MONTHLY exist in schema; **only DAILY is implemented** in UI/API for the MVP.

---

## Scope

**In scope (MVP):** persistence, per-user isolation, route/API auth, email-invite VIEW sharing, streaks, completion rates, docs, CI/CD hardening.

**Out of scope (MVP):** domain-wide auto-sharing (everyone on a domain), EDIT-permission sharing, account linking across multiple logins, weekly/monthly frequency UI, charts (`recharts`) and generated/"smart" insights, Auth.js v5 upgrade, example-habit seeding.

**Abandoned:** the earlier daily check-in (sleep / mood / energy / focus) direction — models and pages removed.

---

## Current state (as of this writing)

~55% — a polished, tested single-user demo with working Google sign-in and a ready Prisma schema. Habits still live in a shared in-memory store; nothing is persisted or isolated per user yet. The remaining work is captured in `ROADMAP.md` (Phases 1–5).
