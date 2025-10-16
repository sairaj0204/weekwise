import { NextRequest, NextResponse } from "next/server";
import User from "../../../models/userModel";
import { connect } from "../../../dbConfig/dbConfig";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await connect();

    // 1️⃣ Get token from cookies
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not logged in" },
        { status: 401 }
      );
    }

    // 2️⃣ Verify JWT
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
    if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // 3️⃣ Find user
    const user = await User.findById(decoded.id).select("userName");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Success response
    return NextResponse.json({
      success: true,
      userName: user.userName,
    });
  } catch (error: any) {
    console.error("Error in GET /api/user:", error.message);
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
