import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig";
import EventModel from "../../../models/events";

export async function GET(request: NextRequest) {
  try {
    await connect();

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, message: "Missing userId" }, { status: 400 });
    }

    // Fetch all events for the user
    const allEvents = await EventModel.find({ owner: userId });

    const total = allEvents.length;
    const completed = allEvents.filter(event => event.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({ success: true, completed, total, percentage });
  } catch (error: any) {
    console.error("API Error fetching progress:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
