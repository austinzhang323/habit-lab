"use client";

import { useState, useEffect, useRef } from "react";

type Habit = {
  id: number;
  name: string;
  description: string;
  frequency: string;
  category: string;
  createdAt: string;
  completedDates: string[];
  completedToday?: boolean;
};

const formatDateLabel = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "daily",
    category: "exercise",
  });
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    category: "exercise",
  });
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string, tone: "success" | "error") => {
    setToast({ message, tone });

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4200);
  };

  useEffect(() => {
    fetchHabits();

    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/habits");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load habits");
      }

      setHabits(data.data || []);
    } catch (err) {
      console.error("Failed to fetch habits", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create habit");
      }

      setHabits((prev) => [data.data, ...prev]);
      setShowForm(false);
      setFormData({
        name: "",
        description: "",
        frequency: "daily",
        category: "exercise",
      });
      showToast("Habit created", "success");
    } catch (err) {
      console.error("Failed to create habit", err);
      showToast("Failed to create habit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryEmojis: Record<string, string> = {
    sleep: "😴",
    cleaning: "🧹",
    exercise: "🏋️",
    food: "🍽️",
    water: "💧",
    "spiritual-growth": "🙏",
    relational: "🤝",
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Every Day",
  };

  const categoryLabels: Record<string, string> = {
    sleep: "Sleep",
    cleaning: "Cleaning",
    exercise: "Exercise",
    food: "Food",
    water: "Water",
    "spiritual-growth": "Spiritual Growth",
    relational: "Relational",
  };

  const getRecentCompletionDates = (habit: Habit) =>
    [...habit.completedDates].sort().reverse().slice(0, 5);

  const startEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditData({
      name: habit.name,
      description: habit.description || "",
      category: habit.category,
    });
  };

  const cancelEditHabit = () => {
    setEditingHabitId(null);
    setEditData({
      name: "",
      description: "",
      category: "exercise",
    });
  };

  const saveHabitEdit = async (habitId: number) => {
    setIsSavingEdit(true);

    try {
      const response = await fetch("/api/habits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: habitId,
          name: editData.name,
          description: editData.description,
          category: editData.category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update habit");
      }

      setHabits((prev) =>
        prev.map((habit) => (habit.id === habitId ? data.data : habit))
      );
      cancelEditHabit();
      showToast("Habit updated", "success");
    } catch (err) {
      console.error("Failed to update habit", err);
      showToast("Failed to update habit", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/70">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-foreground/5 to-foreground/10 px-4 sm:px-6 lg:px-8 py-12">
      {toast && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none px-4">
          <div
            className={`rounded-lg border px-4 py-2 text-sm font-semibold shadow-lg ${
              toast.tone === "success"
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Habits</h1>
            <p className="text-foreground/70">Create and track your daily habits</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            + New Habit
          </button>
        </div>

        {/* New Habit Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Create a New Habit</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-foreground">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Morning Exercise"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-foreground">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                  >
                    <option value="sleep">😴 Sleep</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="exercise">🏋️ Exercise</option>
                    <option value="food">🍽️ Food</option>
                    <option value="water">💧 Water</option>
                    <option value="spiritual-growth">🙏 Spiritual Growth</option>
                    <option value="relational">🤝 Relational</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Why is this habit important to you?"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 resize-none"
                />
              </div>

              <div className="space-y-2">
                <p className="block text-sm font-semibold text-foreground">Frequency</p>
                <p className="rounded-lg border border-border bg-foreground/5 px-4 py-2 text-sm text-foreground/80">
                  Every Day
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {isSubmitting ? "Creating..." : "Create Habit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-2 border border-border text-foreground font-semibold rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border p-12 text-center">
            <div className="mb-6">
              <span className="text-6xl">✨</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">No habits yet</h3>
            <p className="text-foreground/70 mb-6">Start building better habits today by creating your first one!</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Create Your First Habit →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-border p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">
                        {categoryEmojis[habit.category] || "⭐"}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">
                        {habit.name}
                      </h3>
                    </div>
                    <p className="text-sm text-foreground/70">
                      {frequencyLabels[habit.frequency]}
                    </p>
                    <p className="text-xs text-foreground/55">
                      {categoryLabels[habit.category] || "Uncategorized"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditHabit(habit)}
                    className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    Edit
                  </button>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-lg bg-foreground/5 px-3 py-2 text-sm">
                  <span className="text-foreground/70">Completions logged</span>
                  <span className="font-semibold text-foreground">
                    {habit.completedDates.length}
                  </span>
                </div>

                {editingHabitId === habit.id ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Habit Name
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Category
                      </label>
                      <select
                        value={editData.category}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, category: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                      >
                        <option value="sleep">😴 Sleep</option>
                        <option value="cleaning">🧹 Cleaning</option>
                        <option value="exercise">🏋️ Exercise</option>
                        <option value="food">🍽️ Food</option>
                        <option value="water">💧 Water</option>
                        <option value="spiritual-growth">🙏 Spiritual Growth</option>
                        <option value="relational">🤝 Relational</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Description
                      </label>
                      <textarea
                        value={editData.description}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveHabitEdit(habit.id)}
                        disabled={isSavingEdit}
                        className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {isSavingEdit ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditHabit}
                        className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {habit.description && (
                      <p className="text-foreground/70 text-sm mb-4">
                        {habit.description}
                      </p>
                    )}

                    {habit.completedDates.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                          Recent History
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getRecentCompletionDates(habit).map((dateKey) => (
                            <span
                              key={dateKey}
                              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                            >
                              {formatDateLabel(dateKey)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="rounded-lg bg-foreground/5 px-4 py-2 text-center text-sm text-foreground/70">
                      Complete this habit in Daily Check-In
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
