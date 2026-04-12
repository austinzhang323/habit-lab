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

        alert("Check-in saved!");
    } catch (err) {
        console.error(err);
        alert("Failed to save check-in");
    }
    };


  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Daily Check-In</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Sleep */}
        <div>
          <label className="block font-medium mb-1">Sleep (hours)</label>
          <input
            type="number"
            name="sleepHours"
            value={form.sleepHours}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="e.g. 7.5"
          />
        </div>

        {/* Energy */}
        <div>
          <label className="block font-medium mb-1">
            Energy: {form.energy}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={form.energy}
            onChange={(e) =>
              handleSliderChange("energy", Number(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Mood */}
        <div>
          <label className="block font-medium mb-1">
            Mood: {form.mood}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={form.mood}
            onChange={(e) =>
              handleSliderChange("mood", Number(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Focus */}
        <div>
          <label className="block font-medium mb-1">
            Focus: {form.focus}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={form.focus}
            onChange={(e) =>
              handleSliderChange("focus", Number(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Anything notable today?"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:opacity-90"
        >
          Submit Check-In
        </button>
      </form>
    </div>
  );
}
