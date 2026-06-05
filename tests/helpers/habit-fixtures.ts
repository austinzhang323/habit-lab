import type { HabitWithCompletions } from "@/lib/habit-stats";

export const makeHabitWithCompletions = (overrides: {
  completedDates?: string[];
  createdAt?: string;
}): HabitWithCompletions => ({
  completedDates: overrides.completedDates ?? [],
  createdAt: overrides.createdAt ?? "",
});
