// "use client";
// import { Suspense } from "react";
// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { motion } from "framer-motion";
// import { toast, Toaster } from "react-hot-toast";
// export const dynamic = "force-dynamic";

// // ✅ Suspense Wrapper
// export default function LoginPageWrapper() {
//     return (
//         <Suspense fallback={<div>Loading...</div>}>
//             <LoginPage />
//         </Suspense>
//     );
// }

// function LoginPage() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const [user, setUser] = useState({ email: "", password: "" });
//     const [loading, setLoading] = useState(false);

//     const handleLogin = async () => {
//         try {
//             setLoading(true);
//             const res = await fetch("/api/users/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(user),
//             });

//             const data = await res.json();

//             if (res.ok && data.success) {
//                 const redirect = searchParams.get("redirect") || "/";
//                 const pId = searchParams.get("pId");
//                 const action = searchParams.get("action");

//                 if (action === "cart" && pId) {
//                     router.push(`/cart?pId=${pId}`);
//                 } else if (action === "buy" && pId) {
//                     router.push(`/checkout?pId=${pId}`);
//                 } else {
//                     router.push(redirect);
//                 }
//             } else {
//                 toast.error(data.error || "Login failed");
//             }
//         } catch (err: any) {
//             toast.error("Login failed");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="relative min-h-screen w-full bg-gradient-to-br from-purple-700 via-indigo-800 to-black flex items-center justify-center p-4">
//             <Toaster position="top-right" />

//             <motion.div
//                 initial={{ opacity: 0, y: 28 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="w-full max-w-md rounded-2xl bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-2xl p-6 sm:p-8"
//             >
//                 <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
//                 <p className="text-center text-white/70 mb-8">
//                     Log in to continue shopping
//                 </p>

//                 <label className="block mb-2 text-sm text-white/80">Email</label>
//                 <motion.input
//                     whileFocus={{ scale: 1.01 }}
//                     type="email"
//                     value={user.email}
//                     onChange={(e) => setUser({ ...user, email: e.target.value })}
//                     placeholder="you@example.com"
//                     className="w-full mb-4 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
//                 />

//                 <label className="block mb-2 text-sm text-white/80">Password</label>
//                 <motion.input
//                     whileFocus={{ scale: 1.01 }}
//                     type="password"
//                     value={user.password}
//                     onChange={(e) => setUser({ ...user, password: e.target.value })}
//                     placeholder="••••••••"
//                     className="w-full mb-6 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
//                 />

//                 <motion.button
//                     whileHover={{ scale: !loading ? 1.03 : 1 }}
//                     whileTap={{ scale: !loading ? 0.97 : 1 }}
//                     disabled={loading}
//                     onClick={handleLogin}
//                     className={`w-full rounded-xl px-4 py-3 font-semibold transition
//             ${loading
//                             ? "bg-white/25 cursor-not-allowed"
//                             : "bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:opacity-95"
//                         }`}
//                 >
//                     {loading ? "Logging in…" : "Login"}
//                 </motion.button>

//                 <div className="my-6 h-px w-full bg-white/15" />

//                 <p className="text-center text-white/80">
//                     Don’t have an account?{" "}
//                     <button
//                         onClick={() => {
//                             const params = searchParams.toString();
//                             router.push(params ? `/signup?${params}` : "/signup");
//                         }}
//                         className="text-fuchsia-300 hover:underline"
//                     >
//                         Sign Up
//                     </button>
//                 </p>
//             </motion.div>
//         </div>
//     );
// }
'use client';
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
export const dynamic = "force-dynamic";

export default function LoginPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPage />
        </Suspense>
    );
}

function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);

            // 1️⃣ Login API
            const res = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error || "Login failed");
                return;
            }

            // 2️⃣ Get User Profile to fetch userId
            const profileRes = await fetch("/api/users/profile", { credentials: "include" });
            const profileData = await profileRes.json();
            if (!profileRes.ok || !profileData.success) {
                toast.error("Failed to fetch profile");
                return;
            }

            const userId = profileData.user._id;

            // 3️⃣ Check if schedule exists for user
            const scheduleRes = await fetch(`/api/schedule/exists?userId=${userId}`);
            const scheduleData = await scheduleRes.json();
            const hasSchedule = scheduleData.hasSchedule;

            // 4️⃣ Determine redirect path
            const redirect = hasSchedule ? "/" : "/onboarding";

            // Optional: handle `action` params
            const pId = searchParams.get("pId");
            const action = searchParams.get("action");
            if (action === "cart" && pId) {
                router.push(`/cart?pId=${pId}`);
            } else if (action === "buy" && pId) {
                router.push(`/checkout?pId=${pId}`);
            } else {
                router.push(redirect);
            }

        } catch (err: any) {
            console.error(err);
            toast.error("Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-br from-purple-700 via-indigo-800 to-black flex items-center justify-center p-4">
            <Toaster position="top-right" />

            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md rounded-2xl bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-2xl p-6 sm:p-8"
            >
                <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
                <p className="text-center text-white/70 mb-8">
                    Log in to continue
                </p>

                <label className="block mb-2 text-sm text-white/80">Email</label>
                <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full mb-4 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
                />

                <label className="block mb-2 text-sm text-white/80">Password</label>
                <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="password"
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full mb-6 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
                />

                <motion.button
                    whileHover={{ scale: !loading ? 1.03 : 1 }}
                    whileTap={{ scale: !loading ? 0.97 : 1 }}
                    disabled={loading}
                    onClick={handleLogin}
                    className={`w-full rounded-xl px-4 py-3 font-semibold transition
            ${loading
                        ? "bg-white/25 cursor-not-allowed"
                        : "bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:opacity-95"
                    }`}
                >
                    {loading ? "Logging in…" : "Login"}
                </motion.button>

                <div className="my-6 h-px w-full bg-white/15" />

                <p className="text-center text-white/80">
                    Don’t have an account?{" "}
                    <button
                        onClick={() => {
                            const params = searchParams.toString();
                            router.push(params ? `/signup?${params}` : "/signup");
                        }}
                        className="text-fuchsia-300 hover:underline"
                    >
                        Sign Up
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
