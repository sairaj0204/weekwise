import { connect } from "../../../dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import EventModel from "../../../models/events";
import mongoose from "mongoose";

// The link will trigger a GET request, so we export a GET function.
export async function GET(request: NextRequest) {
    try {
        await connect();

        // 1. Extract parameters from the request URL's query string
        const searchParams = request.nextUrl.searchParams;
        const taskId = searchParams.get('taskId'); // Use taskId to target the event

        if ( !taskId) {
            return NextResponse.json({
                message: "Missing required parameters: userId and taskId.",
            }, { status: 400 });
        }
        
        // Basic validation for MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return NextResponse.json({ message: "Invalid Task ID format." }, { status: 400 });
        }

        // 2. Update the Event: Set isCompleted to true (or define an actualStartTime)
        const updatedEvent = await EventModel.findOneAndUpdate(
            { _id: taskId }, // Query: Find the task by ID AND ensure it belongs to the user
            { 
                isCompleted: true, // Assuming 'Start Task' means it's now 'active'
            },
            { new: true } // Return the updated document
        );

        if (!updatedEvent) {    
            return NextResponse.json({
                message: "Task not found or user unauthorized for this task.",
            }, { status: 404 });
        }

        // 3. Return a user-friendly response page
        // Since this is triggered by a link click, the user will see this in their browser.
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