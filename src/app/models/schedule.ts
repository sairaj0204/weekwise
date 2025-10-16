import mongoose, { Schema, Document, Model, Types } from "mongoose";

// --- Interfaces ---

// Define the structure for the JSON data you provided
interface IScheduleData {
  start_date: string;
  end_date: string;
  timezone: string;
  daily_schedule: any[]; // Use 'any[]' or define a complex type for daily_schedule
}

// Base interface for the Schedule document
interface ISchedule {
  // Reference to the User who owns this schedule
  owner: Types.ObjectId;
  
  // Field to store the entire schedule data as a JSON object
  scheduleData: IScheduleData;
}

// Document interface
interface IScheduleDocument extends ISchedule, Document {}

// --- Schema ---

const scheduleSchema = new Schema<IScheduleDocument>({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User", // References the User model
    required: true,
    index: true 
  },
  
  // Mongoose's mixed type (Schema.Types.Mixed) is best for flexible JSON/object data
  scheduleData: {
    type: Schema.Types.Mixed, 
    required: true,
  },
}, { 
    // This is how you get the created/modified dates automatically
    timestamps: true 
});

// --- Model ---

const ScheduleModel: Model<IScheduleDocument> =
  (mongoose.models.Schedule as Model<IScheduleDocument>) || 
  mongoose.model<IScheduleDocument>("Schedule", scheduleSchema);

export default ScheduleModel;