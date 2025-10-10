import User from "../models/userModel";
import nodemailer from "nodemailer"
import jwt from 'jsonwebtoken'
import content from "./verify"
export const sendMail = async ({ email, emailType, userId }: any) => {
    const domain = process.env.DOMAIN || "localhost:3000";

    const action = emailType === "VERIFY" ? "Verify Email" : "Reset Password";
    try {

        const min = 100000;
        const max = 999999;
        const hashedToken = Math.floor(Math.random() * (max - min + 1)) + min;


        if (emailType === 'VERIFY') {
            await User.findByIdAndUpdate(userId,
                {
                    verifyToken: hashedToken,
                    verifyTokenExpiry: Date.now() + 3600000
                }
            )
        } else if (emailType === 'RESET') {
            await User.findByIdAndUpdate(userId,
                {
                    forgotPasswordToken: hashedToken,
                    forgotPasswordTokenExpiry: Date.now() + 3600000
                }
            )
        }


        const transport = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASS
            }
        });
        const theLink = `${domain}/verifyemail/${hashedToken}`;
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: emailType === 'VERIFY' ? "Verify Email" : "Password Reset",
            html: `
                <html>
                    <body>
                    <p>
                    Your OTP for verification in WeekWise is 
                    <br></br>
                    <br></br>
                    <h1>${hashedToken}</h1>
                    </p>
                    <p>Please Dont Share This OTP with anyone</p>
                    </body>
                </html>
                `
        }

        const mailResponce = await transport.sendMail(mailOptions)
        return mailResponce
    } catch (error:any) {
        throw new Error(error.message)
    }

}
