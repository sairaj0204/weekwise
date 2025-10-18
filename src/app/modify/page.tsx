'use client';

import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpeakingAnimation from '../components/animation';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

// Define the interface for schedule payload
interface SchedulePayload {
  userId: string;
  start_date: string;
  end_date: string;
  timezone: string;
  daily_schedule: any[];
}

export default function Onboarding() {
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [question, setQuestion] = useState('');
  const [previous, setPrevious] = useState<{ client: string; model: string }[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAnimationOn, setIsAnimationOn] = useState(false);
  const [isListeningMode, setIsListeningMode] = useState(false);

  async function getAnswer() {
    if (!question.trim()) return;

    setLoading(true);
    setResponse('💭 Thinking...');
    const date = new Date();
    let currentUserId: string | null = null;
    let userName = 'User';

    // 1️⃣ Fetch user profile
    try {
      const profileRes = await fetch('/api/users/profile', { credentials: 'include' });
      const profileData = await profileRes.json();

      if (profileRes.ok && profileData.success) {
        currentUserId = profileData.user._id;
        userName = profileData.user.userName || 'User';
      } else {
        setResponse(`❌ Profile fetch failed: ${profileData.message || 'Not logged in.'}`);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Profile Fetch Error:', err);
      setResponse('❌ Failed to connect to user profile service.');
      setLoading(false);
      return;
    }

    if (!currentUserId) {
      setResponse('❌ User ID not available. Cannot proceed.');
      setLoading(false);
      return;
    }

    // 2️⃣ Fetch previous schedule
    let previousSchedule = null;
    try {
      const prevRes = await fetch(`/api/schedule/getWeek?userId=${currentUserId}`, { cache: 'no-store' });
      if (prevRes.ok) previousSchedule = await prevRes.json();
    } catch (err) {
      console.warn('Could not fetch previous schedule:', err);
    }

    // 3️⃣ Delete previous schedule (if exists)
    if (previousSchedule?.events?.length > 0) {
      try {
        await fetch('/api/schedule/deleteByUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId }),
        });
      } catch (err) {
        console.error('Failed to delete previous schedule:', err);
      }
    }

    // 4️⃣ Call Gemini AI
    try {
      setIsAnimationOn(false);
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are a personal scheduling assistant.
        Update the user's schedule based on new requirements.
        Include previous schedule for reference:
        ${JSON.stringify(previousSchedule || {})}

        Rules:
        Respond strictly in JSON:
        {
          "type": "conversation" | "schedule",
          "message": "text for conversation",
          "data": {
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD",
            "timezone": "Asia/Kolkata",
            "daily_schedule": [
              {
                "date": "YYYY-MM-DD",
                "day_of_week": "Monday",
                "events": [
                  {
                    "title": "Task title",
                    "description": "Short description",
                    "category": "study | work | exercise | hobby | other",
                    "start_time": "HH:MM",
                    "end_time": "HH:MM",
                    "materials": ["optional links"]
                  }
                ]
              }
            ]
          }
        }

        My name is: ${userName}
        User message: ${question}
        Chat history: ${JSON.stringify(previous)}
        Current date: ${date}
      `;

      const result = await model.generateContent(prompt);
      let raw = result.response.text();
      raw = raw.replace(/```[\s\S]*?```/g, (m) => m.replace(/```(json)?/g, '').trim());

      let parsed;
      try {
        parsed = JSON.parse(raw);
        setIsAnimationOn(true);
        window.speechSynthesis.cancel();
        if (parsed.type === 'conversation') {
          const utterance = new SpeechSynthesisUtterance(parsed.message);
          window.speechSynthesis.speak(utterance);
          utterance.onend = () => setIsAnimationOn(false);
        }
      } catch (err) {
        console.error('JSON Parse Error:', err, raw);
        setResponse('⚠️ Invalid JSON from AI. Please try rephrasing.');
        setLoading(false);
        return;
      }

      // 5️⃣ Save new schedule
      if (parsed.type === 'schedule') {
        setSchedule(parsed.data);
        setResponse('✅ Schedule generated successfully! Saving to database...');
        setIsAnimationOn(false);

        try {
          const payload: SchedulePayload = {
            userId: currentUserId,
            ...parsed.data,
          };

          const res = await fetch('/api/schedule/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (res.ok) {
            setResponse(`✅ Schedule saved! ID: ${data.scheduleId}`);
            console.log('Schedule Saved to DB:', data);
            router.push('/schedule/week');
          } else {
            setResponse(`❌ DB Save Failed: ${data.message || 'Check console.'}`);
            console.error('DB Save Error:', data.message || 'Unknown');
          }
        } catch (err) {
          console.error('❌ DB Submission Error:', err);
          setResponse('❌ An error occurred during database submission.');
        }
      } else if (parsed.type === 'conversation') {
        setResponse(parsed.message);
      } else {
        setResponse('⚠️ Unknown response format');
      }

      setPrevious((prev) => [...prev, { client: question, model: parsed?.message || raw }]);
      setQuestion('');
    } catch (error) {
      console.error('Gemini Error:', error);
      setResponse('❌ Something went wrong with the AI request.');
    }

    setLoading(false);
  }

  return (
    <>
    <Navbar/>
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-between px-8 py-10 bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white gap-8">
      {/* Chat Panel */}
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white">
        <div className="flex flex-col items-center w-full max-w-2xl bg-[#111827] bg-opacity-90 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-[#1f2937] shadow-[0_0_60px_rgba(0,255,255,0.15)]">
          <h1 className="text-4xl font-extrabold text-center mb-10 tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to WeekWise
          </h1>

          <div className="w-full flex justify-center mb-10">
            <div className="scale-[1.5] max-w-[400px]">
              <SpeakingAnimation isPlaying={isAnimationOn} isListening={isListeningMode} />
            </div>
          </div>

          <div className="w-full mb-8">
            <label className="block text-sm font-medium text-cyan-400 mb-2 text-left">AI Assistant Response</label>
            <div className="p-4 md:p-6 rounded-xl bg-gray-900 border border-cyan-600 shadow-xl min-h-[120px] whitespace-pre-wrap">
              <p className="font-light text-xl text-gray-100">
                {response || 'Start by telling me your scheduling needs...'}
              </p>
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="user-input" className="block text-sm font-medium text-gray-400 mb-2 text-left">Your Message</label>
            <div className="flex items-center gap-3">
              <input
                id="user-input"
                type="text"
                placeholder="E.g., Plan a day with 3 hours work and 1 hour exercise..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && !loading) getAnswer(); }}
                className="flex-1 p-4 rounded-xl bg-[#0d121f] border border-[#1e293b] text-white placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow duration-200"
              />
              <button
                onClick={getAnswer}
                disabled={loading || !question.trim()}
                className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg disabled:opacity-50 disabled:bg-gray-700"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
