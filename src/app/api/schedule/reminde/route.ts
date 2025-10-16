import { NextRequest, NextResponse } from "next/server";
import { connect } from "../../../dbConfig/dbConfig"; // Adjust path
import EventModel from "../../../models/events";      // Adjust path
import User from "../../../models/userModel";         // Adjust path
import { sendMail } from "../../../helpers/mailer";      // Adjust path

// // Define a key for the user object when populated, to access fields
// interface PopulatedUser {
//     _id: string;
//     email: string;
//     isVerified: boolean;
// }

// export async function GET(request: NextRequest) {
//     // ⚠️ CRON SECURITY CHECK: You should add a check here 
//     // to ensure this route is only called by your external Cron service,
//     // usually by checking a secret key in the header or query parameters.
//     // e.g.: if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) { ... }

//     try {
//         await connect();

//         const now = new Date();
//         const twoMinutesFromNow = new Date(now.getTime() + 2 * 60000); 

//         // Convert times to HH:MM strings for comparison, accounting for timezone 
//         // NOTE: This assumes the user's local time (Asia/Kolkata) is handled by the client 
//         // when creating the HH:MM strings. This logic works best if the database stores 
//         // UTC time equivalent to the user's scheduled time.

//         // Get the current day's start time in UTC for the $gte query
//         const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

//         // 1. Fetch Events scheduled for today or tomorrow that haven't passed
//         const eventsForReminder = await EventModel.find({
//             // Find all events with an eventDate greater than or equal to the start of today
//             eventDate: { $gte: startOfDay } 
//         })
//         .select('owner title startTime eventDate')
//         .populate<{ owner: PopulatedUser }>('owner', 'email isVerified'); // Populate user data

//         const emailsSent: string[] = [];

//         // 2. Iterate and filter based on the HH:MM string within the 2-minute window
//         for (const event of eventsForReminder) {
            
//             const [hours, minutes] = event.startTime.split(':').map(Number);
            
//             // Reconstruct the event's full start time using the stored date and string time
//             const eventStartDateTime = new Date(event.eventDate);
//             // Set hours/minutes based on the string time (assuming this time is relative to the timezone the user set,
//             // but stored in a way that aligns with the local comparison context).
//             eventStartDateTime.setHours(hours, minutes, 0, 0); 
            
//             // Check if this task starts between NOW and 2 minutes from NOW
//             if (eventStartDateTime > now && eventStartDateTime <= twoMinutesFromNow ) {
                
//                 const user = event.owner;
                
//                 if (user && user.email && user.isVerified) {
//                     await sendMail({
//                         email: user.email,
//                         emailType: "REMINDER",
//                         taskTitle: event.title,
//                         startTime: event.startTime,
//                         userId: user._id.toString() 
//                     });
//                     emailsSent.push(`${event.title} to ${user.email}`);
//                 }
//             }
//         }

//         return NextResponse.json({
//             success: true,
//             timestamp: now,
//             message: `Reminder check completed. ${emailsSent.length} emails scheduled.`,
//             sentEmails: emailsSent
//         });

//     } catch (error: any) {
//         console.error("Reminders API Error:", error);
//         return NextResponse.json(
//             { success: false, message: error.message || "Internal server error during reminder check." },
//             { status: 500 }
//         );
//     }
// }
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
    isNotified?: boolean; // Use optional to account for older null/undefined docs
}

export async function GET(request: NextRequest) {
    try {
        await connect();
        
        // --- 1. Define Time Window (2 minutes from now) ---
        const now = new Date();
        // Current time is Thursday, October 16, 2025 at 11:18:23 PM IST (UTC is 5.5 hours behind)
        // Two minutes from now: ~11:20:23 PM IST
        const twoMinutesFromNow = new Date(now.getTime() + 2 * 60000); 

        // Get the current day's start time in UTC for the query filter
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // --- 2. Fetch Events ---
        // Fetch all events for today and populate the owner's email and verification status
        const eventsForReminder = await EventModel.find({
            eventDate: { $gte: startOfDay } 
        })
        .select('owner title startTime eventDate isNotified')
        .populate<{ owner: PopulatedUser }>('owner', 'email isVerified');

        const emailsSent: string[] = [];

        // --- 3. Iterate and Check Timing/Notification Status ---
        for (const event of eventsForReminder) {
            
            const [hours, minutes] = event.startTime.split(':').map(Number);
            
            // Reconstruct the event's full start time using the stored date and string time
            const eventStartDateTime = new Date(event.eventDate);
            // setHours uses the server's local timezone (which is what you want for local HH:MM comparison)
            eventStartDateTime.setHours(hours, minutes, 0, 0); 

            // --- CRUCIAL CHECK ---
            // 1. Task starts within the next two minutes (eventStartDateTime > now and <= twoMinutesFromNow)
            // 2. Task has NOT been notified (!event.isNotified handles false, null, and undefined)
            if (eventStartDateTime > now && 
                eventStartDateTime <= twoMinutesFromNow && 
                !event.isNotified) 
            {
                
                const user = event.owner; 
                
                if (user && user.email && user.isVerified) {
                    
                    try {
                        // 1. Send the email
                        await sendMail({
                            email: user.email,
                            emailType: "REMINDER",
                            taskTitle: event.title,
                            startTime: event.startTime,
                            userId: user._id.toString() 
                        });
                        
                        // 2. CRUCIAL FIX: Mark the event as notified in the database
                        await EventModel.findByIdAndUpdate(event._id, { isNotified: true });
                        
                        emailsSent.push(`${event.title} to ${user.email}`);

                    } catch (mailError: any) {
                        console.error(`Error sending email for event ${event._id}: ${mailError.message}`);
                        // The event remains isNotified=false, so it will retry next minute.
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: now,
            message: `Reminder check completed. ${emailsSent.length} emails scheduled.`,
            sentEmails: emailsSent
        });

    } catch (error: any) {
        console.error("Reminders API Error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error during reminder check." },
            { status: 500 }
        );
    }
}