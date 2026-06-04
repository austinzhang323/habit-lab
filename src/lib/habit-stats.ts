export type HabitWithCompletions = {
  completedDates: string[];
};

export type DayCompletion = {
  completed: number;
  total: number;
};

export type DaySummary = DayCompletion & {
  dateKey: string;
};

export const countCompletionsForDate = (
  habits: HabitWithCompletions[],
  dateKey: string
): DayCompletion => {
  const total = habits.length;
  if (total === 0) {
    return { completed: 0, total: 0 };
  }

  const completed = habits.filter((habit) =>
    habit.completedDates.includes(dateKey)
  ).length;

  return { completed, total };
};

export const computeCompletionRate = (
  habits: HabitWithCompletions[],
  dateKeys: string[]
): number => {
  if (habits.length === 0 || dateKeys.length === 0) {
    return 0;
  }

  const totalPossible = habits.length * dateKeys.length;
  const totalCompleted = dateKeys.reduce(
    (sum, dateKey) => sum + countCompletionsForDate(habits, dateKey).completed,
    0
  );

  return Math.round((totalCompleted / totalPossible) * 100);
};

export const computeCurrentStreak = (
  habits: HabitWithCompletions[],
  dateKeys: string[]
): number => {
  if (habits.length === 0 || dateKeys.length === 0) {
    return 0;
  }

  let streak = 0;

  for (let index = dateKeys.length - 1; index >= 0; index -= 1) {
    const { completed } = countCompletionsForDate(habits, dateKeys[index]);
    if (completed >= 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

export const getRecentDaySummaries = (
  habits: HabitWithCompletions[],
  dateKeys: string[],
  limit = 10
): DaySummary[] => {
  return [...dateKeys]
    .reverse()
    .slice(0, limit)
    .map((dateKey) => ({
      dateKey,
      ...countCompletionsForDate(habits, dateKey),
    }));
};

export const hasAnyCompletions = (habits: HabitWithCompletions[]): boolean =>
  habits.some((habit) => habit.completedDates.length > 0);
