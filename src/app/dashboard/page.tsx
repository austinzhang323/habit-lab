"use client";

import { useEffect, useState } from "react";

type Checkin = {
  id: number;
  sleepHours: string;
  energy: number;
  mood: number;
  focus: number;
  notes: string;
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {checkins.length === 0 ? (
        <p className="text-gray-500">No check-ins yet.</p>
      ) : (
        <div className="space-y-4">
          {checkins.map((c) => (
            <div
              key={c.id}
              className="border rounded p-4 shadow-sm bg-white"
            >
              <div className="text-sm text-gray-500 mb-2">
                {new Date(c.createdAt).toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <p>😴 Sleep: {c.sleepHours} hrs</p>
                <p>⚡ Energy: {c.energy}</p>
                <p>😊 Mood: {c.mood}</p>
                <p>🎯 Focus: {c.focus}</p>
              </div>

              {c.notes && (
                <p className="mt-2 text-gray-700">
                  📝 {c.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
