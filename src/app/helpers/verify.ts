// src/helpers/verify.ts
export default function content(emailType: "VERIFY" | "RESET", hashedToken: string): string {
  const domain = process.env.DOMAIN || "localhost:3000";
  const theLink = `${domain}/verifyemail/${hashedToken}`;
  const action = emailType === "VERIFY" ? "Verify Email" : "Reset Password";

  return `
      <html>
        <body>
          <p>
            Click <a href="${theLink}">Here</a> to ${action}, 
            or copy and paste the link below into your browser:
          </p>
          <p>
            ${domain}/verifyemail?token=${hashedToken}
          </p>
        </body>
      </html>
    `;
}
