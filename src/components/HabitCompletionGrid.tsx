"use client";

import {
  formatDateRowLabel,
  formatHabitColumnHeader,
  getDateKey,
  isWeekendDateKey,
} from "@/lib/dates";

export type TrackerHabit = {
  id: number;
  name: string;
  category: string;
};

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
  const todayKey = getDateKey();

  return (
    <div className="overflow-auto max-h-[min(70vh,600px)] rounded-xl border border-border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 top-0 z-30 min-w-[7.5rem] border-b border-r border-border bg-white px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/60 dark:bg-gray-900"
            >
              Date
            </th>
            {habits.map((habit) => (
              <th
                key={habit.id}
                scope="col"
                className="sticky top-0 z-20 min-w-[5.5rem] max-w-[8rem] border-b border-border bg-white px-2 py-3 text-center dark:bg-gray-900"
                title={formatHabitColumnHeader(habit)}
              >
                <span className="block truncate font-semibold text-foreground">
                  {habit.name}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-normal capitalize text-foreground/50">
                  {habit.category.replace("-", " ")}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dateKeys.map((dateKey) => {
            const isToday = dateKey === todayKey;
            const isWeekend = isWeekendDateKey(dateKey);

            return (
              <tr
                key={dateKey}
                className={`group transition-colors hover:bg-foreground/5 ${
                  isToday ? "bg-primary/5" : isWeekend ? "bg-foreground/[0.02]" : ""
                }`}
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 border-r border-border bg-white px-3 py-2 text-left text-xs font-medium whitespace-nowrap dark:bg-gray-900 ${
                    isToday ? "border-l-2 border-l-primary text-primary" : "text-foreground/80"
                  }`}
                >
                  <span>{formatDateRowLabel(dateKey)}</span>
                  {isToday && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      Today
                    </span>
                  )}
                </th>
                {habits.map((habit) => {
                  const completed = grid[habit.id]?.[dateKey] ?? false;

                  return (
                    <td
                      key={`${dateKey}-${habit.id}`}
                      className="border-b border-border/60 px-2 py-2 text-center"
                    >
                      <input
                        type="checkbox"
                        checked={completed}
                        disabled={saving}
                        onChange={() => onToggle(habit.id, dateKey, !completed)}
                        aria-label={`Mark "${habit.name}" complete on ${formatDateRowLabel(dateKey)}`}
                        className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
