import { connect } from "../../../dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import EventModel from "../../../models/events";
import mongoose, { Document } from "mongoose";

// --- Define interface for the populated event ---
interface IPopulatedOwner {
  timezone: string;
}

interface IEventWithPopulatedOwner extends Document {
  _id: string;
  owner: IPopulatedOwner; // This will be populated
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  eventDate: Date; // YYYY-MM-DD
  isCompleted: Boolean; // ✅ FIX: Changed from 'boolean' to 'Boolean' to match your model
}
// ---

export async function GET(request: NextRequest) {
    try {
        await connect();

        const searchParams = request.nextUrl.searchParams;
        const taskId = searchParams.get('taskId'); 

        if ( !taskId) {
            return NextResponse.json({
                message: "Missing required parameter: taskId.",
            }, { status: 400 });
        }
        
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return NextResponse.json({ message: "Invalid Task ID format." }, { status: 400 });
        }
        
        // --- 1. Find event AND populate user's timezone ---
        // This cast will now work correctly
        const event = await EventModel.findById(taskId)
            .populate<{ owner: IPopulatedOwner }>("owner", "timezone")
            .exec() as IEventWithPopulatedOwner;

        if (!event || !event.owner || !event.owner.timezone) {
            return NextResponse.json({
                message: "Task not found or user timezone is missing.",
            }, { status: 404 });
        }

        const userTimezone = event.owner.timezone; // e.g., "Asia/Kolkata"

        // --- 2. Get current time and event time IN USER'S TIMEZONE ---
        
        const now = new Date(); // Current UTC time
        
        // Get current date string in user's TZ (e.g., "2025-10-24")
        const dateFormatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: userTimezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const todayStr = dateFormatter.format(now); // "2025-10-24"

        // Get event date string (e.g., "2025-10-24")
        const eventDateStr = event.eventDate.toISOString().split('T')[0];

        // Get current time in minutes in user's TZ
        const timeFormatter = new Intl.DateTimeFormat("en-US", {
            timeZone: userTimezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        // This handles '24:00' by turning it into '00:00'
        const [currentHour, currentMinute] = timeFormatter.format(now).split(':').map(h => h === '24' ? 0 : Number(h));
        const currentTimeInUserTZ = (currentHour * 60) + currentMinute;

        // Get event end time in minutes
        const [endTimeHrs, endTimeMin] = event.endTime.split(":").map(Number);
        const endTimeInUserTZ = (endTimeHrs * 60) + endTimeMin;

        // --- 3. Correct "Expired" Logic ---
        const isExpired = 
            (todayStr > eventDateStr) || // Is the current date *after* the event date?
            (todayStr === eventDateStr && currentTimeInUserTZ > endTimeInUserTZ); // Is it the same day, but *after* the end time?

        if(isExpired){
            console.log(`Task expired. Current: ${todayStr} ${currentTimeInUserTZ} | Event: ${eventDateStr} ${endTimeInUserTZ}`);
            
            return new NextResponse(`
            <html>
                <head>
                    <title>Task Expired</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #fef2f2; color: #991b1b; }
                        h1 { color: #dc2626; }
                        p { font-size: 1.1em; }
                        .container { max-width: 600px; margin: 0 auto; border: 1px solid #f87171; border-radius: 8px; padding: 20px; background-color: #fff; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1> Oops!</h1>
                        <p>Task: <strong>${event.title}</strong> has expired.</p>
                        <p>You have missed the task.</p>
                    </div>
                </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
        }

        // --- 4. Success: Update Event ---
        const updatedEvent = await EventModel.findOneAndUpdate(
            { _id: taskId }, 
            { isCompleted: true },
            { new: true } 
        );

        if (!updatedEvent) {    
            return NextResponse.json({
                message: "Task not found during update.",
            }, { status: 404 });
        }

        return new NextResponse(`
            <html>
                <head>
                    <title>Task Started</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f0fdf4; color: #15803d; }
                        h1 { color: #16a34a; }
                        p { font-size: 1.1em; }
                        .container { max-width: 600px; margin: 0 auto; border: 1px solid #4ade80; border-radius: 8px; padding: 20px; background-color: #fff; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1> Success!</h1>
                        <p>Task: <strong>${updatedEvent.title}</strong> has been marked as started.</p>
                        <p>Enjoy your session! You can close this window now.</p>
                    </div>
                </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
        
    } catch (error) {
        console.error("Error starting task session:", error);
        return NextResponse.json({ 
            message: "Failed to Start the session due to a server error.", 
            error: (error as Error).message 
        }, { status: 500 });
    }
}