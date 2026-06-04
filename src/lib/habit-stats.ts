import { isDateTrackable } from "@/lib/dates";

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

export type BestCurrentStreak = {
  bestStreak: number;
  habitNames: string[];
};

export const getTrackableDateKeys = (
  habit: HabitWithCompletions,
  dateKeys: string[]
): string[] =>
  dateKeys.filter((dateKey) => isDateTrackable(dateKey, habit.createdAt));

export const computeHabitCompletionRate = (
  habit: HabitWithCompletions,
  dateKeys: string[]
): number => {
  const trackableKeys = getTrackableDateKeys(habit, dateKeys);
  if (trackableKeys.length === 0) {
    return 0;
  }

  const completed = trackableKeys.filter((dateKey) =>
    habit.completedDates.includes(dateKey)
  ).length;

  return Math.round((completed / trackableKeys.length) * 100);
};

export const computeHabitStreak = (
  habit: HabitWithCompletions,
  dateKeys: string[]
): number => {
  const trackableKeys = getTrackableDateKeys(habit, dateKeys);
  if (trackableKeys.length === 0) {
    return 0;
  }

  let streak = 0;
  let inStreak = false;

  for (const dateKey of [...trackableKeys].reverse()) {
    if (habit.completedDates.includes(dateKey)) {
      streak += 1;
      inStreak = true;
    } else if (inStreak) {
      break;
    }
  }

  return streak;
};

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

export const getBestCurrentStreak = (
  stats: PerHabitStat[]
): BestCurrentStreak => {
  if (stats.length === 0) {
    return { bestStreak: 0, habitNames: [] };
  }

  const bestStreak = Math.max(...stats.map((stat) => stat.streak), 0);
  if (bestStreak === 0) {
    return { bestStreak: 0, habitNames: [] };
  }

  const habitNames = stats
    .filter((stat) => stat.streak === bestStreak)
    .map((stat) => stat.name)
    .sort((a, b) => a.localeCompare(b));

  return { bestStreak, habitNames };
};

export const hasAnyCompletions = (habits: HabitWithCompletions[]): boolean =>
  habits.some((habit) => habit.completedDates.length > 0);
