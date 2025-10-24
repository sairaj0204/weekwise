import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig";
import EventModel from "../../../models/events";
import UserModel from "../../../models/userModel"; // ✅ Import User model
import mongoose from "mongoose";

/**
 * Calculates the start of today in the user's timezone.
 */
function getStartOfToday(userTimezone: string): Date {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const userTodayStr = dateFormatter.format(now); // e.g., "2025-10-24"
  // Create a date object from the string, which JS interprets in its local (server) time.
  // We will compare this against the eventDate stored in UTC.
  return new Date(userTodayStr); 
}

/**
 * Calculates stats for a given array of events.
 */
function calculateStats(events: any[]) {
  const total = events.length;
  const completed = events.filter(event => event.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

export async function GET(request: NextRequest) {
  try {
    await connect();

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: "Missing or invalid userId" }, { status: 400 });
    }

    // --- 1. Get User's Timezone ---
    const user = await UserModel.findById(userId).select("timezone").lean();
    const userTimezone = user?.timezone || "UTC"; // Default to UTC

    // --- 2. Get Date Ranges ---
    const startOfToday = getStartOfToday(userTimezone);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000); // Today + previous 6 days

    // --- 3. Fetch All Events Once ---
    const allEvents = await EventModel.find({ owner: userId }).lean();

    // --- 4. Filter Events ---
    const todayEvents = allEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      return eventDate >= startOfToday && eventDate < startOfTomorrow;
    });

    const thisWeekEvents = allEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      return eventDate >= sevenDaysAgo && eventDate < startOfTomorrow;
    });

    // --- 5. Calculate Stats ---
    const allTimeStats = calculateStats(allEvents);
    const todayStats = calculateStats(todayEvents);
    const thisWeekStats = calculateStats(thisWeekEvents);

    // --- 6. Calculate Progress by Category ---
    const categoryMap = new Map<string, { completed: number, total: number }>();
    for (const event of allEvents) {
      const category = event.category || "other";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { completed: 0, total: 0 });
      }
      const stats = categoryMap.get(category)!;
      stats.total += 1;
      if (event.isCompleted) {
        stats.completed += 1;
      }
    }

    const byCategory = Array.from(categoryMap, ([category, stats]) => ({
      category,
      ...stats,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

    // --- 7. Return Meaningful Data ---
    return NextResponse.json({
      success: true,
      allTime: allTimeStats,
      today: todayStats,
      thisWeek: thisWeekStats,
      byCategory,
    });

  } catch (error: any) {
    console.error("API Error fetching progress:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}