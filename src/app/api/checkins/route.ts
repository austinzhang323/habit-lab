import { NextResponse } from "next/server";

type Checkin = {
  id: number;
  dateKey: string;
  energy: number;
  completedHabitIds: number[];
  createdAt: string;
};

type CreateCheckinBody = {
  energy?: number;
  completedHabitIds?: number[];
};

// temporary in-memory store
let checkins: Checkin[] = [];

const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateCheckinBody;
    const energy = Number(body.energy);
    const completedHabitIds = Array.isArray(body.completedHabitIds)
      ? body.completedHabitIds.filter((id) => Number.isInteger(id))
      : [];

    if (!Number.isFinite(energy) || energy < 1 || energy > 10) {
      return NextResponse.json(
        { success: false, error: "Energy must be between 1 and 10" },
        { status: 400 }
      );
    }

    const dateKey = getDateKey();
    const existingIndex = checkins.findIndex((entry) => entry.dateKey === dateKey);

    const newCheckin: Checkin = {
      id: existingIndex >= 0 ? checkins[existingIndex].id : Date.now(),
      dateKey,
      energy,
      completedHabitIds,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      checkins[existingIndex] = newCheckin;
    } else {
      checkins.push(newCheckin);
    }

    return NextResponse.json({ success: true, data: newCheckin });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

// optional: GET to verify data
export async function GET() {
  return NextResponse.json({ data: checkins });
}
