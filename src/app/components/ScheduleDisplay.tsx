'use client';
import React from 'react';

interface Event {
  _id?: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  eventDate: string;
  day_of_week?: string;
  materials?: string[];
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

export default function ScheduleDisplay({ events = [], showDates = false }: ScheduleDisplayProps) {
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
              {new Date(date).toDateString()}
            </h2>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayEvents.map((event, index) => (
              <div
                key={event._id || `${date}-${event.title}-${index}`}
                className={`p-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform duration-200 ${categoryColors[event.category] || categoryColors.other}`}
              >
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
