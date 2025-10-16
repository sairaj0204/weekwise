import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import ScheduleModel from '../../../models/schedule'; 
import EventModel from '../../../models/events';     
import {connect} from '../../../dbConfig/dbConfig';       

// --- Interfaces for Type Safety (Simplified) ---
interface IEventData {
    title: string;
    description?: string;
    category: string;
    start_time: string;
    end_time: string;
    materials: string[];
    isNotified: Boolean;
}

interface IDailySchedule {
    date: string;
    day_of_week: string;
    events: IEventData[];
}

// NOTE: In a real app, userId should come from authentication, not the body.
interface IRequestBody {
    start_date: string;
    end_date: string;
    timezone: string;
    daily_schedule: IDailySchedule[];
    userId: string; 
}


// ----------------------------------------------------------------------
// 🚨 FIX: EXPORT NAMED FUNCTION 'POST' 
// ----------------------------------------------------------------------

export async function POST(req: NextRequest) {
    
    // Connect to the database
    await connect();

    // The request body needs to be awaited and parsed as JSON
    const data: IRequestBody = await req.json();
    const { userId, ...scheduleData } = data;
    
    // Basic validation
    if (!userId || !scheduleData || !scheduleData.daily_schedule) {
        return NextResponse.json(
            { message: "Invalid user ID or schedule data provided." }, 
            { status: 400 }
        );
    }
    
    const ownerId = new Types.ObjectId(userId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // --- A. Create the main Schedule Document ---
        const newSchedule = new ScheduleModel({
            owner: ownerId,
            scheduleData: scheduleData,
        });

        const savedSchedule = await newSchedule.save({ session });
        const scheduleId = savedSchedule._id;

        // --- B. Prepare and Create all Event Documents ---
        const eventsToInsert: any[] = [];

        for (const day of scheduleData.daily_schedule) {
            const eventDate = new Date(day.date); 

            for (const event of day.events) {
                eventsToInsert.push({
                    scheduleId: scheduleId,
                    owner: ownerId,
                    title: event.title,
                    description: event.description,
                    category: event.category,
                    eventDate: eventDate,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    materials: event.materials || [],
                    isNotified: false
                });
            }
        }
        
        await EventModel.insertMany(eventsToInsert, { session });

        // --- C. Commit Transaction and Respond ---
        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            message: "Schedule and all tasks created successfully.",
            scheduleId: scheduleId,
            eventsCount: eventsToInsert.length,
        }, { status: 201 });

    } catch (error) {
        // --- D. Abort Transaction on Error ---
        await session.abortTransaction();
        session.endSession();
        
        console.error("Error creating schedule and events:", error);
        return NextResponse.json({ 
            message: "Failed to create schedule due to a server error.", 
            error: (error as Error).message 
        }, { status: 500 });
    }
}