// File: src/app/api/schedule/exists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig";
import EventModel from "../../../models/events";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Check if any events exist for this user
    const eventCount = await EventModel.countDocuments({ owner: userId });

    return NextResponse.json({ hasSchedule: eventCount > 0 });
  } catch (err: any) {
    console.error("Schedule exists check failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
