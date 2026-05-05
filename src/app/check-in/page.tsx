"use client";

import { useState } from "react";

export default function CheckInPage() {
  const [form, setForm] = useState({
    sleepHours: "",
    energy: 5,
    mood: 5,
    focus: 5,
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (name: string, value: number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      console.log("Saved:", data);

      // reset form
      setForm({
        sleepHours: "",
        energy: 5,
        mood: 5,
        focus: 5,
        notes: "",
      });

      alert("Check-in saved successfully! 🎉");
    } catch (err) {
      console.error(err);
      alert("Failed to save check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 2) return "😞";
    if (value <= 4) return "😕";
    if (value <= 6) return "😐";
    if (value <= 8) return "🙂";
    return "😄";
  };

  const getEnergyEmoji = (value: number) => {
    if (value <= 2) return "🥱";
    if (value <= 4) return "😴";
    if (value <= 6) return "😑";
    if (value <= 8) return "⚡";
    return "🚀";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-foreground/5 to-foreground/10 px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Daily Check-In</h1>
          <p className="text-foreground/70">How are you feeling today?</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Sleep */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                😴 Sleep Hours
              </label>
              <input
                type="number"
                step="0.5"
                name="sleepHours"
                value={form.sleepHours}
                onChange={handleChange}
                placeholder="e.g. 7.5"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 transition-all"
                required
              />
              <p className="text-xs text-foreground/50">How many hours did you sleep last night?</p>
            </div>

            {/* Energy */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  ⚡ Energy Level
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

            {/* Mood */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  😊 Mood
                </label>
                <span className="text-2xl">{getMoodEmoji(form.mood)}</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.mood}
                  onChange={(e) =>
                    handleSliderChange("mood", Number(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-foreground/50">
                  <span>Very Bad</span>
                  <span className="font-semibold text-foreground">{form.mood}/10</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>

            {/* Focus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  🎯 Focus Level
                </label>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.focus}
                  onChange={(e) =>
                    handleSliderChange("focus", Number(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-success dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-foreground/50">
                  <span>Very Distracted</span>
                  <span className="font-semibold text-foreground">{form.focus}/10</span>
                  <span>Laser Focused</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                📝 Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any additional notes about your day..."
                rows={4}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 resize-none transition-all"
              />
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
