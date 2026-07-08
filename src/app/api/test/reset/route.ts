import { NextResponse } from "next/server";
import { resetHabitsForTests } from "@/lib/habit-store";

export async function POST() {
  if (process.env.E2E_TEST !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  resetHabitsForTests();

  return NextResponse.json({ success: true });
}
