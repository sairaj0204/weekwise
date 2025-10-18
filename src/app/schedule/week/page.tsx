import Navbar from '../../components/Navbar';
import ScheduleDisplay from '../../components/ScheduleDisplay';
import { cookies } from 'next/headers';

async function fetchWeekSchedule() {
  const cookieHeader = await cookies().toString();

  // Step 1: Get Authenticated User
  const profileResponse = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/api/users/profile`,
    {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    }
  );

  if (!profileResponse.ok) {
    console.error('Authentication failed or user not found:', profileResponse.status);
    return [];
  }

  const profileData = await profileResponse.json();
  const userId = profileData.user?._id;
  if (!userId) return [];

  // Step 2: Fetch weekly schedule
  const scheduleResponse = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/api/schedule/getWeek?userId=${userId}`,
    { cache: 'no-store' }
  );

  if (!scheduleResponse.ok) {
    console.error('Failed to fetch weekly schedule:', scheduleResponse.status);
    return [];
  }

  const data = await scheduleResponse.json();
  return data.events || [];
}

export default async function WeekSchedulePage() {
  const weekEvents = await fetchWeekSchedule();

  // Attach each event with its date from the corresponding day
  const formattedWeekEvents = weekEvents.flatMap((day) =>
    day.events.map((event: any) => ({
      ...event,
      eventDate: day.date,
      day_of_week: day.day_of_week,
    }))
  );

  return (
    <>
        <Navbar/>
    <div className="min-h-screen p-6 sm:p-10 bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] text-white">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-[#64FFDA]">
        Your Weekly Schedule
      </h1>

      <ScheduleDisplay events={formattedWeekEvents} showDates={true} />
    </div>
    </>
  );
}
