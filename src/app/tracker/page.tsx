"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HabitCompletionGrid, {
  type TrackerHabit,
} from "@/components/HabitCompletionGrid";
import {
  getDateKey,
  getRollingDateKeys,
  isDateTrackable,
  ROLLING_TRACKER_DAYS,
} from "@/lib/dates";

type Habit = TrackerHabit & {
  completedDates: string[];
};

type CompletionUpdate = {
  habitId: number;
  date: string;
  completed: boolean;
};

type GridState = Record<number, Record<string, boolean>>;

const buildGridFromHabits = (habits: Habit[], dateKeys: string[]): GridState => {
  const grid: GridState = {};

  for (const habit of habits) {
    grid[habit.id] = {};
    for (const dateKey of dateKeys) {
      grid[habit.id][dateKey] = habit.completedDates.includes(dateKey);
    }
  }

  return grid;
};

const SAVE_DEBOUNCE_MS = 400;

export default function TrackerPage() {
  const dateKeys = useMemo(
    () => getRollingDateKeys(ROLLING_TRACKER_DAYS),
    []
  );
  const [habits, setHabits] = useState<TrackerHabit[]>([]);
  const [grid, setGrid] = useState<GridState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null
  );
  const [isToastVisible, setIsToastVisible] = useState(false);

  const gridRef = useRef(grid);
  const pendingUpdatesRef = useRef<CompletionUpdate[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const hideToastTimerRef = useRef<number | null>(null);
  const clearToastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const showToast = useCallback((message: string, tone: "success" | "error") => {
    setToast({ message, tone });
    setIsToastVisible(true);

    if (hideToastTimerRef.current !== null) {
      window.clearTimeout(hideToastTimerRef.current);
    }
    if (clearToastTimerRef.current !== null) {
      window.clearTimeout(clearToastTimerRef.current);
    }

    hideToastTimerRef.current = window.setTimeout(() => {
      setIsToastVisible(false);
      hideToastTimerRef.current = null;
    }, 3400);

    clearToastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      clearToastTimerRef.current = null;
    }, 4000);
  }, []);

  const flushPendingUpdates = useCallback(async () => {
    const updates = [...pendingUpdatesRef.current];
    pendingUpdatesRef.current = [];

    if (updates.length === 0) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/habits/completions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      const refreshed = (data.data || []) as Habit[];
      setHabits(
        refreshed
          .map(({ id, name, category, createdAt }) => ({
            id,
            name,
            category,
            createdAt,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setGrid(buildGridFromHabits(refreshed, dateKeys));
    } catch (error) {
      setGrid((current) => {
        const reverted = JSON.parse(JSON.stringify(current)) as GridState;

        for (const update of updates) {
          if (reverted[update.habitId]) {
            reverted[update.habitId][update.date] = !update.completed;
          }
        }

        return reverted;
      });
      showToast(
        error instanceof Error ? error.message : "Failed to save changes",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }, [dateKeys, showToast]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushPendingUpdates();
    }, SAVE_DEBOUNCE_MS);
  }, [flushPendingUpdates]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch("/api/habits");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load habits");
        }

        const loaded = (data.data || []) as Habit[];
        const sorted = [...loaded].sort((a, b) => a.name.localeCompare(b.name));

        setHabits(
          sorted.map(({ id, name, category, createdAt }) => ({
            id,
            name,
            category,
            createdAt,
          }))
        );
        setGrid(buildGridFromHabits(sorted, dateKeys));
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to load habits",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchHabits();
  }, [dateKeys, showToast]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (hideToastTimerRef.current !== null) {
        window.clearTimeout(hideToastTimerRef.current);
      }
      if (clearToastTimerRef.current !== null) {
        window.clearTimeout(clearToastTimerRef.current);
      }
    };
  }, []);

  const handleToggle = (habitId: number, dateKey: string, completed: boolean) => {
    const habit = habits.find((entry) => entry.id === habitId);
    if (!habit || !isDateTrackable(dateKey, habit.createdAt)) {
      return;
    }

    const previous = gridRef.current[habitId]?.[dateKey] ?? false;
    if (previous === completed) {
      return;
    }

    setGrid((current) => ({
      ...current,
      [habitId]: {
        ...current[habitId],
        [dateKey]: completed,
      },
    }));

    pendingUpdatesRef.current.push({ habitId, date: dateKey, completed });
    scheduleSave();
  };

  const todayKey = getDateKey();

  return (
    <div className="min-h-screen bg-gradient-to-br from-foreground/5 to-foreground/10 px-4 sm:px-6 lg:px-8 py-12">
      {toast && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none px-4">
          <div
            className={`rounded-lg border px-4 py-2 text-sm font-semibold shadow-lg transition-opacity duration-500 ${
              isToastVisible ? "opacity-100" : "opacity-0"
            } ${
              toast.tone === "success"
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tracker</h1>
            <p className="text-foreground/70">
              Up to {ROLLING_TRACKER_DAYS} days — days before a habit was created are not
              tracked for that habit. Scroll vertically through dates, habits across columns.
            </p>
          </div>
          {saving && (
            <p className="text-sm font-medium text-foreground/60">Saving…</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-lg dark:bg-gray-900 sm:p-8">
          {loading ? (
            <p className="text-sm text-foreground/60">Loading tracker…</p>
          ) : habits.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-foreground/70 mb-4">No habits yet.</p>
              <Link
                href="/habits"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Create habits
              </Link>
            </div>
          ) : (
            <HabitCompletionGrid
              dateKeys={dateKeys}
              habits={habits}
              grid={grid}
              onToggle={handleToggle}
              saving={saving}
            />
          )}
        </div>

        {!loading && habits.length > 0 && (
          <p className="mt-4 text-xs text-foreground/50">
            Today is {todayKey}. Changes save automatically.
          </p>
        )}
      </div>
    </div>
  );
}
