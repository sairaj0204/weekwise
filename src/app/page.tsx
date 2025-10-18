"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "./components/Navbar"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Fetch user profile
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
    <>
    <Navbar/>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-800 to-black text-white px-6">
      {/* Loading State */}
      {loadingUser && (
        <p className="text-lg text-gray-300">Loading...</p>
      )}

      {/* Logged Out / Public Landing */}
      {!loadingUser && !user && (
        <div className="text-center max-w-2xl">
          
          <div className="mb-6 flex justify-center">
  <span className="inline-flex items-center bg-gray-800 px-7 py-3 rounded-full font-bold">
    <span className="bg-gradient-to-r from-pink-400 via-yellow-200 to-green-300 bg-clip-text text-transparent">
      ✨ Work smarter with WeekWise
    </span>
  </span>
</div>


          <h3 className="text-3xl font-bold text-amber-50">
            Where Discipline Meets Intelligence.
          </h3>
          
          <br/>
          <p className="text-lg mb-8 text-gray-200">
            Your AI-powered task manager that helps you plan smarter, stay focused, 
            and achieve more — every week.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={goSignup}
              className="px-8 py-3 text-white bg-green-700 font-semibold rounded-xl hover:bg-green-200 transition"
            >
              Get Started
            </button>
            <button
              onClick={goLogin}
              className="px-8 py-3 border border-white font-semibold rounded-xl hover:bg-green-700 hover:text-white transition"
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {/* Logged In View */}
      {user && (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-3">Hello, {user.userName} 👋</h1>
          <p className="text-gray-200 mb-2">Email: {user.email}</p>
          <p className="text-gray-300">
            {user.isVerified ? (
              <span>Email Verified ✅</span>
            ) : (
              <span>Please verify your email. Check your inbox ✉️</span>
            )}
          </p>
        </div>
      )}
    </div>
    </>
  )
}
