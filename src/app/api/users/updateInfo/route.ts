import { NextRequest, NextResponse } from "next/server";
// @ts-ignore (Assuming you have this)
import { connect } from "../../../dbConfig/dbConfig";
import User from "../../../models/userModel"; // Import your User model

export async function POST(request: NextRequest) {
  try {
    await connect();

    const { userId, information } = await request.json();

    if (!userId || !information) {
      return NextResponse.json(
        { success: false, message: "UserId and information are required." },
        { status: 400 }
      );
    }

    // Find the user by their ID and update the information field
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { information: information },
      { new: true } // This option returns the updated document
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User information updated successfully.",
      user: {
        _id: updatedUser._id,
        information: updatedUser.information,
      },
    });
  } catch (error: any) {
    console.error("Error updating user information:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}