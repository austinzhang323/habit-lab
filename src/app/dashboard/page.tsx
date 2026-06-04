"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  computeCompletionRate,
  computeCurrentStreak,
  countCompletionsForDate,
  getRecentDaySummaries,
  hasAnyCompletions,
} from "@/lib/habit-stats";
import {
  getDateKey,
  getRollingDateKeys,
  ROLLING_TRACKER_DAYS,
} from "@/lib/dates";

type Habit = {
  id: number;
  name: string;
  completedDates: string[];
};

const formatDateLabel = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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

  const todayKey = getDateKey();
  const todayStats = countCompletionsForDate(habits, todayKey);
  const completionRate = computeCompletionRate(habits, dateKeys);
  const streak = computeCurrentStreak(habits, dateKeys);
  const recentDays = getRecentDaySummaries(habits, dateKeys, 10);
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/70 text-sm font-medium">Today</p>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-success">
                  {todayStats.completed}/{todayStats.total}
                </p>
                <p className="text-sm text-foreground/50 mt-1">habits completed</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/70 text-sm font-medium">
                    {ROLLING_TRACKER_DAYS}-day average
                  </p>
                  <span className="text-2xl">📈</span>
                </div>
                <p className="text-3xl font-bold text-primary">{completionRate}%</p>
                <p className="text-sm text-foreground/50 mt-1">completion rate</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/70 text-sm font-medium">Current streak</p>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{streak}</p>
                <p className="text-sm text-foreground/50 mt-1">
                  {streak === 1 ? "day" : "days"} with activity
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Recent activity</h2>
              <div className="space-y-4">
                {recentDays.map((day) => (
                  <div
                    key={day.dateKey}
                    className="bg-white dark:bg-gray-900 border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatDateLabel(day.dateKey)}
                        </p>
                        <p className="text-sm text-foreground/50">
                          {day.completed}/{day.total} habits completed
                        </p>
                      </div>
                      <span className="text-2xl">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
