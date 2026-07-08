import type { TrackerHabit } from "@/components/HabitCompletionGrid";
import { getDateKey, getRollingDateKeys } from "@/lib/dates";

export const FIXED_TEST_DATE = "2026-07-08";

export const makeTrackerHabit = (
  overrides: Partial<TrackerHabit> & Pick<TrackerHabit, "id" | "name">
): TrackerHabit => ({
  category: "exercise",
  createdAt: FIXED_TEST_DATE,
  ...overrides,
});

export const makeGrid = (
  entries: Array<{ habitId: number; dateKey: string; completed: boolean }>
): Record<number, Record<string, boolean>> => {
  const grid: Record<number, Record<string, boolean>> = {};

  for (const { habitId, dateKey, completed } of entries) {
    grid[habitId] ??= {};
    grid[habitId][dateKey] = completed;
  }

  return grid;
};

export const getTestDateKeys = (days = 5) => {
  const allKeys = getRollingDateKeys(30);
  const todayIndex = allKeys.indexOf(getDateKey(new Date(FIXED_TEST_DATE)));

  if (todayIndex === -1) {
    return allKeys.slice(-days);
  }

  const start = Math.max(0, todayIndex - days + 1);
  return allKeys.slice(start, todayIndex + 1);
};

export const makeApiHabit = (
  overrides: Partial<{
    id: number;
    name: string;
    description: string;
    frequency: string;
    category: string;
    createdAt: string;
    completedDates: string[];
    completedToday: boolean;
  }> = {}
) => ({
  id: 1,
  name: "Morning Run",
  description: "Run before work",
  frequency: "daily",
  category: "exercise",
  createdAt: FIXED_TEST_DATE,
  completedDates: [] as string[],
  completedToday: false,
  ...overrides,
});
