"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "./components/Navbar"
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'

// ✅ Import images directly
import todayImage from './assets/images/today.png'; // Adjust path if needed
import modifyImage from './assets/images/modify.png'; // Adjust path if needed
import progressImage from './assets/images/progress.png'; // Adjust path if needed
import weekImage from './assets/images/week.png'; // Adjust path if needed


// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/profile", { credentials: 'include' })
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
      {user && (<Navbar />)}

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] text-white">

        {loadingUser && (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-lg text-gray-300 animate-pulse">Loading...</p>
          </div>
        )}

        {!loadingUser && !user && (
          <div className="flex-grow flex flex-col items-center justify-center px-6 py-12">
            {/* Initial Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mb-20"
            >
              <div className="mb-6 flex justify-center">
                <span className="inline-flex items-center bg-gray-800 px-7 py-3 rounded-full font-bold">
                  <span className="bg-gradient-to-r from-pink-400 via-yellow-200 to-green-300 bg-clip-text text-transparent">
                    ✨ Work smarter with WeekWise
                  </span>
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Where Discipline Meets Intelligence.
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-300">
                Your AI-powered task manager that helps you plan smarter, stay focused,
                and achieve more — every week.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={goSignup}
                  className="px-8 py-3 text-[#0A192F] bg-emerald-400 font-semibold rounded-xl hover:bg-emerald-300 transition transform hover:scale-105"
                >
                  Get Started Free
                </button>
                <button
                  onClick={goLogin}
                  className="px-8 py-3 border border-emerald-400 text-emerald-400 font-semibold rounded-xl hover:bg-emerald-400 hover:text-[#0A192F] transition transform hover:scale-105"
                >
                  Log In
                </button>
              </div>
            </motion.div>

            {/* "How It Works" Section */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="w-full max-w-6xl mx-auto px-4 py-16"
            >
              <h2 className="text-3xl font-bold text-center mb-6 text-emerald-400">
                How WeekWise Helps You Succeed
              </h2>
              <p className="text-center text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
                Discover AI-powered planning, seamless modifications, and insightful progress tracking.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                {/* Feature 1: Today/Week View */}
                <motion.div
                  variants={itemVariants}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center text-center p-6 bg-[#112240]/50 rounded-lg border border-[#233554] shadow-lg hover:shadow-cyan-500/20 transition-shadow"
                >
                  <div className="w-full h-48 relative mb-4 overflow-hidden rounded-md ">
                    {/* ✅ Use imported image and add width/height */}
                    <Image
                      src={todayImage}
                      alt="Today's Schedule View"
                      layout="fill" // Keep fill if parent has defined size
                      objectFit="cover"
                      objectPosition="top"
                      placeholder="blur" // Optional: adds a blur effect while loading
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-100">Clear Daily Views</h3>
                  <p className="text-gray-400 text-sm">Organize your day effectively. See upcoming tasks and mark them complete as you go.</p>
                </motion.div>

                {/* Feature 2: Modify */}
                <motion.div
                  variants={itemVariants}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center text-center p-6 bg-[#112240]/50 rounded-lg border border-[#233554] shadow-lg hover:shadow-cyan-500/20 transition-shadow"
                >
                   <div className="w-full h-48 relative mb-4 overflow-hidden rounded-md ">
                     {/* ✅ Use imported image and add width/height */}
                     <Image
                       src={modifyImage}
                       alt="Modify Schedule AI Chat"
                       layout="fill"
                       objectFit="cover"
                       objectPosition="top"
                       placeholder="blur"
                     />
                   </div>
                   <h3 className="text-xl font-semibold mb-2 text-gray-100">AI Schedule Assistant</h3>
                   <p className="text-gray-400 text-sm">Modify your plans instantly. Just tell the AI what needs to change using text or voice.</p>
                </motion.div>

                {/* Feature 3: Progress */}
                 <motion.div
                   variants={itemVariants}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                   className="flex flex-col items-center text-center p-6 bg-[#112240]/50 rounded-lg border border-[#233554] shadow-lg hover:shadow-cyan-500/20 transition-shadow"
                 >
                   <div className="w-full h-48 relative mb-4 overflow-hidden rounded-md ">
                     {/* ✅ Use imported image and add width/height */}
                     <Image
                       src={progressImage}
                       alt="Progress Dashboard"
                       layout="fill"
                       objectFit="cover"
                       objectPosition="top"
                       placeholder="blur"
                     />
                   </div>
                   <h3 className="text-xl font-semibold mb-2 text-gray-100">Track Your Progress</h3>
                   <p className="text-gray-400 text-sm">Stay motivated with visual dashboards showing your completion rates by day, week, and category.</p>
                </motion.div>

                 {/* Feature 4: Detail (Using Week screenshot) */}
                 <motion.div
                   variants={itemVariants}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                   className="flex flex-col items-center text-center p-6 bg-[#112240]/50 rounded-lg border border-[#233554] shadow-lg hover:shadow-cyan-500/20 transition-shadow"
                 >
                   <div className="w-full h-48 relative mb-4 overflow-hidden rounded-md ">
                     {/* ✅ Use imported image and add width/height */}
                     <Image
                       src={weekImage}
                       alt="Weekly Schedule Detail"
                       layout="fill"
                       objectFit="cover"
                       objectPosition="top"
                       placeholder="blur"
                     />
                   </div>
                   <h3 className="text-xl font-semibold mb-2 text-gray-100">Plan Your Week</h3>
                   <p className="text-gray-400 text-sm">Get a bird's-eye view of your commitments. Add details, links, and notes to stay prepared.</p>
                </motion.div>
              </div>
            </motion.section>
          </div>
        )}

        {/* Logged In View */}
        {user && (
          <div className="flex-grow flex items-center justify-center px-6 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold mb-3">Hello, {user.userName} 👋</h1>
              <p className="text-gray-300 text-lg mb-6">
                {user.isVerified ? (
                  <span>Ready to plan your week? ✨ Use the navigation above.</span>
                ) : (
                  <span className="text-yellow-400">Please verify your email. Check your inbox ✉️</span>
                )}
              </p>
               <div className="flex gap-4 justify-center">
                 <button onClick={() => router.push('/schedule/today')} className="px-6 py-2 bg-emerald-500 text-[#0A192F] font-semibold rounded-lg hover:bg-emerald-400 transition">View Today</button>
                 <button onClick={() => router.push('/modify')} className="px-6 py-2 border border-emerald-400 text-emerald-400 font-semibold rounded-lg hover:bg-emerald-400 hover:text-[#0A192F] transition">Modify Schedule</button>
               </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}