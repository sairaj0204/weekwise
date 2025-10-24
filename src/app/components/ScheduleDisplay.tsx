'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
  _id?: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  eventDate: string; // Assuming this is "YYYY-MM-DD"
  day_of_week?: string;
  materials?: string[];
  isCompleted: boolean;
}

interface ScheduleDisplayProps {
  events?: Event[];
  showDates?: boolean;
}

const categoryColors: Record<string, string> = {
  work: 'border-l-4 border-blue-400 bg-blue-900/30',
  study: 'border-l-4 border-yellow-400 bg-yellow-900/30',
  exercise: 'border-l-4 border-green-400 bg-green-900/30',
  hobby: 'border-l-4 border-pink-400 bg-pink-900/30',
  other: 'border-l-4 border-gray-400 bg-gray-900/30',
};

// Helper function to convert "HH:mm" to minutes since midnight
const parseTime = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) {
    console.warn('Invalid time string passed to parseTime:', timeStr);
    return 0;
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export default function ScheduleDisplay({ events = [], showDates = false }: ScheduleDisplayProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const [nowInMinutes, setNowInMinutes] = useState<number | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setNowInMinutes(now.getHours() * 60 + now.getMinutes());
    };

    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // ✅ --- THIS IS THE UPDATED FUNCTION ---
  const handleStartEvent = (eventId: string | undefined) => {
    if (!eventId || loadingId) return; 

    setLoadingId(eventId);

    // 1. Hit the API route by opening it in a new tab.
    // This will show the user your "Success" or "Expired" HTML page.
    window.open(`/api/schedule/startEvent?taskId=${eventId}`, '_blank');
    
    // 2. Refresh the data on *this* page after a short delay
    // This will pull the new "isCompleted: true" status from the database.
    setTimeout(() => {
      router.refresh(); 
      setLoadingId(null); // Reset loading state after refresh
    }, 1500); // 1.5 second delay to let the DB update
  };
  // ✅ --- END OF UPDATED FUNCTION ---

  if (!events || events.length === 0)
    return (
      <div className="text-center text-gray-400 text-lg mt-8">
        No events scheduled.
      </div>
    );

  // Group by date
  const grouped: Record<string, Event[]> = events.reduce((acc: Record<string, Event[]>, event) => {
    (acc[event.eventDate] = acc[event.eventDate] || []).push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([date, dayEvents], dayIndex) => (
        <div key={`${date}-${dayIndex}`} className="space-y-6">
          {showDates && (
            <h2 className="text-2xl font-semibold text-[#64FFDA] border-b border-gray-600 pb-2">
              {new Date(date.replace(/-/g, '/')).toDateString()}
            </h2>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayEvents.map((event, index) => {
              
              // --- All your logic is here ---
              const renderButton = () => {
                if (nowInMinutes === null) return null; 

                const startTime = parseTime(event.start_time);
                const endTime = parseTime(event.end_time);
                const isEventLoading = loadingId === event._id;
                const isOvernight = endTime < startTime;

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const [y, m, d] = event.eventDate.split('-').map(Number);
                const eventDate = new Date(y, m - 1, d); 

                const isToday = eventDate.getTime() === today.getTime();
                const isPastDate = eventDate.getTime() < today.getTime();

                // State 1: COMPLETED
                if (event.isCompleted) {
                  return (
                    <button
                      disabled
                      className="bg-green-600/50 text-white font-bold py-2 px-5 rounded-lg opacity-70 cursor-not-allowed"
                    >
                      Completed
                    </button>
                  );
                }

                // State 2: MISSED (Expired)
                let isMissed = false;
                if (isOvernight) {
                  const nextDay = new Date(eventDate.getTime() + 86400000); 
                  const isNextDayPast = nextDay.getTime() < today.getTime();
                  const isCurrentlyNextDay = nextDay.getTime() === today.getTime();
                  isMissed = isNextDayPast || (isCurrentlyNextDay && nowInMinutes > endTime);
                } else {
                  isMissed = isPastDate || (isToday && nowInMinutes > endTime);
                }

                if (isMissed) {
                  return (
                    <button
                      disabled
                      className="bg-red-600/50 text-white font-bold py-2 px-5 rounded-lg opacity-70 cursor-not-allowed"
                    >
                      Missed
                    </button>
                  );
                }

                // State 3: START (Enabled)
                const isStartable = isToday && nowInMinutes >= startTime - 60;
                if (isStartable) {
                  return (
                    <button
                      onClick={() => handleStartEvent(event._id)}
                      disabled={isEventLoading}
                      className="
                        bg-green-600 text-white 
                        font-bold py-2 px-5 rounded-lg shadow-md 
                        hover:bg-green-700 hover:shadow-lg 
                        transition duration-200
                        disabled:bg-green-400 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isEventLoading ? 'Starting...' : 'Start'}
                    </button>
                  );
                }

                // State 4: UPCOMING
                return (
                  <button
                    disabled
                    className="bg-gray-600/50 text-white font-bold py-2 px-5 rounded-lg opacity-70 cursor-not-allowed"
                  >
                    Start
                  </button>
                );
              };
              // --- End Button Logic ---

              return (
                <div
                  key={event._id || `${date}-${event.title}-${index}`}
                  className={`flex flex-col justify-between p-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform duration-200 ${
                    categoryColors[event.category] || categoryColors.other
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                    <p className="text-sm">
                      🕒 {event.start_time} – {event.end_time}
                    </p>
                    {event.materials?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <h4 className="text-sm font-semibold text-gray-200">Materials:</h4>
                        {event.materials.map((mat, i) => (
                          <a
                            key={`${event.title}-mat-${i}`}
                            href={mat}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-400 hover:underline truncate"
                          >
                            {mat}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* This z-50 fixes the click-blocking issue */}
                  <div className="relative z-50 flex justify-end mt-4">
                    {renderButton()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}