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
  // This now hits your updated API route
  const scheduleResponse = await fetch(
    `${
      process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'
    }/api/schedule/getWeek?userId=${userId}`,
    { cache: 'no-store' }
  );

  if (!scheduleResponse.ok) {
    console.error('Failed to fetch weekly schedule:', scheduleResponse.status);
    return [];
  }

  const data = await scheduleResponse.json();
  
  // data.events is now a flat array: [event1, event2, ...]
  return data.events || [];
}

export default async function WeekSchedulePage() {
  // weekEvents is the flat array of events from EventModel
  const weekEvents = await fetchWeekSchedule();

  // ✅ --- New Data Formatting ---
  // We must map the EventModel data to the props your ScheduleDisplay component expects.
  // Your component expects `eventDate` as a "YYYY-MM-DD" string and
  // `start_time` / `end_time` with underscores.
  const formattedWeekEvents = weekEvents.map((event: any) => ({
    _id: event._id.toString(), // Ensure _id is a string
    title: event.title,
    description: event.description,
    category: event.category,
    materials: event.materials,
    isCompleted: event.isCompleted,
    
    // 1. Map camelCase (startTime) to snake_case (start_time)
    start_time: event.startTime,
    end_time: event.endTime,
    
    // 2. Convert the eventDate (which is a Date object or string)
    //    to a simple "YYYY-MM-DD" string for grouping.
    eventDate: new Date(event.eventDate).toISOString().split('T')[0],
  }));
  // --- End of New Formatting ---

  return (
    <>
      <Navbar />
      {/* This 'relative z-10' is the fix for the click issue */}
      <div className="relative z-10 min-h-screen p-6 sm:p-10 bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-[#64FFDA]">
          Your Weekly Schedule
        </h1>

        {/* We now pass the correctly formatted flat array of events.
          The ScheduleDisplay component will group these by the 'eventDate' string.
        */}
        <ScheduleDisplay events={formattedWeekEvents} showDates={true} />
      </div>
    </>
  );
}