'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpeakingAnimation from '../components/animation';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

interface SchedulePayload {
  userId: string;
  start_date: string;
  end_date: string;
  timezone: string;
  daily_schedule: any[];
}

export default function ModifyPage() { // ✅ Renamed component
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [question, setQuestion] = useState('');
  const [previous, setPrevious] = useState<{ client: string; model: string }[]>(
    []
  );
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAnimationOn, setIsAnimationOn] = useState(false);
  const [isListeningMode, setIsListeningMode] = useState(false);

  const recognitionRef = useRef<any>(null);

  // 🎙️ Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'en-IN';

    recog.onstart = () => {
      setIsListeningMode(true);
      setIsAnimationOn(true);
    };

    recog.onresult = (event: any) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;
      setQuestion((prev) => (prev ? prev + ' ' : '') + transcript.trim());
    };

    recog.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListeningMode(false);
      setIsAnimationOn(false);
    };

    recog.onend = () => {
      setIsListeningMode(false);
      setIsAnimationOn(false);
    };

    recognitionRef.current = recog;
  }, []);

  // 🎧 Start/Stop listening manually
  const handleTalk = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    if (isListeningMode) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // 🔊 Speak the AI's response
  async function speakResponse() {
    if (!response || typeof window.speechSynthesis === 'undefined') return;

    window.speechSynthesis.cancel();
    setIsAnimationOn(true);

    const utterance = new SpeechSynthesisUtterance(response);
    utterance.onend = () => {
      setIsAnimationOn(false);
    };
    utterance.onerror = () => {
      setIsAnimationOn(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  async function getAnswer() {
    if (!question.trim()) return;

    setLoading(true);
    setResponse('💭 Thinking...');
    const date = new Date();
    let currentUserId: string | null = null;
    let userName = 'User';

    // 1️⃣ Fetch user profile
    try {
      const profileRes = await fetch('/api/users/profile', {
        credentials: 'include',
      });
      const profileData = await profileRes.json();

      if (profileRes.ok && profileData.success) {
        currentUserId = profileData.user._id;
        userName = profileData.user.userName || 'User';
      } else {
        setResponse(
          `❌ Profile fetch failed: ${profileData.message || 'Not logged in.'}`
        );
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

    // 2️⃣ Fetch previous schedule (for AI context)
    let previousSchedule = null;
    try {
      const prevRes = await fetch(
        `/api/schedule/getWeek?userId=${currentUserId}`,
        { cache: 'no-store' }
      );
      if (prevRes.ok) previousSchedule = await prevRes.json();
    } catch (err) {
      console.warn('Could not fetch previous schedule:', err);
    }

    // 3️⃣ ✅ SMART DELETE: Delete previous *pending* schedule
    if (previousSchedule?.events?.length > 0) {
      try {
        setResponse('Clearing old pending tasks...');
        // This hits your "smart" route that preserves completed tasks
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
      setResponse('💭 Creating new schedule...');
      setIsAnimationOn(false);
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY!
      );
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // ✅ --- FULL PROMPT ---
      // This prompt explains the delete/create process
      const prompt = `
        You are a personal scheduling assistant. Your job is to generate a new JSON schedule for the user.

        **IMPORTANT CONTEXT ON HOW MY SYSTEM WORKS:**
        1.  **History is Kept:** When you generate a new schedule, my system has already **DELETED all old *pending* tasks** (where isCompleted: false). It has **KEPT all *completed* tasks** for the user's progress history.
        2.  **How You Save:** The 'data' object you provide will be used to create a new "Schedule" container, and then create *individual Event documents* for every single event in your 'daily_schedule'. These are all saved as new, pending (isCompleted: false) tasks.

        **YOUR TASK:**
        Create a new schedule based on the user's message. You can use their previous schedule for context, but your output will be a *brand new* set of events. Do not try to "modify" the old schedule, just generate a new one.

        **PREVIOUS SCHEDULE (for reference only):**
        ${JSON.stringify(
          previousSchedule || { message: 'No previous schedule found.' }
        )}

        **RULES:**
        1. Respond strictly in JSON only.
        2. JSON structure:
        {
          "type": "conversation" | "schedule",
          "message": "text (for conversation type)",
          "data": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "timezone": "Asia/Kolkata", "daily_schedule": [ { "date": "YYYY-MM-DD", "day_of_week": "Monday", "events": [ { "title": "Task title", "description": "Short description", "category": "study | work | exercise | hobby | other", "start_time": "HH:MM", "end_time": "HH:MM", "materials": ["optional links"] } ] } ] }
        }

        My name is: ${userName}
        User message: ${question}
        Chat history: ${JSON.stringify(previous)}
        Current date: ${date}
      `;
      // ✅ --- END OF FULL PROMPT ---

      const result = await model.generateContent(prompt);
      let raw = result.response.text();
      raw = raw.replace(/```[\s\S]*?```/g, (m) =>
        m.replace(/```(json)?/g, '').trim()
      );

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.error('JSON Parse Error:', err, raw);
        setResponse('⚠️ Invalid JSON from AI. Please try rephrasing.');
        setLoading(false);
        return;
      }

      // 5️⃣ Save new schedule or display conversation
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
            router.push('/schedule/week');
          } else {
            setResponse(
              `❌ DB Save Failed: ${data.message || 'Check console.'}`
            );
          }
        } catch (err) {
          console.error('❌ DB Submission Error:', err);
          setResponse('❌ An error occurred during database submission.');
        }
      } else if (parsed.type === 'conversation') {
        setResponse(parsed.message);
        speakResponse(); // 🔊 Auto-speak conversational responses
      } else {
        setResponse('⚠️ Unknown response format');
      }

      setPrevious((prev) => [
        ...prev,
        { client: question, model: parsed?.message || raw },
      ]);
      setQuestion('');
    } catch (error) {
      console.error('Gemini Error:', error);
      setResponse('❌ Something went wrong with the AI request.');
    }

    setLoading(false);
  }

  return (
    // ✅ 100VH LAYOUT: Main container
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white">
      <Navbar />

      {/* ✅ 100VH LAYOUT: Scrolling content area */}
      <main className="flex-grow flex items-center justify-center overflow-y-auto p-4 md:p-8">
        
        <div className="flex flex-col items-center w-full max-w-2xl bg-[#111827] bg-opacity-90 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-[#1f2937] shadow-[0_0_60px_rgba(0,255,255,0.15)]">
          <h1 className="text-4xl font-extrabold text-center mb-10 tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Modify Your Schedule
          </h1>

          <div className="w-full flex justify-center mb-10">
            <div className="scale-[1.5] max-w-[400px]">
              <SpeakingAnimation
                isPlaying={isAnimationOn}
                isListening={isListeningMode}
              />
            </div>
          </div>

          <div className="w-full mb-8">
            <label className="block text-sm font-medium text-cyan-400 mb-2 text-left">
              AI Assistant Response
            </label>
            <div className="relative p-4 md:p-6 rounded-xl bg-gray-900 border border-cyan-600 shadow-xl min-h-[120px] whitespace-pre-wrap">
              <p className="font-light text-xl text-gray-100 pr-10">
                {response || 'What would you like to change?'}
              </p>
              <button
                onClick={speakResponse}
                disabled={!response}
                className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-cyan-400 transition-colors disabled:opacity-30"
                title="Speak Aloud"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 1.614.393 3.11.848 4.5-1.096.353-1.688 1.539-1.218 2.654.47 1.114 1.733 1.529 2.868 1.025A9.757 9.757 0 0 0 4.508 21H6.44l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L19.5 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 0 0-1.06-1.06L19.5 10.94l-1.72-1.72z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="user-input"
              className="block text-sm font-medium text-gray-400 mb-2 text-left"
            >
              Your Message
            </label>
            <div className="flex items-center gap-3">
              <input
                id="user-input"
                type="text"
                placeholder="E.g., Plan my week, I have an exam..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) getAnswer();
                }}
                className="flex-1 p-4 rounded-xl bg-[#0d121f] border border-[#1e293b] text-white placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow duration-200"
              />

              {/* ✅ OLD "TALK" BUTTON STYLE */}
              <button
                onClick={handleTalk}
                className={`px-4 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all ${
                  isListeningMode
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'
                }`}
                title={isListeningMode ? 'Stop Listening' : 'Talk'}
              >
                {isListeningMode ? '...' : '🎙️'}
              </button>
              
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
      </main>
    </div>
  );
}