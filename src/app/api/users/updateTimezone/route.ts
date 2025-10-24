import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../../../models/userModel"; // Use your user model path
import { connect } from '../../../dbConfig/dbConfig';

export async function POST(request: NextRequest) {
  try {
    await connect();

    // 1. Get user ID from their token (same logic as your profile route)
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!);
    const userId = decoded.id;

    // 2. Get the new timezone from the request
    const { timezone } = await request.json();
    if (!timezone) {
      return NextResponse.json(
        { success: false, message: "Timezone is required." },
        { status: 400 }
      );
    }

    // 3. Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { timezone: timezone },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timezone updated successfully.",
      timezone: updatedUser.timezone,
    });
  } catch (error: any) {
    console.error("Error updating timezone:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}