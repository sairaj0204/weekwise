'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpeakingAnimation from '../components/animation';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar'; // Assuming Navbar is in components
import { Toaster } from 'react-hot-toast';

// Define the interface for the structure expected by the schedule API route
interface SchedulePayload {
  userId: string;
  start_date: string;
  end_date: string;
  timezone: string;
  daily_schedule: any[];
}

// Define the states for our multi-step flow
type FlowStep = 'chatting' | 'confirming' | 'scheduling';

export default function Onboarding() {
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [question, setQuestion] = useState('');
  const [previous, setPrevious] = useState<{ client: string; model: string }[]>(
    []
  );
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // States for the confirmation flow
  const [flowStep, setFlowStep] = useState<FlowStep>('chatting');
  const [information, setInformation] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('User');

  // States for STT/TTS
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

  // ✅ Helper function to fetch the user profile ONCE
  async function fetchUserProfile() {
    if (currentUserId) return true; // Already fetched

    setLoading(true);
    setResponse('Connecting to your profile...');
    try {
      const profileRes = await fetch('/api/users/profile', {
        method: 'GET',
        credentials: 'include',
      });
      const profileData = await profileRes.json();

      if (profileRes.ok && profileData.success) {
        setCurrentUserId(profileData.user._id);
        setCurrentUserName(profileData.user.userName || 'User');
        setResponse('Profile loaded. How can I help you plan your day?');
        setLoading(false);
        return true;
      } else {
        setResponse(
          `❌ Profile fetch failed: ${profileData.message || 'Not logged in.'}`
        );
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Profile Fetch Error:', err);
      setResponse('❌ Failed to connect to user profile service.');
      setLoading(false);
      return false;
    }
  }

  // ✅ Main function to handle the conversation (NO delete logic)
  async function getAnswer() {
    if (!question.trim()) return;

    // 1. Fetch user profile if not already fetched
    const profileFetched = await fetchUserProfile();
    if (!profileFetched) return;

    setLoading(true);
    setResponse('💭 Thinking...');
    const date = new Date();

    // 2. Call Gemini API
    try {
      setIsAnimationOn(false); // Turn off for thinking
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY!
      );
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // ✅ --- ONBOARDING PROMPT ---
      // Explains the multi-step flow
      const prompt = `
        You are a personal scheduling assistant. Your goal is to first understand the user (this is their first time), and then create their initial schedule.

        Rules:
        1. Respond strictly in JSON only.
        2. JSON structure:
        {
          "type": "conversation" | "information" | "schedule",
          "message": "text (for conversation type, or a confirmation prompt for information type)",
          "information": "A concise, one-paragraph summary of the user's key details, habits, and preferences. (for information type only)",
          "data": { ... } // (for schedule type only - format below)
        }
        Schedule 'data' format: { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "timezone": "Asia/Kolkata", "daily_schedule": [ { "date": "YYYY-MM-DD", "day_of_week": "Monday", "events": [ { "title": "Task title", "description": "Short description", "category": "study | work | exercise | hobby | other", "start_time": "HH:MM", "end_time": "HH:MM", "materials": ["optional links"] } ] } ] }


        Instructions:
        1.  **Chat (conversation):** Start by chatting with the user. Ask about their goals, habits, and any specific tasks for their first schedule.
        2.  **Summarize (information):** Once you have enough detail, respond with \`type: "information"\`. Include a \`message\` like "Okay, here's what I've gathered about you. Does this look correct?" and the \`information\` summary.
        3.  **Wait for Confirmation:** The user will confirm or deny this.
        4.  **Schedule (schedule):** After confirmation (which will be in a future prompt), you will be asked to generate the schedule. Do NOT generate a schedule until you are explicitly asked.

        My name is: ${currentUserName}
        User message: ${question}
        Chat history: ${JSON.stringify(previous)}
        Current date: ${date}
      `;
      // ✅ --- END OF ONBOARDING PROMPT ---

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

      // 3. Handle different AI response types
      if (parsed.type === 'information') {
        setInformation(parsed.information);
        setResponse(parsed.message);
        setFlowStep('confirming');
        speakResponse(); // Speak the confirmation message
      } else if (parsed.type === 'conversation') {
        setResponse(parsed.message);
        speakResponse(); // Speak the conversational message
      } else if (parsed.type === 'schedule') {
        setResponse(
          "Let's confirm your details first. Please tell me more about your preferences."
        );
        speakResponse(); // Speak the correction
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

  // ✅ New function to handle the "Confirm" button click
  async function handleConfirm() {
    if (!information || !currentUserId) return;

    setLoading(true);
    setResponse('Saving your information...');
    setIsAnimationOn(false);

    // 1. Save information to DB
    try {
      const res = await fetch('/api/users/updateInfo', { // Assumes you have this route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, information }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save info');
      }

      setResponse('Information saved! Now generating your schedule...');
      await generateSchedule(); // Proceed to generate schedule
    } catch (err: any) {
      console.error('Error saving information:', err);
      setResponse(`❌ Failed to save your info: ${err.message}`);
      setLoading(false);
    }
  }

  // ✅ New function to handle the "Deny" button click
  function handleDeny() {
    setFlowStep('chatting');
    const denyMessage = 'My apologies. Please tell me what to correct.';
    setResponse(denyMessage);
    setPrevious((prev) => [
      ...prev,
      { client: 'That information is incorrect.', model: denyMessage },
    ]);
    setInformation(null);
    speakResponse(); // Speak the apology
  }

  // ✅ New function to generate the final schedule
  async function generateSchedule() {
    setFlowStep('scheduling');
    setLoading(true);
    const date = new Date();

    try {
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY!
      );
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Prompt asking AI to generate the schedule based on confirmed info
      const prompt = `
        You are a schedule generator. The user has already confirmed their details.
        Your task is to generate their first schedule based on their preferences.

        Rules:
        1. Respond strictly in JSON only.
        2. JSON structure:
        {
          "type": "schedule",
          "data": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "timezone": "Asia/Kolkata", "daily_schedule": [ { "date": "YYYY-MM-DD", "day_of_week": "Monday", "events": [ { "title": "Task title", "description": "Short description", "category": "study | work | exercise | hobby | other", "start_time": "HH:MM", "end_time": "HH:MM", "materials": ["optional links"] } ] } ] }
        }

        Instructions:
        - Respond *only* with the \`type: "schedule"\` JSON. Do not add any conversational text.

        Confirmed User Information: ${information}
        My name is: ${currentUserName}
        Original Request: ${previous.map(p => p.client).join('\n')}
        Current date: ${date}
      `;

      const result = await model.generateContent(prompt);
      let raw = result.response.text();
      raw = raw.replace(/```[\s\S]*?```/g, (m) =>
        m.replace(/```(json)?/g, '').trim()
      );

      const parsed = JSON.parse(raw);

      if (parsed.type === 'schedule') {
        setSchedule(parsed.data);
        setResponse('✅ Schedule generated successfully! Saving...');

        // Save schedule to DB
        const payload: SchedulePayload = {
          userId: currentUserId!,
          ...parsed.data,
        };

        const res = await fetch('/api/schedule/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok) {
          setResponse(`✅ Schedule saved! Redirecting...`);
          router.push('/schedule/week'); // Redirect on success
        } else {
          setResponse(`❌ DB Save Failed: ${data.message || 'Check console'}`);
        }
      } else {
        throw new Error('AI failed to return a schedule');
      }
    } catch (err: any) {
      console.error('Schedule Generation Error:', err);
      setResponse(`❌ Failed to generate schedule: ${err.message}. Please try again.`);
      setFlowStep('chatting'); // Reset flow on failure
    }
    setLoading(false);
  }

  return (
    // ✅ 100VH LAYOUT: Main container
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white">
      <Toaster position="top-right" />
      

      {/* ✅ 100VH LAYOUT: Scrolling content area */}
      <main className="flex-grow flex items-center justify-center overflow-y-auto p-4 md:p-8">
        
        <div className="flex flex-col items-center w-full max-w-2xl bg-[#111827] bg-opacity-90 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-[#1f2937] shadow-[0_0_60px_rgba(0,255,255,0.15)]">
          <h1 className="text-4xl font-extrabold text-center mb-10 tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to WeekWise
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
                {response || 'Start by telling me your scheduling needs...'}
              </p>
              {flowStep === 'confirming' && information && (
                <div className="mt-4 p-4 border-t border-cyan-700">
                  <p className="text-lg text-white font-medium">
                    Here's my summary:
                  </p>
                  <p className="text-md text-gray-300 italic">
                    "{information}"
                  </p>
                </div>
              )}
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
            {/* Conditionally show chat input OR confirm/deny buttons */}
            {flowStep === 'chatting' ? (
              <>
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
                    placeholder="E.g., Plan my first week..."
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
              </>
            ) : flowStep === 'confirming' ? (
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDeny}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl font-semibold text-lg hover:from-red-500 hover:to-pink-500 transition-all shadow-lg disabled:opacity-50"
                >
                  That's Wrong
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl font-semibold text-lg hover:from-green-400 hover:to-cyan-400 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Looks Good!'}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg text-cyan-400">
                  {loading ? 'Generating schedule...' : 'Schedule complete!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}