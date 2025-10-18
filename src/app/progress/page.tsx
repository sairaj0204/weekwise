// src/app/progress/page.tsx
import { cookies } from "next/headers";
import EventModel from "../models/events";
import { connect } from "../dbConfig/dbConfig";
import Navbar from "../components/Navbar";

export default async function ProgressPage() {
  await connect();

  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  // Fetch the authenticated user
  const profileRes = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"}/api/users/profile`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!profileRes.ok) return <div className="text-red-500">Failed to get user</div>;

  const profileData = await profileRes.json();
  const userId = profileData.user?._id;
  if (!userId) return <div className="text-red-500">User not found</div>;

  // Fetch user's events
  const allEvents = await EventModel.find({ owner: userId });
  const total = allEvents.length;
  const completed = allEvents.filter(event => event.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
        <Navbar/>
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
        Your Task Progress
      </h1>

      <div className="w-full max-w-md bg-[#112240] rounded-xl border border-[#233554] p-6 shadow-2xl">
        <p className="text-gray-300 mb-4 text-lg">Completed Tasks:</p>
        <div className="w-full bg-gray-700 rounded-full h-6 mb-4">
          <div
            className="h-6 rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-gray-300 text-center">
          {completed} of {total} tasks completed ({percentage}%)
        </p>
      </div>
    </div>
    </>
  );
}
