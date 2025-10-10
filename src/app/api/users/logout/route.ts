//logout
import { connect } from '../../../dbConfig/dbConfig'
import { NextRequest, NextResponse } from 'next/server'


connect()

export async function GET(request: NextRequest) {
    try {
        const responce = NextResponse.json({
            message: "Logged out Successfully",
            success: true
        })

        responce.cookies.set("token", "", {
            httpOnly: true,
            expires: new Date(0)
        })

        return responce

    } catch (error) {
        return NextResponse.json({ error: error.message },
            { status: 503 }
        )
    }
}