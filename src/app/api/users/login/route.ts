//login

import { connect } from '../../../dbConfig/dbConfig'
import User from '../../../models/userModel'
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
    try {
        await connect()
        const { email, password } = await request.json()

        const user = await User.findOne({ email })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
        }

        const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET!, {
            expiresIn: "7d"
        })

        const response = NextResponse.json({
            success: true,
            message: "Logged in successfully"
        })

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/"
        })

        return response
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
