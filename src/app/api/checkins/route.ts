import { NextResponse } from "next/server";

// temporary in-memory store
let checkins: any[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newCheckin = {
      id: Date.now(),
      ...body,
      createdAt: new Date(),
    };

    checkins.push(newCheckin);

    return NextResponse.json({ success: true, data: newCheckin });
  } catch (error) {
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
