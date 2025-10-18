import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig";
import ScheduleModel from "../../../models/schedule";
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

    const scheduleDoc = await ScheduleModel.findOne({ owner: userId });
    if (!scheduleDoc) {
      return NextResponse.json({ success: false, events: [] });
    }

    const { scheduleData } = scheduleDoc;

    // Extract all days' events from the week
    const weekEvents = scheduleData.daily_schedule.map((day: any) => ({
      date: day.date,
      day_of_week: day.day_of_week,
      events: day.events,
    }));

    return NextResponse.json({ success: true, events: weekEvents });
  } catch (error: any) {
    console.error("API Error fetching weekly schedule:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch weekly schedule." },
      { status: 500 }
    );
  }
}
