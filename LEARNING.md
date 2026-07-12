# Learning HabitLab — TypeScript, React & Next.js via the real codebase

This is your own working notes file — not instructions for an agent (that's `HANDOFF.md`). Update it as you go: what clicked, what didn't, what to revisit.

**Starting point:** you know JavaScript. TypeScript, React, and Next.js specifically are new. So this skips "what is a variable" and focuses on what's actually different or new to you, using files that already exist in this repo — no toy examples.

**Plan:** tour first (read + tiny, safe, revertable edits — nothing here touches ticket work or shared files), then pair on `HAB-60` once you're oriented.

---

## Part 1 — TypeScript: what JS doesn't have

Open `src/lib/dates.ts`. It's short, has zero dependencies on React or Next.js, and is pure logic — the best possible first file.

```ts
export const ROLLING_TRACKER_DAYS = 30;

export const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);
```

Two things jump out vs. plain JS:

- **`date = new Date()`** — a default parameter, same as JS. Nothing TS-specific yet.
- Notice there's no type annotation on `date` or the return value here — TypeScript **infers** types when it can. Hover this function in your editor (VS Code) and it'll tell you the inferred signature: `(date?: Date) => string`. You don't always have to write types by hand; TS often figures them out from how you use the code.

Now look at a function with explicit types:

```ts
export const isDateTrackable = (
  dateKey: string,
  createdAt: string,
  days = ROLLING_TRACKER_DAYS
): boolean =>
  isDateInRollingWindow(dateKey, days) &&
  isDateOnOrAfterCreation(dateKey, createdAt);
```

`dateKey: string` and `createdAt: string` are parameter type annotations — "this must be a string, or TypeScript will refuse to compile." The `: boolean` after the closing paren is the **return type**. In plain JS you could pass a number here and JS would silently do something weird (probably produce `"NaN"` somewhere down the line); TypeScript stops you at compile time instead, before you ever run the code. That's the whole pitch of TypeScript: catching an entire category of "wrong shape of data" bugs before runtime.

Now open `src/lib/habit-stats.ts` for two more core TS concepts:

```ts
export type HabitWithCompletions = {
  completedDates: string[];
  createdAt: string;
};

export type PerHabitStat = {
  habitId: number;
  name: string;
  streak: number;
  completionRate: number;
};
```

This is a **type alias** — you're naming a shape of object, so you can reuse it instead of retyping `{ completedDates: string[]; createdAt: string }` everywhere. `string[]` means "array of strings." You'll see `type` used for this throughout the repo (you may also encounter `interface` elsewhere in the TS world — for object shapes they're nearly interchangeable; this repo consistently uses `type`, so match that convention here).

```ts
export const computePerHabitStats = (
  habits: (HabitWithCompletions & { id: number; name: string })[],
  dateKeys: string[]
): PerHabitStat[] =>
  habits.map((habit) => ({
    habitId: habit.id,
    name: habit.name,
    streak: computeHabitStreak(habit, dateKeys),
    completionRate: computeHabitCompletionRate(habit, dateKeys),
  }));
```

`A & { id: number; name: string }` is an **intersection type** — "a `HabitWithCompletions`, *plus* it also has `id` and `name`." Useful when a function needs a bigger shape than the one type alias covers by itself, without redefining a whole new type.

**Try it yourself (safe, no ticket conflict):** in `src/lib/dates.ts`, add a new small pure function at the bottom:

```ts
export const isValidDateKeyFormat = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value);
```

Then create `tests/unit/lib/dates.test.ts` (this file doesn't exist yet) and write one or two `it(...)` cases for it, following the style in `tests/unit/lib/habit-stats.test.ts` (import from `vitest`, `describe`/`it`/`expect`). Run `npm run test` to see it pass. This is a real, useful function — `applyCompletionUpdates` in `habit-store.ts` currently checks date format with an inline regex; you've just learned the shape of a file you'll actually extend for real in `HAB-81`.

---

## Part 2 — React: components, props, and hooks

Open `src/components/Providers.tsx` — the smallest component in the repo:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- **`"use client"`** at the top of a file is a Next.js App Router thing, not plain React — more in Part 3. For now: it means "this component runs in the browser, not just on the server."
- `Providers` is a **function component** — just a function that returns JSX (the HTML-looking syntax). Nothing more mysterious than that.
- `{ children }: { children: React.ReactNode }` is a component receiving **props**, TypeScript-typed inline. `children` is a special prop — whatever you nest inside `<Providers>...</Providers>` in JSX gets passed through here. `React.ReactNode` is the type for "anything React can render" (text, elements, arrays of elements, etc.).

This one line is doing a lot: it wraps your whole app in NextAuth's session context so every component can ask "is someone logged in?" without prop-drilling that info through every layer manually. That's what "Provider" pattern means in React — a component near the top of the tree that makes some piece of state/context available to everything below it.

Now open `src/components/HabitCompletionGrid.tsx` — a bigger, "dumb" (presentational) component:

```tsx
type HabitCompletionGridProps = {
  dateKeys: string[];
  habits: TrackerHabit[];
  grid: Record<number, Record<string, boolean>>;
  onToggle: (habitId: number, dateKey: string, completed: boolean) => void;
  saving?: boolean;
};

export default function HabitCompletionGrid({
  dateKeys,
  habits,
  grid,
  onToggle,
  saving = false,
}: HabitCompletionGridProps) {
```

New things here:

- **`Record<number, Record<string, boolean>>`** — a generic type. `Record<K, V>` means "an object whose keys are type `K` and values are type `V`." So this is "an object keyed by habit id, whose value is another object keyed by date string, whose value is a boolean (completed or not)." This is exactly the `grid` state shape used to render the checkboxes — habit → date → completed.
- **`onToggle: (habitId: number, dateKey: string, completed: boolean) => void`** — a prop that *is a function*. This is how a child component tells its parent "something happened" — the child doesn't manage its own state here, it just calls the function its parent gave it. This is the core React data-flow pattern: state lives in the parent (`TrackerPage`), and gets passed *down* as data, while events get passed *up* as function calls. You'll see this pattern everywhere in React.
- **`saving?: boolean`** and **`saving = false`** — the `?` makes the prop optional in the type; the `= false` is a default value if the caller doesn't pass one. Same "optional + default" idea as TS function parameters in Part 1.

Inside the component:

```tsx
<input
  type="checkbox"
  checked={completed}
  disabled={saving}
  onChange={() => onToggle(habit.id, dateKey, !completed)}
  ...
/>
```

This is a **controlled input** — the checkbox's checked state isn't managed by the DOM itself, it's driven entirely by the `completed` value from props/state. When you click it, `onChange` fires and calls `onToggle`, which (as you'll see next) updates state in the *parent* component, which re-renders this component with a new `completed` value. Nothing "just toggles itself" in React — it's always: event → state update → re-render.

Now open `src/app/tracker/page.tsx`, the parent that owns this state — this is where the React **hooks** live:

```tsx
const [habits, setHabits] = useState<TrackerHabit[]>([]);
const [grid, setGrid] = useState<GridState>({});
```

- **`useState<T>(initial)`** returns a `[value, setValue]` pair. `<TrackerHabit[]>` is the type of the state — TS generics again, same idea as `Record<K, V>`. Call `setHabits(...)` and React re-renders anything that reads `habits`.

```tsx
const dateKeys = useMemo(
  () => getRollingDateKeys(ROLLING_TRACKER_DAYS),
  []
);
```

- **`useMemo(compute, deps)`** — "only recompute this value when something in the `deps` array changes." Here `deps` is `[]` (empty), meaning "compute once, on first render, never again." Without `useMemo`, `getRollingDateKeys` would rerun on every re-render — wasteful, and in some cases would produce a different array reference each time, which matters for other hooks.

```tsx
useEffect(() => {
  const fetchHabits = async () => {
    const response = await fetch("/api/habits");
    ...
  };
  void fetchHabits();
}, [dateKeys, showToast]);
```

- **`useEffect(fn, deps)`** — "run `fn` after render, and again whenever something in `deps` changes." This is how you do things React doesn't otherwise let you do during rendering itself — like fetching data. The empty-looking pattern `void fetchHabits()` is just "call this async function and explicitly ignore its returned promise" (the `void` keyword tells TypeScript/linters you did this on purpose, not by accident).

```tsx
const gridRef = useRef(grid);
```

- **`useRef`** — a mutable box that persists across renders *without* triggering a re-render when you change it (unlike `useState`). Used here (`gridRef.current = grid`) so a callback can always read the *latest* grid value even inside a closure that captured an older one — a real gotcha in React you'll run into eventually; for now just recognize the pattern.

**Try it yourself:** in `src/app/dashboard/page.tsx`, find the `<p>` that says `"Track your progress and insights"` and change the copy to something of your own. Save, run `npm run dev`, and watch it hot-reload in the browser. Then look at `computePerHabitStats`/`getBestCurrentStreak` calls right above the JSX — trace how `habits` (fetched from the API) flows into `perHabitStats` (derived via `useMemo`) into what's rendered. This is the same "data flows down" idea as the tracker grid, just one component instead of two.

---

## Part 3 — Next.js: routing, layouts, and API routes

Next.js's **App Router** (what this repo uses) is file-system based: the path of a file under `src/app/` *is* the URL route. Look at the actual layout:

```
src/app/
├── layout.tsx        ← wraps every page (root layout)
├── page.tsx          ← the "/" route
├── dashboard/page.tsx ← the "/dashboard" route
├── tracker/page.tsx   ← the "/tracker" route
├── habits/page.tsx    ← the "/habits" route
├── login/page.tsx     ← the "/login" route
└── api/
    ├── habits/route.ts             ← "/api/habits" (GET/POST/PATCH/DELETE)
    └── habits/completions/route.ts ← "/api/habits/completions" (PATCH)
```

No router config file, no `<Route path="...">` anywhere — the folder structure *is* the router. A file named exactly `page.tsx` in a folder makes that folder path a visitable page; a file named exactly `route.ts` makes it an API endpoint instead.

Open `src/app/layout.tsx`:

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" ...>
      <body ...>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

Every page's content gets slotted in as `children` here — this is why `<Header />` shows up on every route without every `page.tsx` having to import it. `Readonly<{ children: React.ReactNode }>` is the same children-prop pattern from Part 2, wrapped in TypeScript's built-in `Readonly<T>` utility type (just means "don't reassign these props" — a small safety net, not load-bearing to understand deeply right now).

Now the important nuance for *this specific repo*: most Next.js tutorials you'll find online lead with **Server Components** — components that run only on the server, fetch data directly (often straight from a database), and send already-rendered HTML to the browser. This repo's pages (`tracker/page.tsx`, `dashboard/page.tsx`, `habits/page.tsx`) all start with `"use client"` and fetch data client-side via `fetch()` inside `useEffect` — the more "classic React SPA" pattern, not the newer server-first one. That's a deliberate, existing choice in this codebase (not a mistake), but it means tutorials that show you Server Components fetching data with `await prisma.habit.findMany()` directly in a `page.tsx` won't match what you see here. Worth knowing so you're not confused when the two don't line up.

Now the API side — open `src/app/api/habits/route.ts`:

```ts
export async function GET() {
  return NextResponse.json({ data: habits.map(serializeHabit) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as CreateHabitBody;
  ...
  return NextResponse.json({ success: true, data: serializeHabit(habit) }, { status: 201 });
}
```

Route handlers are just exported functions named after HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`) in a file called `route.ts`. Next.js wires up "requests to `/api/habits` with method POST call this function" automatically from the file location + export name — no manual route registration. `NextResponse.json(...)` is Next's helper for returning a JSON HTTP response with the right headers.

**Why this matters for HAB-60, your first real ticket:** it doesn't touch any of this — it's a pure Prisma schema change. But HAB-61 (mapper) and HAB-63/64 (secure the API routes) will touch exactly this `route.ts` file, adding a `getServerSession(authOptions)` check at the top of each handler. Understanding the current (insecure, no-session-check) version now will make it obvious what's being added later.

**Try it yourself:** open `src/middleware.ts` — it doesn't exist yet (`HAB-64`/new-`65` will create it). Instead, open `src/lib/auth.ts` and read it end to end (it's 21 lines). Then look up "NextAuth `getServerSession`" — one search, five minutes — so the concept is familiar before you hit it in a real ticket.

---

## Part 4 — Suggested reading order (checklist)

Work through these roughly in order; check them off as you go. None of this touches ticket work or contention files, so there's no risk of clashing with agent work in progress.

- [ ] `src/lib/dates.ts` — pure functions, no framework, best starting point (Part 1 above)
- [ ] `src/lib/habit-stats.ts` — same, slightly more type complexity (intersections, generics)
- [ ] Write the `isValidDateKeyFormat` exercise above + its test
- [ ] `src/components/Providers.tsx` — smallest component in the repo
- [ ] `src/components/HabitCompletionGrid.tsx` — props, controlled inputs, "data down, events up"
- [ ] `src/app/tracker/page.tsx` — `useState`/`useMemo`/`useEffect`/`useRef` all in one real file
- [ ] `src/app/dashboard/page.tsx` — same hooks, simpler component; do the copy-edit exercise
- [ ] `src/app/layout.tsx` — root layout, shared UI across routes
- [ ] `src/app/api/habits/route.ts` — route handlers, current (pre-auth) state
- [ ] `src/lib/auth.ts` — NextAuth config, 21 lines, read end to end
- [ ] Skim `prisma/schema.prisma` — you don't need to understand Prisma deeply yet; just see the shape (models, fields, relations) before HAB-60 asks you to add two fields to it

---

## Part 5 — Bridging into HAB-60

`HAB-60` (Schema: add `Habit.archivedAt`, `User.timezone`) is entirely in `prisma/schema.prisma` — no React, no API routes, low blast radius, which is exactly why it's the right first ticket to actually build together rather than just read about.

New concepts you'll hit there, worth a quick look before we start:
- **Prisma schema syntax** — models, fields, `?` for nullable, `@default`, `@@unique`. Similar spirit to a TS `type`, but describing a database table instead of an in-memory object.
- **Migrations** — `npx prisma migrate dev` generates a SQL file that describes *how* to change the real database to match the new schema. This is the part that doesn't exist at all in plain TypeScript/React — it's specific to working with a real persistent database.

When you're ready, say so and we'll open `prisma/schema.prisma` together and make the change live, one field at a time, running the migration command ourselves rather than me just doing it and showing you the result.
