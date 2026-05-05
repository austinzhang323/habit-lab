import { NextResponse } from "next/server";

type Habit = {
  id: number;
  name: string;
  description: string;
  frequency: string;
  category: string;
  createdAt: string;
  completedDates: string[];
};

type CreateHabitBody = {
  name?: string;
  description?: string;
  frequency?: string;
  category?: string;
};

type UpdateHabitBody = {
  id?: number;
  date?: string;
  completedToday?: boolean;
};

const allowedFrequencies = new Set(["daily", "weekly", "monthly"]);
const allowedCategories = new Set([
  "health",
  "productivity",
  "learning",
  "mindfulness",
  "fitness",
  "nutrition",
  "sleep",
  "other",
]);

const habits: Habit[] = [];

const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const serializeHabit = (habit: Habit) => ({
  ...habit,
  completedToday: habit.completedDates.includes(getDateKey()),
});

export async function GET() {
  return NextResponse.json({ data: habits.map(serializeHabit) });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateHabitBody;
    const name = body.name?.trim();
    const description = body.description?.trim() ?? "";
    const frequency = body.frequency ?? "daily";
    const category = body.category ?? "health";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Habit name is required" },
        { status: 400 }
      );
    }

    if (!allowedFrequencies.has(frequency)) {
      return NextResponse.json(
        { success: false, error: "Invalid frequency" },
        { status: 400 }
      );
    }

    if (!allowedCategories.has(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    const habit: Habit = {
      id: Date.now(),
      name,
      description,
      frequency,
      category,
      createdAt: new Date().toISOString(),
      completedDates: [],
    };

    habits.unshift(habit);

    return NextResponse.json(
      { success: true, data: serializeHabit(habit) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as UpdateHabitBody;

    if (typeof body.id !== "number") {
      return NextResponse.json(
        { success: false, error: "Habit id is required" },
        { status: 400 }
      );
    }

    const habit = habits.find((entry) => entry.id === body.id);
    const dateKey = body.date ?? getDateKey();

    if (!habit) {
      return NextResponse.json(
        { success: false, error: "Habit not found" },
        { status: 404 }
      );
    }

    if (typeof body.completedToday === "boolean") {
      if (body.completedToday) {
        if (!habit.completedDates.includes(dateKey)) {
          habit.completedDates.push(dateKey);
          habit.completedDates.sort();
        }
      } else {
        habit.completedDates = habit.completedDates.filter(
          (entry) => entry !== dateKey
        );
      }
    } else {
      if (habit.completedDates.includes(dateKey)) {
        habit.completedDates = habit.completedDates.filter(
          (entry) => entry !== dateKey
        );
      } else {
        habit.completedDates.push(dateKey);
        habit.completedDates.sort();
      }
    }

    return NextResponse.json({ success: true, data: serializeHabit(habit) });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}