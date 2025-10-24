"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import TimezoneSelect from "react-timezone-select"; // ✅ IMPORTED
export const dynamic = "force-dynamic";

// ✅ Wrap the main SignUpPage inside Suspense
export default function SignUpPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPage />
    </Suspense>
  );
}

function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // carry-through params
  const redirect = searchParams.get("redirect") || "/";
  const product = searchParams.get("product") || "";
  const opr = searchParams.get("opr") || "";

  const [user, setUser] = useState({
    userName: "",
    email: "",
    password: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // ✅ Timezone added
  });
  const [loading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    // ✅ Now validates all 4 fields
    setCanSubmit(
      Boolean(user.userName && user.email && user.password && user.timezone)
    );
  }, [user]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (redirect) params.set("redirect", redirect);
    if (product) params.set("product", product);
    if (opr) params.set("opr", opr);
    return params.toString();
  };

  const goToLogin = () => {
    const qs = buildQuery();
    router.push(qs ? `/login?${qs}` : "/login");
  };

  const onSignup = async () => {
    try {
      setLoading(true);
      // ✅ The 'user' object now includes the timezone automatically
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Sign up successful. Please log in.");
        toast.success("Please verify your email using the link sent.");
        router.push("/verifyemail");
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-purple-700 via-indigo-800 to-black flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Back to Login (top-left) */}
      <button
        onClick={goToLogin}
        className="absolute left-4 top-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-white hover:bg-white/20 transition"
      >
        ← Back to Login
      </button>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-2xl p-6 sm:p-8"
      >
        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-center text-white/70 mb-8">
          Sign up to continue to checkout or cart.
        </p>

        {/* Username */}
        <label className="block mb-2 text-sm text-white/80">Username</label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          value={user.userName}
          onChange={(e) => setUser({ ...user, userName: e.target.value })}
          placeholder="yourname"
          className="w-full mb-4 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
        />

        {/* Email */}
        <label className="block mb-2 text-sm text-white/80">Email</label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="you@example.com"
          className="w-full mb-4 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
        />

        {/* Password */}
        <label className="block mb-2 text-sm text-white/80">Password</label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          placeholder="••••••••"
          className="w-full mb-6 rounded-xl bg-white/15 border border-white/25 px-4 py-3 outline-none placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400"
        />

        {/* ✅ START: TIMEZONE SELECTOR */}
        <label className="block mb-2 text-sm text-white/80">Timezone</label>
        <div className="mb-6">
          <TimezoneSelect
            value={user.timezone}
            onChange={(timezone) => {
              // The component returns an object, e.g., { value: "America/New_York", ... }
              // We just need the value string.
              setUser({ ...user, timezone: timezone.value });
            }}
            // Styles to match your glassmorphism theme
            styles={{
              control: (baseStyles) => ({
                ...baseStyles,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderColor: "rgba(255, 255, 255, 0.25)",
                borderRadius: "0.75rem", // .rounded-xl
                padding: "0.375rem",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.25)",
                },
              }),
              singleValue: (baseStyles) => ({
                ...baseStyles,
                color: "white",
              }),
              placeholder: (baseStyles) => ({
                ...baseStyles,
                color: "rgba(255, 255, 255, 0.6)",
              }),
              input: (baseStyles) => ({
                ...baseStyles,
                color: "white",
              }),
              menu: (baseStyles) => ({
                ...baseStyles,
                backgroundColor: "rgb(55 48 163)", // A dark indigo
                borderRadius: "0.75rem",
                border: "1px solid rgba(255, 255, 255, 0.20)",
              }),
              option: (baseStyles, { isFocused, isSelected }) => ({
                ...baseStyles,
                backgroundColor: isSelected
                  ? "rgb(168 85 247)" // fuchsia-500
                  : isFocused
                  ? "rgba(255, 255, 255, 0.1)"
                  : "transparent",
                color: "white",
                "&:active": {
                  backgroundColor: "rgb(192 132 252)", // fuchsia-400
                },
              }),
            }}
          />
        </div>
        {/* ✅ END: TIMEZONE SELECTOR */}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: canSubmit && !loading ? 1.03 : 1 }}
          whileTap={{ scale: canSubmit && !loading ? 0.97 : 1 }}
          disabled={!canSubmit || loading}
          onClick={onSignup}
          className={`w-full rounded-xl px-4 py-3 font-semibold transition
            ${
              !canSubmit || loading
                ? "bg-white/25 cursor-not-allowed"
                : "bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:opacity-95"
            }`}
        >
          {loading ? "Creating your account…" : "Sign Up"}
        </motion.button>

        {/* Divider */}
        <div className="my-6 h-px w-full bg-white/15" />

        {/* Login link with params preserved */}
        <p className="text-center text-white/80">
          Already have an account?{" "}
          <button
            onClick={goToLogin}
            className="text-fuchsia-300 hover:underline"
          >
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}