// 

import mongoose from "mongoose";

export async function connect() {
    try {
        if (mongoose.connection.readyState) {
            // Already connected
            console.log("MongoDB already connected");
            return;
        }

        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error("MONGO_URI not defined");

        await mongoose.connect(uri);
        console.log("MongoDB connected successfully");

    } catch (error: any) {
        console.error("MongoDB connection failed:", error.message);
        throw error; // allow caller to handle
    }
}
