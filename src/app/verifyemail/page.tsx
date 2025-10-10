
 "use client";
import { useState } from "react"
import { useRouter } from "next/navigation"
import OtpInput from "../components/OtpInput"
export const dynamic = "force-dynamic";


export default function VerifyEmailPage() {
  const router = useRouter()
  const [message, setMessage] = useState("")

  const verifyEmail = async (otp: string) => {
    try {
      setMessage("Verifying...")

      const res = await fetch("/api/users/verifyUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp }),
      })

      const data = await res.json()

      if (res.status === 500) {
        // Show success message first
        setMessage("Email verified successfully! Redirecting to login...")
        // Redirect after 2 seconds
        setTimeout(() => router.push("/login"), 2000)
      } else {
        // Show error from API
        setMessage(data.message || data.error || "Verification failed")
      }
      
    } catch (err) {
      console.error(err)
      setMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] bg-gradient-to-br from-purple-700 via-indigo-800 to-black text-white
    ">
      <h1 className="text-2xl font-bold mb-4">Enter OTP</h1>

      <OtpInput  length={6} onOtpSubmit={verifyEmail} />

      <p className="mt-4">{message}</p>
    </div>
  )
}
