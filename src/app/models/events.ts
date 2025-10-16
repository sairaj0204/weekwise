import mongoose, { Schema, Document, Model, Types } from "mongoose";

// --- Interfaces ---

// Base interface for the Event document
interface IEvent {
  // Reference to the main Schedule this event belongs to
  scheduleId: Types.ObjectId;
  
  // Reference to the User who owns the schedule
  owner: Types.ObjectId; 
  
  // Task details
  title: string;
  description?: string;
  category: string; // e.g., 'work', 'hobby', 'exercise'
  
  // Date and time details
  eventDate: Date; // Store the date (e.g., 2025-10-17)
  startTime: string; // Store HH:MM string (e.g., '07:00')
  endTime: string;   // Store HH:MM string (e.g., '07:30')
  
  // Optional materials/notes
  materials: string[];
  isNotified: Boolean;
}

// Document interface
interface IEventDocument extends IEvent, Document {}

// --- Schema ---

const eventSchema = new Schema<IEventDocument>({
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: "Schedule", // References the Schedule model
    required: true,
    index: true 
  },
  
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User", // References the User model (useful for quick lookups)
    required: true,
    index: true 
  },
  
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true },
  
  // Using Date type for the date part (ISO 8601 format)
  eventDate: { type: Date, required: true, index: true },
  
  // Using String type for time part (as per your JSON)
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },
  
  // Array of strings for materials
  materials: { type: [String], default: [] },

  isNotified: {type: Boolean, default:false}
  
}, { 
    // Add created/modified dates
    timestamps: true 
});

// --- Model ---

const EventModel: Model<IEventDocument> =
  (mongoose.models.Event as Model<IEventDocument>) || 
  mongoose.model<IEventDocument>("Event", eventSchema);

export default EventModel;