import { NextRequest, NextResponse } from "next/server";
// @ts-ignore (Assuming connect is a JS file or has type issues)
import { connect } from "../../../dbConfig/dbConfig";
// @ts-ignore (Assuming EventModel is a JS file or has type issues)
import EventModel from "../../../models/events";
// @ts-ignore (Assuming sendMail is a JS file or has type issues)
import { sendMail } from "../../../helpers/mailer";
import { Document } from "mongoose"; // Import Document type

interface PopulatedUser {
  _id: string;
  email: string;
  isVerified: boolean;
  timezone: string; // ✅ ADDED TIMEZONE
}

interface ReminderEventDocument extends Document {
  _id: string;
  owner: PopulatedUser;
  title: string;
  startTime: string;
  eventDate: Date;
  isNotified?: boolean;
}

/**
 * Calculates the UTC offset in minutes for a given date and timezone.
 * This handles Daylight Saving Time (DST) correctly.
 * @param date The specific date for which to find the offset.
 * @param timezone The IANA timezone name (e.g., "America/New_York" or "Asia/Kolkata").
 * @returns The offset from UTC in minutes (e.g., -240 for EDT, 330 for IST).
 */
function getOffsetInMinutes(date: Date, timezone: string): number {
  try {
    // Format the date into its constituent parts *in the target timezone*
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Use 24-hour time
    });

    const parts = formatter.formatToParts(date);
    const map = new Map(parts.map(p => [p.type, p.value]));

    // Intl.DateTimeFormat can return '24' for hour, which Date.parse dislikes.
    const hour = map.get('hour') === '24' ? '00' : map.get('hour');
    
    // Reconstruct an ISO-like string representing the *local time* in that timezone.
    const localTimeStr = `${map.get('year')}-${map.get('month')}-${map.get('day')}T${hour}:${map.get('minute')}:${map.get('second')}`;
    
    // Create a Date object from this local time string.
    // The JS engine will parse this string *as if it's in the server's local timezone*.
    const localDate = new Date(localTimeStr);
    
    // Get the timestamp for the original UTC date.
    const utcTime = date.getTime();
    
    // Get the timestamp for the date the server *thinks* localTimeStr is.
    const localTime = localDate.getTime();

    // The offset in milliseconds is the difference.
    // (e.g., localTime (5:30 AM server time) - utcTime (12:00 AM server time))
    const offsetMs = localTime - utcTime;
    
    return offsetMs / 60000; // Convert milliseconds to minutes

  } catch (e: any) {
    console.error(`Failed to get offset for timezone ${timezone}: ${e.message}`);
    // Fallback to 0 offset if timezone is invalid
    return 0;
  }
}


export async function GET(request: NextRequest) {
  try {
    await connect();

    // 1. GET CURRENT TIME (UTC)
    // 'now' is the exact UTC time the cron job is running.
    const now = new Date();
    
    // 'twoMinutesFromNow' is the upper bound of our check window.
    // We are looking for events in the window: (now, twoMinutesFromNow]
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60000);

    // 2. GET EVENTS
    // Get all events from the start of the server's day.
    // This is a reasonable filter to reduce the documents we process.
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const eventsForReminder = await EventModel.find({
      eventDate: { $gte: startOfDay }, // Find events for today (server time)
      isNotified: { $ne: true }       // That have not been notified
    })
      .select("owner title startTime eventDate isNotified")
      // ✅ POPULATE THE USER'S TIMEZONE
      .populate<{ owner: PopulatedUser }>("owner", "email isVerified timezone");

    const emailsSent: string[] = [];

    // 3. PROCESS EVENTS
    for (const event of eventsForReminder) {
      
      // Ensure we have a valid user and timezone
      if (!event.owner || !event.owner.timezone) {
        console.warn(`Event ${event._id} is missing owner or timezone. Skipping.`);
        continue;
      }
      
      // --- Calculate Event's True UTC Time ---

      // a. Get event time parts
      const [hours, minutes] = event.startTime.split(":").map(Number);

      // b. Create a Date object for the event's date (e.g., 2025-10-25T00:00:00Z)
      const eventBaseDate = new Date(event.eventDate);
      
      // c. Set the time, creating a timestamp *as if* the user's time was UTC.
      // e.g., If event is 14:30, this creates a date for 14:30 UTC.
      eventBaseDate.setUTCHours(hours, minutes, 0, 0);
      const eventTimeAsUTC = eventBaseDate.getTime();

      // d. Get the user's *actual* timezone offset for that day
      const userOffsetInMinutes = getOffsetInMinutes(event.eventDate, event.owner.timezone);

      // e. Calculate the *true* UTC time by subtracting the offset.
      // e.g., (14:30 UTC) - (330 min for IST) = 09:00 UTC.
      // e.g., (14:30 UTC) - (-240 min for EDT) = 18:30 UTC.
      const eventTimeUTC = new Date(eventTimeAsUTC - (userOffsetInMinutes * 60000));
      
      // --- Check if event is in the reminder window ---

      if (
        eventTimeUTC > now &&             // Event is in the future
        eventTimeUTC <= twoMinutesFromNow && // Event is within the next 2 minutes
        !event.isNotified                 // (Redundant check, but safe)
      ) {
        const user = event.owner;

        // Final check on user
        if (user && user.email && user.isVerified) {
          try {
            // Send the email
            await sendMail({
              email: user.email,
              emailType: "REMINDER",
              taskTitle: event.title,
              startTime: event.startTime, // Pass the user's local time string
              userId: user._id.toString(),
              taskId: event._id.toString()
            });

            // Mark as notified so it doesn't send again
            await EventModel.findByIdAndUpdate(event._id, { isNotified: true });

            emailsSent.push(`${event.title} to ${user.email}`);
          } catch (mailError: any) {
            console.error(
              `Error sending email for event ${event._id}: ${mailError.message}`
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      message: `Reminder check completed. ${emailsSent.length} emails sent.`,
      sentEmails: emailsSent,
    });
  } catch (error: any) {
    console.error("Reminders API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error during reminder check.",
      },
      { status: 500 }
    );
  }
}