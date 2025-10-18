import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig"; // adjust path
import EventModel from "../../../models/events";
import ScheduleModel from "../../../models/schedule"; // import your Schedule model

export async function POST(req: NextRequest) {
  try {
    await connect();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });
    }

    // Find all schedules for the user
    const userSchedules = await ScheduleModel.find({ owner: userId }).select("_id");

    const scheduleIds = userSchedules.map((s) => s._id);

    // Delete all events for these schedules
    const eventsDeleted = await EventModel.deleteMany({ scheduleId: { $in: scheduleIds } });

    // Delete the schedules themselves
    const schedulesDeleted = await ScheduleModel.deleteMany({ owner: userId });

    return NextResponse.json({
      success: true,
      message: `Deleted ${schedulesDeleted.deletedCount} schedules and ${eventsDeleted.deletedCount} events for user ${userId}`,
    });
  } catch (err: any) {
    console.error("Error deleting user schedule:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
