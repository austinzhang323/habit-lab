"use client";

import { useEffect, useRef, useState } from "react";

type Habit = {
  id: number;
  name: string;
  category: string;
  completedToday?: boolean;
};

type Checkin = {
  id: number;
  dateKey: string;
  energy: number;
  completedHabitIds: number[];
  createdAt: string;
};

const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export default function CheckInPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [form, setForm] = useState({ energy: 5 });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const hideToastTimerRef = useRef<number | null>(null);
  const clearToastTimerRef = useRef<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string, tone: "success" | "error") => {
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
  };

  useEffect(() => {
    const fetchDailyState = async () => {
      try {
        const [habitsResponse, checkinsResponse] = await Promise.all([
          fetch("/api/habits"),
          fetch("/api/checkins"),
        ]);

        const habitsData = await habitsResponse.json();
        const checkinsData = await checkinsResponse.json();

        if (!habitsResponse.ok) {
          throw new Error(habitsData.error || "Failed to load habits");
        }

        if (!checkinsResponse.ok) {
          throw new Error(checkinsData.error || "Failed to load check-ins");
        }

        const todayKey = getDateKey();
        const checkins = (checkinsData.data || []) as Checkin[];
        const todayCheckin = checkins.find((checkin) => checkin.dateKey === todayKey);

        const fetchedHabits = habitsData.data || [];
        setHabits(fetchedHabits);
        setSelectedHabitIds(
          fetchedHabits
            .filter((habit: Habit) => Boolean(habit.completedToday))
            .map((habit: Habit) => habit.id)
        );

        if (todayCheckin) {
          setForm({ energy: todayCheckin.energy });
          setLastUpdatedAt(todayCheckin.createdAt);
        }
      } catch (error) {
        console.error("Failed to fetch check-in state", error);
      } finally {
        setLoadingHabits(false);
      }
    };

    fetchDailyState();

    return () => {
      if (hideToastTimerRef.current !== null) {
        window.clearTimeout(hideToastTimerRef.current);
      }

      if (clearToastTimerRef.current !== null) {
        window.clearTimeout(clearToastTimerRef.current);
      }
    };
  }, []);

  const handleSliderChange = (name: string, value: number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleHabitSelection = (habitId: number) => {
    setSelectedHabitIds((prev) =>
      prev.includes(habitId)
        ? prev.filter((id) => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ energy: form.energy, completedHabitIds: selectedHabitIds }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      const habitUpdates = habits
        .map((habit) => {
          const shouldBeCompleted = selectedHabitIds.includes(habit.id);
          const currentlyCompleted = Boolean(habit.completedToday);

          if (shouldBeCompleted === currentlyCompleted) {
            return null;
          }

          return { id: habit.id, completedToday: shouldBeCompleted };
        })
        .filter((update): update is { id: number; completedToday: boolean } => Boolean(update));

      if (habitUpdates.length > 0) {
        const habitResponses = await Promise.all(
          habitUpdates.map((update) =>
            fetch("/api/habits", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(update),
            })
          )
        );

        const failedUpdate = habitResponses.find((response) => !response.ok);

        if (failedUpdate) {
          throw new Error("Failed to update one or more habits");
        }
      }

      setHabits((prev) =>
        prev.map((habit) => ({
          ...habit,
          completedToday: selectedHabitIds.includes(habit.id),
        }))
      );
      setLastUpdatedAt(data?.data?.createdAt ?? new Date().toISOString());

      console.log("Saved:", data);
      showToast("Check-in updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save check-in", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnergyEmoji = (value: number) => {
    if (value <= 2) return "😴";
    if (value <= 4) return "🥱";
    if (value <= 6) return "😑";
    if (value <= 8) return "⚡";
    return "🚀";
  };

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
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Daily Check-In</h1>
          <p className="text-foreground/70">Mark habits first, then rate your energy.</p>
          {lastUpdatedAt && (
            <p className="mt-2 text-sm text-foreground/60">
              Last updated today at{" "}
              {new Date(lastUpdatedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  1. Complete Habits
                </h2>
                <p className="text-xs text-foreground/50">
                  Select the habits you completed today.
                </p>
              </div>

              {loadingHabits ? (
                <p className="text-sm text-foreground/60">Loading habits...</p>
              ) : habits.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  No habits yet. Create some on the habits page.
                </p>
              ) : (
                <div className="space-y-2 rounded-xl border border-border bg-foreground/5 p-3">
                  {habits.map((habit) => {
                    const isSelected = selectedHabitIds.includes(habit.id);

                    return (
                      <label
                        key={habit.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                          habit.completedToday ? "bg-white/80" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleHabitSelection(habit.id)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {habit.name}
                            </p>
                            <p className="text-xs text-foreground/50 capitalize">
                              {habit.category.replace("-", " ")}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                            Done today
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Energy */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  2. Energy Level
                </label>
                <span className="text-2xl">{getEnergyEmoji(form.energy)}</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.energy}
                  onChange={(e) =>
                    handleSliderChange("energy", Number(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-foreground/50">
                  <span>Very Low</span>
                  <span className="font-semibold text-foreground">{form.energy}/10</span>
                  <span>Very High</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Check-In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
