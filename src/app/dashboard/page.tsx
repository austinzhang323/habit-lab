"use client";

import { useEffect, useState } from "react";

type Checkin = {
  id: number;
  dateKey: string;
  energy: number;
  completedHabitIds: number[];
  createdAt: string;
};

export default function DashboardPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        const res = await fetch("/api/checkins");
        const data = await res.json();

        setCheckins((data.data || []).reverse());
      } catch (err) {
        console.error("Failed to fetch check-ins", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckins();
  }, []);

  const getEnergyColor = (value: number) => {
    if (value <= 3) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
    if (value <= 6) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
  };

  const calculateAverages = () => {
    if (checkins.length === 0) return { energy: 0, completedHabits: 0 };

    const energy = Math.round(checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length);
    const completedHabits = Math.round(
      checkins.reduce((sum, c) => sum + c.completedHabitIds.length, 0) / checkins.length
    );

    return { energy, completedHabits };
  };

  const averages = calculateAverages();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/70">Loading your check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-foreground/5 to-foreground/10 px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-foreground/70">Track your progress and insights</p>
        </div>

        {checkins.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-12 text-center">
            <p className="text-foreground/70 text-lg mb-6">No check-ins yet. Start tracking your habits!</p>
            <a
              href="/check-in"
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Create Your First Check-In →
            </a>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/70 text-sm font-medium">Average Energy</p>
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{averages.energy}/10</p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/70 text-sm font-medium">Avg Habits Completed</p>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-success">{averages.completedHabits}</p>
              </div>
            </div>

            {/* Check-ins List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Recent Check-ins</h2>
              <div className="space-y-4">
                {checkins.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-gray-900 border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(`${c.dateKey}T00:00:00`).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-foreground/50">Daily check-in</p>
                      </div>
                      <span className="text-3xl">⚡</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-foreground/50 mb-1">Energy</p>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEnergyColor(c.energy)}`}>
                          {c.energy}/10
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/50 mb-1">Habits Completed</p>
                        <p className="text-lg font-semibold text-foreground">
                          {c.completedHabitIds.length}
                        </p>
                      </div>
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
