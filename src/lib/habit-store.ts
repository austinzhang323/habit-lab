import {
  getDateKey,
  isDateInRollingWindow,
  isDateTrackable,
} from "@/lib/dates";

export type Habit = {
  id: number;
  name: string;
  description: string;
  frequency: string;
  category: string;
  /** Calendar date key (YYYY-MM-DD) when the habit was created */
  createdAt: string;
  completedDates: string[];
};

export type CompletionUpdate = {
  habitId: number;
  date: string;
  completed: boolean;
};

export const allowedFrequencies = new Set(["daily"]);
export const allowedCategories = new Set([
  "sleep",
  "cleaning",
  "exercise",
  "food",
  "water",
  "spiritual-growth",
  "relational",
]);

export const habits: Habit[] = [];

export const resetHabitsForTests = () => {
  habits.length = 0;
};

export const normalizeHabit = (habit: Habit): Habit => {
  if (!habit.createdAt) {
    habit.createdAt = getDateKey();
  }
  return habit;
};

export const serializeHabit = (habit: Habit) => {
  const normalized = normalizeHabit(habit);
  return {
    ...normalized,
    completedToday: normalized.completedDates.includes(getDateKey()),
  };
};

export const findHabit = (id: number) => habits.find((entry) => entry.id === id);

export const setCompletion = (
  habit: Habit,
  dateKey: string,
  completed: boolean
) => {
  if (completed) {
    if (!habit.completedDates.includes(dateKey)) {
      habit.completedDates.push(dateKey);
      habit.completedDates.sort();
    }
    return;
  }

  habit.completedDates = habit.completedDates.filter((entry) => entry !== dateKey);
};

export const toggleCompletion = (habit: Habit, dateKey: string) => {
  const completed = habit.completedDates.includes(dateKey);
  setCompletion(habit, dateKey, !completed);
};

export type ApplyCompletionUpdatesResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export const applyCompletionUpdates = (
  updates: CompletionUpdate[]
): ApplyCompletionUpdatesResult => {
  for (const update of updates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(update.date)) {
      return { ok: false, error: "Invalid date format", status: 400 };
    }

    if (!isDateInRollingWindow(update.date)) {
      return {
        ok: false,
        error: "Date must be within the last 30 days",
        status: 400,
      };
    }

    const habit = findHabit(update.habitId);
    if (!habit) {
      return { ok: false, error: `Habit not found: ${update.habitId}`, status: 404 };
    }

    normalizeHabit(habit);

    if (!isDateTrackable(update.date, habit.createdAt)) {
      return {
        ok: false,
        error: "Date must be on or after the habit was created",
        status: 400,
      };
    }

    setCompletion(habit, update.date, update.completed);
  }

  return { ok: true };
};
