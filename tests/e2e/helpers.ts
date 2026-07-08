import type { APIRequestContext } from "@playwright/test";

export const resetHabits = async (request: APIRequestContext) => {
  const response = await request.post("/api/test/reset");

  if (!response.ok()) {
    throw new Error(`Failed to reset habits: ${response.status()}`);
  }
};

export const createHabit = async (
  request: APIRequestContext,
  data: { name: string; category?: string; description?: string }
) => {
  const response = await request.post("/api/habits", {
    data: {
      name: data.name,
      description: data.description ?? "",
      category: data.category ?? "exercise",
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create habit: ${response.status()}`);
  }

  const body = (await response.json()) as { data: { id: number; name: string } };
  return body.data;
};

export const markHabitComplete = async (
  request: APIRequestContext,
  habitId: number,
  date?: string
) => {
  const response = await request.patch("/api/habits/completions", {
    data: {
      updates: [{ habitId, date: date ?? new Date().toISOString().slice(0, 10), completed: true }],
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to mark habit complete: ${response.status()}`);
  }
};
