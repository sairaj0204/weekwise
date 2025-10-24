import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import { connect } from "../../../dbConfig/dbConfig";
// @ts-ignore
import EventModel from "../../../models/events"; // ✅ We now use EventModel
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connect();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing userId parameter." },
        { status: 400 }
      );
    }

    // --- ✅ New Logic: Query EventModel for the next 7 days ---

    // 1. Get today's date (at midnight in server time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Get the date 7 days from now
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 3. Find all events for this user within that date range
    const weekEvents = await EventModel.find({
      owner: userId,
      eventDate: {
        $gte: today, // Greater than or equal to the start of today
        $lt: sevenDaysFromNow, // Less than 7 days from now
      },
    })
      .sort({ eventDate: 1, startTime: 1 }) // Sort by date, then time
      .lean(); // Use .lean() for faster, plain JSON objects

    // 4. Return the flat array of events
    return NextResponse.json({ success: true, events: weekEvents });
  } catch (error: any) {
    console.error("API Error fetching weekly schedule:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch weekly schedule." },
      { status: 500 }
    );
  }
}