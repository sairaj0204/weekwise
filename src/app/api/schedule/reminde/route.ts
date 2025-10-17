import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig"; // Adjust path
import EventModel from "../../../models/events";      // Adjust path
import User from "../../../models/userModel";         // Adjust path
import { sendMail } from "../../../helpers/mailer";   // Adjust path

// Define a key for the user object when populated, to access fields
interface PopulatedUser {
  _id: string;
  email: string;
  isVerified: boolean;
}

// Define the structure of an Event document when retrieved with a populated owner
interface ReminderEventDocument extends Document {
  _id: string;
  owner: PopulatedUser;
  title: string;
  startTime: string;
  eventDate: Date;
  isNotified?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await connect();

    // --- 1. Define Time Window (2 minutes from now) ---
    const now = new Date();
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60000);

    // --- 2. Define IST offset (UTC+5:30) ---
    const IST_OFFSET_MINUTES = 330;

    // --- 3. Get start of the current day in UTC ---
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // --- 4. Fetch Events scheduled for today or later ---
    const eventsForReminder = await EventModel.find({
      eventDate: { $gte: startOfDay },
    })
      .select("owner title startTime eventDate isNotified")
      .populate<{ owner: PopulatedUser }>("owner", "email isVerified");

    const emailsSent: string[] = [];

    // --- 5. Iterate and handle reminder logic ---
    for (const event of eventsForReminder) {
      const [hours, minutes] = event.startTime.split(":").map(Number);

      // Reconstruct the event's local IST datetime
      const eventStartDateTime = new Date(event.eventDate);
      eventStartDateTime.setHours(hours, minutes, 0, 0);

      // Convert IST time → UTC for accurate comparison
      const eventTimeUTC = new Date(eventStartDateTime.getTime() - IST_OFFSET_MINUTES * 60000);

      // Compare using UTC now and UTC event time
      if (
        eventTimeUTC > now &&
        eventTimeUTC <= twoMinutesFromNow &&
        !event.isNotified
      ) {
        const user = event.owner;

        if (user && user.email && user.isVerified) {
          try {
            // Send reminder email
            await sendMail({
              email: user.email,
              emailType: "REMINDER",
              taskTitle: event.title,
              startTime: event.startTime,
              userId: user._id.toString(),
            });

            // Mark event as notified
            await EventModel.findByIdAndUpdate(event._id, { isNotified: true });

            emailsSent.push(`${event.title} to ${user.email}`);
          } catch (mailError: any) {
            console.error(
              `Error sending email for event ${event._id}: ${mailError.message}`
            );
            // Leave as unnotified for retry in next run
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      message: `Reminder check completed. ${emailsSent.length} emails scheduled.`,
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