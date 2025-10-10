import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value
        if (!token) {
            return NextResponse.json({ loggedIn: false }, { status: 401 })
        }

        const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!)
        return NextResponse.json({ loggedIn: true, user: decoded })
    } catch (error) {
        return NextResponse.json({ loggedIn: false }, { status: 401 })
    }
}
