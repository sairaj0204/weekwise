import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig";
import EventModel from "../../../models/events";

export async function GET(req: NextRequest) {
  try {
    await connect();

    // Get current date in local time (India)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find events that fall within today's date range
    const events = await EventModel.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Return a consistent structure like week API
    const result = [
      {
        day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        date: startOfDay,
        events,
      },
    ];

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error in getToday route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
