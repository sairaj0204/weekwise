// src/app/progress/page.tsx
import { cookies } from "next/headers";
import EventModel from "../models/events";
import UserModel from "../models/userModel";
import { connect } from "../dbConfig/dbConfig";
import Navbar from "../components/Navbar";
import { unstable_noStore as noStore } from 'next/cache';

// --- Helper Types ---
interface Stats {
  completed: number;
  missed: number;
  pending: number;
  total: number;
  percentage: number;
}
interface CategoryStat extends Stats {
  category: string;
}

// --- Helper Functions ---

/**
 * Gets the start of today (midnight) in the user's timezone.
 * Returns a Date object set to midnight (server time) for that user's date.
 */
function getStartOfToday(userTimezone: string): Date {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Creates a "YYYY-MM-DD" string for the user's current date
  const userTodayStr = dateFormatter.format(now);
  // Returns a Date object like 2025-10-24T00:00:00Z
  return new Date(userTodayStr); 
}

/**
 * Gets the current time in minutes since midnight in the user's timezone.
 */
function getNowInMinutes(userTimezone: string): number {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hour, minute] = timeFormatter.format(now).split(':').map(h => h === '24' ? 0 : Number(h));
  return (hour * 60) + minute;
}

/**
 * Parses an "HH:MM" string into minutes.
 */
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + minutes;
};

/**
 * Calculates detailed stats (completed, missed, pending) for a set of events.
 */
function calculateStats(events: any[], startOfToday: Date, nowInMinutes: number): Stats {
  let completed = 0;
  let missed = 0;
  let pending = 0;
  const total = events.length;

  for (const event of events) {
    if (event.isCompleted) {
      completed++;
      continue;
    }

    const eventDate = new Date(event.eventDate);
    const eventEndTime = parseTime(event.endTime);

    if (eventDate < startOfToday) {
      // Event date is in the past
      missed++;
    } else if (eventDate.getTime() === startOfToday.getTime()) {
      // Event is today
      if (nowInMinutes > eventEndTime) {
        missed++;
      } else {
        pending++;
      }
    } else {
      // Event is in the future
      pending++;
    }
  }

  const actionableTasks = completed + missed;
  const percentage = actionableTasks > 0 ? Math.round((completed / actionableTasks) * 100) : 0;

  return { completed, missed, pending, total, percentage };
}

// --- Data Fetching ---
async function getProgressData(userId: string) {
  noStore(); // Ensure fresh data
  await connect();

  // 1. Get User's Timezone
  const user = await UserModel.findById(userId).select("timezone").lean();
  const userTimezone = user?.timezone || "UTC";

  // 2. Get Date Ranges and Current Time
  const startOfToday = getStartOfToday(userTimezone);
  const nowInMinutes = getNowInMinutes(userTimezone);
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  // 3. Fetch All Events Once
  const allEvents = await EventModel.find({ owner: userId }).lean();

  // 4. Filter Events
  const todayEvents = allEvents.filter(event => {
    const eventDate = new Date(event.eventDate);
    return eventDate >= startOfToday && eventDate < startOfTomorrow;
  });

  const thisWeekEvents = allEvents.filter(event => {
    const eventDate = new Date(event.eventDate);
    return eventDate >= sevenDaysAgo && eventDate < startOfTomorrow;
  });

  // 5. Calculate Stats
  const allTimeStats = calculateStats(allEvents, startOfToday, nowInMinutes);
  const todayStats = calculateStats(todayEvents, startOfToday, nowInMinutes);
  const thisWeekStats = calculateStats(thisWeekEvents, startOfToday, nowInMinutes);

  // 6. Calculate Progress by Category
  const categoryMap = new Map<string, any[]>();
  for (const event of allEvents) {
    const category = event.category || "other";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(event);
  }

  const byCategory: CategoryStat[] = [];
  for (const [category, events] of categoryMap.entries()) {
    const stats = calculateStats(events, startOfToday, nowInMinutes);
    byCategory.push({ category, ...stats });
  }
  
  return { allTimeStats, todayStats, thisWeekStats, byCategory };
}


// --- UI Components ---

/**
 * A circular progress bar.
 */
const RadialProgress = ({ percentage }: { percentage: number }) => {
  const sqSize = 120;
  const strokeWidth = 12;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className="relative w-32 h-32">
      <svg width={sqSize} height={sqSize} viewBox={viewBox}>
        <circle
          className="text-gray-700"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          fill="none"
          stroke="currentColor"
        />
        <circle
          className="text-emerald-400"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          fill="none"
          stroke="currentColor"
          transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
          style={{
            strokeDasharray: dashArray,
            strokeDashoffset: dashOffset,
            strokeLinecap: 'round',
            transition: 'stroke-dashoffset 0.6s ease 0s',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{percentage}%</span>
      </div>
    </div>
  );
};

/**
 * A card for displaying key stats (Today, Week, All-Time).
 */
const StatCard = ({ title, stats }: { title: string, stats: Stats }) => (
  <div className="bg-[#112240] rounded-xl border border-[#233554] p-6 shadow-2xl flex flex-col items-center">
    <h2 className="text-2xl font-bold text-gray-200 mb-4">{title}</h2>
    <RadialProgress percentage={stats.percentage} />
    <p className="text-lg text-gray-300 mt-4 text-center">
      Completion Rate
    </p>
    <div className="w-full mt-6 space-y-2 text-center">
      <p className="text-emerald-400 font-semibold text-lg">{stats.completed} Completed</p>
      <p className="text-red-400 font-semibold text-lg">{stats.missed} Missed</p>
      <p className="text-blue-400 font-semibold text-lg">{stats.pending} Pending</p>
    </div>
  </div>
);

/**
 * A horizontal progress bar for the category breakdown.
 */
const CategoryBar = ({ stat }: { stat: CategoryStat }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-base font-medium text-gray-300 capitalize">{stat.category}</span>
      <span className="text-sm font-medium text-emerald-400">{stat.percentage}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div
        className="bg-emerald-400 h-2.5 rounded-full"
        style={{ width: `${stat.percentage}%` }}
      />
    </div>
    <p className="text-xs text-gray-400 mt-1">
      {stat.completed} Completed • {stat.missed} Missed • {stat.pending} Pending
    </p>
  </div>
);

// --- Page Component ---

export default async function ProgressPage() {
  // 1. Fetch User ID
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();
  const profileRes = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"}/api/users/profile`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!profileRes.ok) return <div className="text-red-500">Failed to get user</div>;

  const profileData = await profileRes.json();
  const userId = profileData.user?._id;
  if (!userId) return <div className="text-red-500">User not found</div>;

  // 2. Fetch all our new data
  const { allTimeStats, todayStats, thisWeekStats, byCategory } = await getProgressData(userId);

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-8 bg-gradient-to-br from-[#0A192F] via-[#0C243B] to-[#0A192F] text-white flex justify-center">
        <div className="w-full max-w-6xl">
          <h1 className="text-4xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            Your Progress Dashboard
          </h1>

          {/* --- Key Metrics Grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <StatCard title="Today" stats={todayStats} />
            <StatCard title="This Week" stats={thisWeekStats} />
            <StatCard title="All-Time" stats={allTimeStats} />
          </div>

          {/* --- Category Breakdown --- */}
          <div className="bg-[#112240] rounded-xl border border-[#233554] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Breakdown by Category</h2>
            {byCategory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {byCategory.map(cat => (
                  <CategoryBar key={cat.category} stat={cat} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No tasks with categories found. Complete some tasks to see your breakdown!</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}