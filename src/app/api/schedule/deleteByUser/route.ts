import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig"; // adjust path
import EventModel from "../../../models/events";
import ScheduleModel from "../../../models/schedule"; // import your Schedule model
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connect();

    const { userId } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    // --- ✅ UPDATED LOGIC ---

    // 1. Delete all of the old "Schedule" containers. This is safe.
    const schedulesDeleted = await ScheduleModel.deleteMany({ owner: userId });

    // 2. SMART DELETE: Delete only events that are NOT completed.
    // This preserves all your completed task history for the progress page.
    const eventsDeleted = await EventModel.deleteMany({
      owner: userId,
      isCompleted: false, // 👈 This is the new, "smart" logic
    });

    // --- END OF UPDATED LOGIC ---

    return NextResponse.json({
      success: true,
      message: `Deleted ${schedulesDeleted.deletedCount} schedule containers and ${eventsDeleted.deletedCount} pending events. Completed history was preserved.`,
    });
  } catch (err: any) {
    console.error("Error deleting user schedule:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}