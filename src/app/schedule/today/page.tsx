import Navbar from '../../components/Navbar';
import ScheduleDisplay from '../../components/ScheduleDisplay';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache'; // Import noStore

async function fetchTodaySchedule() {
  // This function will now fetch the whole week
  noStore(); // Opt out of caching
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
  // ✅ --- THIS NOW HITS THE 'getWeek' API ROUTE ---
  const scheduleResponse = await fetch(
    `${
      process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'
    }/api/schedule/getWeek?userId=${userId}`,
    { cache: 'no-store' }
  );
  // ✅ --- END OF CHANGE ---

  if (!scheduleResponse.ok) {
    console.error('Failed to fetch week schedule:', scheduleResponse.status);
    return [];
  }

  const data = await scheduleResponse.json();
  return data.events || [];
}

export default async function TodaySchedulePage() {
  // 1. Fetch all events for the week
  const weekEvents = await fetchTodaySchedule();

  // 2. ✅ Get today's date in "YYYY-MM-DD" format
  // We must get the date in the server's local timezone (which should be UTC)
  // or ideally the user's timezone. For simplicity, we'll use a standard method.
  // new Date() on the server will be UTC.
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  // Note: If your server is not in UTC, this might get the wrong day.
  // A more robust way is to get the user's timezone, but that's a bigger change.
  // Let's assume the API returns dates in a comparable format.

  // 3. ✅ Filter and Format the events
  const formattedTodayEvents = weekEvents
    .map((event: any) => {
      // First, format the event
      const eventDateString = new Date(event.eventDate).toISOString().split('T')[0];
      return {
        ...event,
        start_time: event.startTime,
        end_time: event.endTime,
        eventDate: eventDateString,
      };
    })
    .filter((event: any) => {
      // Second, keep only events where the date matches today
      return event.eventDate === todayString;
    });

  return (
    <>
      <Navbar />
      <div className="relative z-10 min-h-screen p-6 sm:p-10 bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-[#64FFDA]">
          Today's Schedule
        </h1>

        <ScheduleDisplay events={formattedTodayEvents} showDates={true} />
      </div>
    </>
  );
}