"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Fetch user profile using native fetch
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/profile")
        const data = await res.json()
        if (data?.success) setUser(data.user)
        else setUser(null)
      } catch {
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchProfile()
  }, [])

  const goLogin = () => router.push("/login")
  const goSignup = () => router.push("/signup")

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      {!loadingUser && !user && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to WeekWise</h1>
          <p className="mb-6">Please login or signup to continue.</p>
          <button
            onClick={goLogin}
            className="mr-3 px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Login
          </button>
          <button
            onClick={goSignup}
            className="px-6 py-2 bg-green-600 text-white rounded-lg"
          >
            Signup
          </button>
        </div>
      )}

      {user && (
        <div className="text-center text-black">
          <h1 className="text-3xl font-bold mb-4">Hello, {user.userName}</h1>
          <p>Your email: {user.email}</p>
          <p>
            {user.isVerified
              ? "Email Verified ✅"
              : "Please verify your email. Check your inbox!"}
          </p>
        </div>
      )}
    </div>
  )
}
