import { NextResponse } from "next/server";
import {
  applyCompletionUpdates,
  habits,
  serializeHabit,
  type CompletionUpdate,
} from "@/lib/habit-store";

type PatchCompletionsBody = {
  updates?: CompletionUpdate[];
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as PatchCompletionsBody;
    const updates = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "updates array is required" },
        { status: 400 }
      );
    }

    for (const update of updates) {
      if (typeof update.habitId !== "number") {
        return NextResponse.json(
          { success: false, error: "Each update requires habitId" },
          { status: 400 }
        );
      }

      if (typeof update.date !== "string" || typeof update.completed !== "boolean") {
        return NextResponse.json(
          { success: false, error: "Each update requires date and completed" },
          { status: 400 }
        );
      }
    }

    const result = applyCompletionUpdates(updates);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: habits.map(serializeHabit),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
