
import { connect } from '../../../dbConfig/dbConfig'


import User from '../../../models/userModel'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendMail } from '../../../helpers/mailer'

connect()

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json(); // <-- await here
        const { userName, email, password } = reqBody;

        // validation
        console.log(reqBody);

        const user = await User.findOne({ email });
        if (user) {
            return NextResponse.json({ error: "User Already Exists" }, { status: 400 })
        }
        else {

            const salt = await bcrypt.genSalt(10);
            const hash = bcrypt.hashSync(password, salt);

            const newUser = new User({
                userName,
                email,
                password: hash,
            })
            const savedUser = await newUser.save()
            console.log(savedUser);

            //send verification email
            await sendMail({ email, emailType: 'VERIFY', userId: String(savedUser._id)  })

            return NextResponse.json({
                message: "User Registered successfully",
                success: true,
                savedUser
            })
        }
    } catch (error:any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}