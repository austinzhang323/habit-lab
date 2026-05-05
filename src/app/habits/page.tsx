"use client";

import { useState, useEffect } from "react";

type Habit = {
  id: number;
  name: string;
  description: string;
  frequency: string;
  category: string;
  createdAt: string;
  completedToday?: boolean;
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "daily",
    category: "health",
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      // Since we don't have a habits API yet, we'll use mock data
      // In a real app, you would fetch from /api/habits
      setHabits([]);
    } catch (err) {
      console.error("Failed to fetch habits", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add habit logic would go here
    console.log("New habit:", formData);
    alert("Habit feature coming soon! 🚀");
    setShowForm(false);
    setFormData({ name: "", description: "", frequency: "daily", category: "health" });
  };

  const categoryEmojis: Record<string, string> = {
    health: "🏃",
    productivity: "💼",
    learning: "📚",
    mindfulness: "🧘",
    fitness: "💪",
    nutrition: "🥗",
    sleep: "😴",
    other: "⭐",
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Every Day",
    weekly: "Weekly",
    monthly: "Monthly",
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
                    <option value="health">🏃 Health</option>
                    <option value="productivity">💼 Productivity</option>
                    <option value="learning">📚 Learning</option>
                    <option value="mindfulness">🧘 Mindfulness</option>
                    <option value="fitness">💪 Fitness</option>
                    <option value="nutrition">🥗 Nutrition</option>
                    <option value="sleep">😴 Sleep</option>
                    <option value="other">⭐ Other</option>
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

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Create Habit
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
                  </div>
                </div>

                {habit.description && (
                  <p className="text-foreground/70 text-sm mb-4">
                    {habit.description}
                  </p>
                )}

                <button className="w-full px-4 py-2 bg-success text-white font-semibold rounded-lg hover:bg-success/90 transition-colors">
                  Mark Complete ✓
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
