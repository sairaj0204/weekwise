// import User from "../models/userModel";
// import nodemailer from "nodemailer"
// import jwt from 'jsonwebtoken'
// import content from "./verify"
// export const sendMail = async ({ email, emailType, userId }: any) => {
//     const domain = process.env.DOMAIN || "localhost:3000";

//     const action = emailType === "VERIFY" ? "Verify Email" : "Reset Password";
//     try {

//         const min = 100000;
//         const max = 999999;
//         const hashedToken = Math.floor(Math.random() * (max - min + 1)) + min;


//         if (emailType === 'VERIFY') {
//             await User.findByIdAndUpdate(userId,
//                 {
//                     verifyToken: hashedToken,
//                     verifyTokenExpiry: Date.now() + 3600000
//                 }
//             )
//         } else if (emailType === 'RESET') {
//             await User.findByIdAndUpdate(userId,
//                 {
//                     forgotPasswordToken: hashedToken,
//                     forgotPasswordTokenExpiry: Date.now() + 3600000
//                 }
//             )
//         }


//         const transport = nodemailer.createTransport({
//             host: "smtp.gmail.com",
//             port: 465,
//             secure: true,
//             auth: {
//                 user: process.env.NODEMAILER_EMAIL,
//                 pass: process.env.NODEMAILER_PASS
//             }
//         });
//         const theLink = `${domain}/verifyemail/${hashedToken}`;
//         const mailOptions = {
//             from: process.env.NODEMAILER_EMAIL,
//             to: email,
//             subject: emailType === 'VERIFY' ? "Verify Email" : "Password Reset",
//             html: `
//                 <html>
//                     <body>
//                     <p>
//                     Your OTP for verification in WeekWise is 
//                     <br></br>
//                     <br></br>
//                     <h1>${hashedToken}</h1>
//                     </p>
//                     <p>Please Dont Share This OTP with anyone</p>
//                     </body>
//                 </html>
//                 `
//         }

//         const mailResponce = await transport.sendMail(mailOptions)
//         return mailResponce
//     } catch (error:any) {
//         throw new Error(error.message)
//     }

// }
import User from "../models/userModel";
import nodemailer from "nodemailer"
import jwt from 'jsonwebtoken'
// import content from "./verify" // Assuming this is not used or handled in HTML

export const sendMail = async ({ 
    email, 
    emailType, 
    userId, 
    taskTitle, 
    startTime // 🚀 NEW: Fields for reminder email
}: {
    email: string;
    emailType: "VERIFY" | "RESET" | "REMINDER"; // Explicit types
    userId: string;
    taskTitle?: string;
    startTime?: string;
}) => {
    const domain = process.env.DOMAIN || "localhost:3000";

    try {
        let hashedToken: number | null = null;
        
        // 1. Generate OTP for VERIFY/RESET
        if (emailType !== "REMINDER") {
            const min = 100000;
            const max = 999999;
            hashedToken = Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // 2. Save Token to Database (for VERIFY/RESET)
        if (emailType === 'VERIFY' && hashedToken !== null) {
            await User.findByIdAndUpdate(userId,
                {
                    verifyToken: hashedToken,
                    verifyTokenExpiry: Date.now() + 3600000 // 1 hour
                }
            )
        } else if (emailType === 'RESET' && hashedToken !== null) {
            await User.findByIdAndUpdate(userId,
                {
                    forgotPasswordToken: hashedToken,
                    forgotPasswordTokenExpiry: Date.now() + 3600000 // 1 hour
                }
            )
        }

        // 3. Configure Transport
        const transport = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASS
            }
        });

        // 4. Define Mail Options
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "",
            html: ""
        }

        if (emailType === 'REMINDER' && taskTitle && startTime) {
            // 🚀 REMINDER EMAIL CONTENT
            mailOptions.subject = `🔔 Task Reminder: ${taskTitle} starts soon!`;
            mailOptions.html = `
                <html>
                    <body>
                    <p>
                    👋 **Hello!**
                    <br><br>
                    Just a quick reminder that your task: <strong>${taskTitle}</strong> is scheduled to begin in the next two minutes at <strong>${startTime}</strong>.
                    <br><br>
                    Get ready and have a productive day!
                    </p>
                    </body>
                </html>
            `;
        } else if (hashedToken !== null) {
            // VERIFY and RESET EMAIL CONTENT
            const action = emailType === 'VERIFY' ? "verification" : "password reset";
            mailOptions.subject = emailType === 'VERIFY' ? "Verify Email OTP" : "Password Reset OTP";
            mailOptions.html = `
                <html>
                    <body>
                    <p>
                    Your **OTP** for ${action} in WeekWise is:
                    <br><br>
                    <h1>${hashedToken}</h1>
                    </p>
                    <p>This code is valid for 1 hour. Please do not share this OTP with anyone.</p>
                    </body>
                </html>
            `;
        } else {
             throw new Error("Invalid email type or missing required parameters for the specified type.");
        }


        const mailResponce = await transport.sendMail(mailOptions)
        return mailResponce
    } catch (error:any) {
        throw new Error(error.message)
    }
}