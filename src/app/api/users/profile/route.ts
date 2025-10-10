import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import User from "../../../models/userModel"
import { connect } from '../../../dbConfig/dbConfig'

export async function GET(request: NextRequest) {
    try {
        await connect()

        const token = request.cookies.get("token")?.value
        if (!token) {
            return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })
        }

        const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!)
        const user = await User.findById(decoded.id).select("-password") // exclude password

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, user })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}
