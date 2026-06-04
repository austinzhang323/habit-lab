import { NextResponse } from "next/server";
import {
  allowedCategories,
  allowedFrequencies,
  habits,
  serializeHabit,
  setCompletion,
  toggleCompletion,
  type Habit,
} from "@/lib/habit-store";
import { getDateKey } from "@/lib/dates";

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
  name?: string;
  description?: string;
  category?: string;
};

type DeleteHabitBody = {
  id?: number;
};

export async function GET() {
  return NextResponse.json({ data: habits.map(serializeHabit) });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateHabitBody;
    const name = body.name?.trim();
    const description = body.description?.trim() ?? "";
    const frequency = "daily";
    const category = body.category ?? "exercise";

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

    const hasMetadataUpdate =
      typeof body.name === "string" ||
      typeof body.description === "string" ||
      typeof body.category === "string";

    if (hasMetadataUpdate) {
      const nextName = body.name !== undefined ? body.name.trim() : habit.name;
      const nextDescription =
        body.description !== undefined ? body.description.trim() : habit.description;
      const nextCategory = body.category !== undefined ? body.category : habit.category;

      if (!nextName) {
        return NextResponse.json(
          { success: false, error: "Habit name is required" },
          { status: 400 }
        );
      }

      if (!allowedCategories.has(nextCategory)) {
        return NextResponse.json(
          { success: false, error: "Invalid category" },
          { status: 400 }
        );
      }

      habit.name = nextName;
      habit.description = nextDescription;
      habit.category = nextCategory;

      return NextResponse.json({ success: true, data: serializeHabit(habit) });
    }

    if (typeof body.completedToday === "boolean") {
      setCompletion(habit, dateKey, body.completedToday);
    } else {
      toggleCompletion(habit, dateKey);
    }

    return NextResponse.json({ success: true, data: serializeHabit(habit) });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as DeleteHabitBody;

    if (typeof body.id !== "number") {
      return NextResponse.json(
        { success: false, error: "Habit id is required" },
        { status: 400 }
      );
    }

    const habitIndex = habits.findIndex((entry) => entry.id === body.id);

    if (habitIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Habit not found" },
        { status: 404 }
      );
    }

    const [deletedHabit] = habits.splice(habitIndex, 1);

    return NextResponse.json({
      success: true,
      data: {
        id: deletedHabit.id,
        name: deletedHabit.name,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
