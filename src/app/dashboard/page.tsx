"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  computePerHabitStats,
  getBestCurrentStreak,
  hasAnyCompletions,
} from "@/lib/habit-stats";
import { getRollingDateKeys, ROLLING_TRACKER_DAYS } from "@/lib/dates";

type Habit = {
  id: number;
  name: string;
  createdAt: string;
  completedDates: string[];
};

export default function DashboardPage() {
  const dateKeys = useMemo(
    () => getRollingDateKeys(ROLLING_TRACKER_DAYS),
    []
  );
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const res = await fetch("/api/habits");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load habits");
        }

        setHabits(data.data || []);
      } catch (err) {
        console.error("Failed to fetch habits", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchHabits();
  }, []);

  const perHabitStats = useMemo(
    () => computePerHabitStats(habits, dateKeys),
    [habits, dateKeys]
  );
  const { bestStreak, habitNames } = useMemo(
    () => getBestCurrentStreak(perHabitStats),
    [perHabitStats]
  );
  const activeStreaks = useMemo(
    () =>
      [...perHabitStats]
        .filter((stat) => stat.streak > 1)
        .sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name)),
    [perHabitStats]
  );
  const completionRates = useMemo(
    () => [...perHabitStats].sort((a, b) => a.name.localeCompare(b.name)),
    [perHabitStats]
  );
  const anyCompletions = hasAnyCompletions(habits);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-foreground/5 to-foreground/10 px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-foreground/70">Track your progress and insights</p>
          </div>
          {habits.length > 0 && anyCompletions && (
            <Link
              href="/tracker"
              className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
            >
              Open tracker →
            </Link>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-12 text-center">
            <p className="text-foreground/70 text-lg mb-6">
              No habits yet. Create habits to start tracking your progress.
            </p>
            <Link
              href="/habits"
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Create habits →
            </Link>
          </div>
        ) : !anyCompletions ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-12 text-center">
            <p className="text-foreground/70 text-lg mb-6">
              No completions yet. Mark your first habits in the tracker.
            </p>
            <Link
              href="/tracker"
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Start tracking →
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {bestStreak >= 1 && (
              <div className="max-w-md">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-foreground/70 text-sm font-medium">
                      Current streak
                    </p>
                    <span className="text-2xl">🔥</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{bestStreak}</p>
                  <p className="text-sm text-foreground/50 mt-1">
                    {bestStreak === 1 ? "day" : "days"}
                    {habitNames.length > 0 && (
                      <>
                        {" "}
                        · {habitNames.join(", ")}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Streaks by habit</h2>
              {activeStreaks.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                  <p className="text-foreground/70">
                    No multi-day streaks yet — complete a habit two days in a row
                    to appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-6 py-3 text-sm font-semibold text-foreground/70">
                          Habit
                        </th>
                        <th className="px-6 py-3 text-sm font-semibold text-foreground/70">
                          Streak
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStreaks.map((stat) => (
                        <tr
                          key={stat.habitId}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-6 py-4 font-medium text-foreground">
                            {stat.name}
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {stat.streak} {stat.streak === 1 ? "day" : "days"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-sm text-foreground/50">
                Consecutive completed days in the last {ROLLING_TRACKER_DAYS} trackable
                days
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Completion rate by habit
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-sm font-semibold text-foreground/70">
                        Habit
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-foreground/70">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completionRates.map((stat) => (
                      <tr
                        key={stat.habitId}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {stat.name}
                        </td>
                        <td className="px-6 py-4 text-primary font-semibold">
                          {stat.completionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-foreground/50">
                Last {ROLLING_TRACKER_DAYS} trackable days per habit
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
