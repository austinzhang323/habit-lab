export const ROLLING_TRACKER_DAYS = 30;

export const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const getRollingDateKeys = (days = ROLLING_TRACKER_DAYS): string[] => {
  const keys: string[] = [];
  const end = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - offset);
    keys.push(getDateKey(date));
  }

  return keys;
};

export const formatDateRowLabel = (dateKey: string): string => {
  const date = new Date(`${dateKey}T00:00:00`);
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${monthDay} · ${weekday}`;
};

export const formatHabitColumnHeader = (habit: {
  name: string;
  category?: string;
}): string => habit.name;

export const isWeekendDateKey = (dateKey: string): boolean => {
  const day = new Date(`${dateKey}T00:00:00`).getDay();
  return day === 0 || day === 6;
};

export const isDateInRollingWindow = (
  dateKey: string,
  days = ROLLING_TRACKER_DAYS
): boolean => getRollingDateKeys(days).includes(dateKey);

export const getCreatedDateKey = (createdAt: string): string =>
  createdAt.slice(0, 10);

export const isDateOnOrAfterCreation = (
  dateKey: string,
  createdAt: string
): boolean => dateKey >= getCreatedDateKey(createdAt);

export const isDateTrackable = (
  dateKey: string,
  createdAt: string,
  days = ROLLING_TRACKER_DAYS
): boolean =>
  isDateInRollingWindow(dateKey, days) &&
  isDateOnOrAfterCreation(dateKey, createdAt);
