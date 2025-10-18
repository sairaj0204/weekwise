import Navbar from "../../components/Navbar";
import ScheduleDisplay from "../../components/ScheduleDisplay";

import { cookies } from 'next/headers';
// Server Component
export default async function TodaySchedulePage() {
  // Fetch authenticated user
  const cookieHeader = await cookies().toString();
  const profileResponse = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/api/users/profile`,
    {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    }
  );

  if (!profileResponse.ok) return <div className="p-10 text-gray-400">Not logged in</div>;

  const profileData = await profileResponse.json();
  const userId = profileData.user?._id;
  if (!userId) return <div className="p-10 text-gray-400">User ID not found</div>;

  // Fetch week schedule
  const scheduleResponse = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"}/api/schedule/getWeek?userId=${userId}`,
    { cache: "no-store" }
  );

  if (!scheduleResponse.ok) return <div className="p-10 text-gray-400">Failed to load schedule</div>;

  const weekData = await scheduleResponse.json();
  const eventsArray = weekData.events || weekData;

  // Filter for today
  const todayStr = new Date().toISOString().split("T")[0];
  const todayData = eventsArray.find((day: any) => day.date === todayStr);

  const formattedTodayEvents = todayData
    ? todayData.events.map((event: any) => ({
        ...event,
        eventDate: todayData.date,
        day_of_week: todayData.day_of_week,
      }))
    : [];

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {formattedTodayEvents.length > 0 ? (
          <ScheduleDisplay events={formattedTodayEvents}  showDates={true} />
        ) : (
          <div className="text-center text-gray-400 text-lg mt-20">
            No events scheduled for today.
          </div>
        )}
      </div>
    </div>
    </>
  );
}
