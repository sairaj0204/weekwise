// // 'use client';

// // import { useState } from 'react';
// // import { GoogleGenerativeAI } from '@google/generative-ai';
// // import SpeakingAnimation from '../components/animation';

// // export default function Onboarding(){
// //   const [response, setResponse] = useState('');
// //   const [question, setQuestion] = useState('');
// //   const [previous, setPrevious] = useState<{ client: string; model: string }[]>([]);
// //   const [schedule, setSchedule] = useState<any>(null);
// //   const [loading, setLoading] = useState(false);

  
// //   const [isAnimationOn, setIsAnimationOn] = useState(false);
// //   const [isListeningMode, setIsListeningMode] = useState(false);

// //   async function getAnswer() {
// //     if (!question.trim()) return;

// //     setLoading(true);
// //     setResponse('💭 Thinking...');
// //     const date = new Date();

// //     try {
// //       setIsAnimationOn(false)
// //       const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
// //       const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// //       const prompt = `
// // You are a personal scheduling assistant.
// // You will help the user create a daily schedule based on their tasks and preferences.

// // Rules:
// // 1. Respond strictly in JSON only.
// // 2. JSON structure:
// // {
// //   "type": "conversation" | "schedule",
// //   "message": "text (for conversation type)",
// //   "data": {
// //     "start_date": "YYYY-MM-DD",
// //     "end_date": "YYYY-MM-DD",
// //     "timezone": "Asia/Kolkata",
// //     "daily_schedule": [
// //       {
// //         "date": "YYYY-MM-DD",
// //         "day_of_week": "Monday",
// //         "events": [
// //           {
// //             "title": "Task title",
// //             "description": "Short description",
// //             "category": "study | work | exercise | hobby | other",
// //             "start_time": "HH:MM",
// //             "end_time": "HH:MM",
// //             "materials": ["optional links"]
// //           }
// //         ]
// //       }
// //     ]
// //   }
// // }

// // Instructions:
// // - While user is chatting: type "conversation"
// // - When ready to provide schedule: type "schedule"
// // - Do not include any extra text outside JSON.

// // User message: ${question}
// // Chat history: ${JSON.stringify(previous)}
// // Current date: ${date}
// //       `;

// //       const result = await model.generateContent(prompt);
// //       let raw = result.response.text();

// //       // Remove code blocks
// //       raw = raw.replace(/```[\s\S]*?```/g, (m) => m.replace(/```(json)?/g, '').trim());

// //       let parsed;
// //       try {
// //         parsed = JSON.parse(raw);
// //         setIsAnimationOn(true)  
// //         window.speechSynthesis.cancel();
// //         if(parsed.type === 'conversation'){
// //           const utterance = new SpeechSynthesisUtterance(parsed.message);
// //           window.speechSynthesis.speak(utterance);
// //           utterance.onend = () => {
// //             setIsAnimationOn(false);
// //           };
// //         }
        
// //       } catch (err) {
// //         console.error('JSON Parse Error:', err, raw);
// //         setResponse('⚠️ Invalid JSON from AI.');
// //         setLoading(false);
// //         return;
// //       }

// //       if (parsed.type === 'schedule') {
// //         setSchedule(parsed.data);
// //         setResponse('✅ Schedule generated successfully!');

// //         // Save schedule to DB via server API
// //         try {
// //           const res = await fetch('/api/schedule/create', {
// //             method: 'POST',
// //             headers: { 'Content-Type': 'application/json' },
// //             body: JSON.stringify({
// //               userEmail: 'defaultuser@example.com',
// //               data: parsed.data,
// //             }),
// //           });

// //           const dbResult = await res.json();
// //           if (dbResult.success) {
// //             console.log('✅ Schedule saved to database:', dbResult.schedule);
// //           } else {
// //             console.error('❌ Failed to save schedule:', dbResult.error);
// //           }
// //         } catch (err) {
// //           console.error('❌ DB Error:', err);
// //         }

// //       } else if (parsed.type === 'conversation') {
// //         setResponse(parsed.message);
// //       } else {
// //         setResponse('⚠️ Unknown response format');
// //       }

// //       // Update conversation history
// //       setPrevious((prev) => [...prev, { client: question, model: parsed?.message || raw }]);
// //       setQuestion('');
// //     } catch (error) {
// //       console.error('Gemini Error:', error);
// //       setResponse('❌ Something went wrong.');
// //     }

// //     setLoading(false);
// //   }

// //   return (
// //     <div className="min-h-screen flex flex-row items-center justify-between bg-gradient-to-b from-gray-900 to-gray-800 text-white px-4">
      
// //       <div>
        
// //       </div>
      
// //       <div>
// //         <SpeakingAnimation 
// //         isPlaying={isAnimationOn}
// //         isListening={isListeningMode} 
// //       />
// //         <div className="mt-12 flex gap-4">
// //         <button
// //           onClick={() => setIsAnimationOn((p) => !p)}
// //           className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-semibold shadow-lg hover:from-cyan-300 hover:to-blue-500 transition-all"
// //         >
// //           {setIsAnimationOn ? "Stop Animation" : "Start Animation"}
// //         </button>
// //         <button
// //           onClick={() => setIsListeningMode((l) => !l)}
// //           className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 text-white font-semibold shadow-lg hover:from-purple-300 hover:to-pink-500 transition-all"
// //         >
// //           {setIsListeningMode ? "Stop Listening" : "Start Listening"}
// //         </button>
// //         </div>
// //       </div>
// //       <div className="w-full max-w-md bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-700">
// //         <h1 className="text-2xl font-semibold mb-4 text-center">💬 AI Schedule Assistant</h1>

// //         <div className="flex items-center gap-2 mb-4">
// //           <input
// //             type="text"
// //             placeholder="Type your message..."
// //             value={question}
// //             onChange={(e) =>  setQuestion(e.target.value)}
// //             className="flex-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
// //           />
// //           <button
// //             onClick={getAnswer}
// //             disabled={loading}
// //             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
// //           >
// //             {loading ? 'Thinking...' : 'Send'}
// //           </button>
// //         </div>

// //         <div className="bg-gray-800 rounded-xl p-3 min-h-[100px] text-sm whitespace-pre-wrap border border-gray-700 mb-4">
// //           {response || 'Start chatting with the AI...'}
// //         </div>

        
// //       </div>



// //       <div>
// //         <p>schedule</p>
// //         {schedule && (
// //           <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg overflow-x-auto">
// //             <h2 className="text-lg font-semibold mb-2 text-green-400">📅 Generated Schedule:</h2>
// //             {schedule.daily_schedule.map((day: any) => (
// //               <div key={day.date} className="mb-3 p-2 bg-gray-800/50 rounded-md border border-gray-700">
// //                 <h3 className="font-semibold">{day.day_of_week} - {day.date}</h3>
// //                 {day.events.map((event: any, idx: number) => (
// //                   <div key={idx} className="p-2 my-1 bg-gray-700/50 rounded-md border border-gray-600">
// //                     <strong>{event.title}</strong> ({event.start_time} - {event.end_time})
// //                     <p className="text-sm">{event.description}</p>
// //                     {event.materials && event.materials.length > 0 && (
// //                       <p className="text-xs text-blue-300">Materials: {event.materials.join(', ')}</p>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // pages/Onboarding.js
// 'use client';

// import { useState } from 'react';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import SpeakingAnimation from '../components/animation';

// export default function Onboarding() {
//   const [response, setResponse] = useState('');
//   const [question, setQuestion] = useState('');
//   const [previous, setPrevious] = useState<{ client: string; model: string }[]>([]);
//   const [schedule, setSchedule] = useState<any>(null);
//   const [loading, setLoading] = useState(false);

//   const [isAnimationOn, setIsAnimationOn] = useState(false);
//   const [isListeningMode, setIsListeningMode] = useState(false);
  
//   async function getAnswer() {
//     if (!question.trim()) return;

//     setLoading(true);
//     setResponse('💭 Thinking...');
//     const date = new Date();
//     const result = await fetch("/api/users/getName", 
//       {
//          method: "GET",
//          credentials: "include"
//       });
      
//       const data = await result.json()
//       const userName = data.userName
      
//     try {
//       setIsAnimationOn(false);
//       const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
//       const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

//       const prompt = `
// You are a personal scheduling assistant.
// You will help the user create a daily schedule based on their tasks and preferences.

// Rules:
// 1. Respond strictly in JSON only.
// 2. JSON structure:
// {
//   "type": "conversation" | "schedule",
//   "message": "text (for conversation type)",
//   "data": {
//     "start_date": "YYYY-MM-DD",
//     "end_date": "YYYY-MM-DD",
//     "timezone": "Asia/Kolkata",
//     "daily_schedule": [
//       {
//         "date": "YYYY-MM-DD",
//         "day_of_week": "Monday",
//         "events": [
//           {
//             "title": "Task title",
//             "description": "Short description",
//             "category": "study | work | exercise | hobby | other",
//             "start_time": "HH:MM",
//             "end_time": "HH:MM",
//             "materials": ["optional links"]
//           }
//         ]
//       }
//     ]
//   }
// }

// Instructions:
// - While user is chatting: type "conversation"
// - When ready to provide schedule: type "schedule"
// - Do not include any extra text outside JSON.

// My name is: ${userName}
// User message: ${question}
// Chat history: ${JSON.stringify(previous)}
// Current date: ${date}
//       `;

//       const result = await model.generateContent(prompt);
//       let raw = result.response.text();
//       raw = raw.replace(/```[\s\S]*?```/g, (m) => m.replace(/```(json)?/g, '').trim());

//       let parsed;
//       try {
//         parsed = JSON.parse(raw);
//         setIsAnimationOn(true);
//         window.speechSynthesis.cancel();
//         if (parsed.type === 'conversation') {
//           const utterance = new SpeechSynthesisUtterance(parsed.message);
//           window.speechSynthesis.speak(utterance);
//           utterance.onend = () => setIsAnimationOn(false);
//         }
//       } catch (err) {
//         console.error('JSON Parse Error:', err, raw);
//         setResponse('⚠️ Invalid JSON from AI.');
//         setLoading(false);
//         return;
//       }

//       if (parsed.type === 'schedule') {
//         setSchedule(parsed.data);
//         console.log(schedule);
//         console.log(parsed.data);
        
//         setResponse('✅ Schedule generated successfully!');
//         try {
//           const res = await fetch('/api/schedule/create', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               userEmail: 'defaultuser@example.com',
//               data: parsed.data,
//             }),
//           });
//           await res.json();
//         } catch (err) {
//           console.error('❌ DB Error:', err);
//         }
//       } else if (parsed.type === 'conversation') {
//         setResponse(parsed.message);
//       } else {
//         setResponse('⚠️ Unknown response format');
//       }

//       setPrevious((prev) => [...prev, { client: question, model: parsed?.message || raw }]);
//       setQuestion('');
//     } catch (error) {
//       console.error('Gemini Error:', error);
//       setResponse('❌ Something went wrong.');
//     }

//     setLoading(false);
//   }

//   return (
//     <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-between px-8 py-10 bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white gap-8">
      
//       {/* AI Chat Panel */}
//       <div className="flex flex-col items-center justify-start w-full lg:w-[60%] bg-[#111827]/70 backdrop-blur-2xl p-10 rounded-3xl border border-[#1f2937] shadow-[0_0_40px_rgba(0,255,255,0.1)]">
        
//         {/* Animation Section */}
//         <div className="w-full flex justify-center mb-10">
//           <div className="scale-[1.5] max-w-[400px]">
//             <SpeakingAnimation 
//               isPlaying={isAnimationOn}
//               isListening={isListeningMode} 
//             />
//           </div>
//         </div>

//         {/* Chat Section */}
//         <div className="w-full max-w-lg">
//           <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
//             AI Schedule Assistant
//           </h1>

//           <div className="flex items-center gap-2 mb-4">
//             <input
//               type="text"
//               placeholder="Ask me to plan your day..."
//               value={question}
//               onChange={(e) => setQuestion(e.target.value)}
//               className="flex-1 p-3 rounded-xl bg-[#0d121f] border border-[#1e293b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
//             />
//             <button
//               onClick={getAnswer}
//               disabled={loading}
//               className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
//             >
//               {loading ? 'Thinking...' : 'Send'}
//             </button>
//           </div>

//           <div className="p-4 rounded-xl bg-[#0e1625] border border-[#1e293b] text-gray-200 min-h-[120px] mb-4 whitespace-pre-wrap">
//             {response || 'Start chatting with the AI...'}
//           </div>

//           <div className="flex justify-center gap-4">
//             <button
//               onClick={() => setIsAnimationOn((p) => !p)}
//               className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-semibold shadow-lg hover:from-cyan-300 hover:to-blue-500 transition-all"
//             >
//               {isAnimationOn ? 'Stop Animation' : 'Start Animation'}
//             </button>
//             <button
//               onClick={() => setIsListeningMode((l) => !l)}
//               className="px-6 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white font-semibold shadow-lg hover:from-fuchsia-400 hover:to-pink-500 transition-all"
//             >
//               {isListeningMode ? 'Stop Listening' : 'Start Listening'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Schedule Panel */}
//       <div className="w-full lg:w-[40%] bg-[#111827]/70 backdrop-blur-2xl p-8 rounded-3xl border border-[#1f2937] shadow-[0_0_40px_rgba(0,255,255,0.08)] overflow-y-auto max-h-[85vh]">
//         <h2 className="text-2xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
//           📅 Your Schedule
//         </h2>
//         {schedule ? (
//           <div className="space-y-4">
//             {schedule.daily_schedule.map((day: any) => (
//               <div key={day.date} className="p-4 bg-[#0d121f] rounded-xl border border-[#1e293b]">
//                 <h3 className="font-semibold text-lg text-blue-400 mb-3">
//                   {day.day_of_week} - {day.date}
//                 </h3>
//                 {day.events.map((event: any, idx: number) => (
//                   <div
//                     key={idx}
//                     className="flex items-start gap-3 bg-[#0b0f1a] p-3 rounded-lg border border-[#1f2937] hover:border-cyan-500 transition"
//                   >
//                     <input
//                       type="checkbox"
//                       className="mt-1 w-5 h-5 accent-cyan-400 rounded-md border border-cyan-400/40 cursor-pointer"
//                     />
//                     <div>
//                       <strong className="text-white text-base">{event.title}</strong>
//                       <p className="text-sm text-gray-400">{event.start_time} - {event.end_time}</p>
//                       <p className="text-sm text-gray-300">{event.description}</p>
//                       {event.materials?.length > 0 && (
//                         <p className="text-xs text-cyan-300 mt-1">🔗 {event.materials.join(', ')}</p>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-gray-500 text-center">No schedule yet. Ask me to create one!</p>
//         )}
//       </div>
//     </div>
//   );
// }
'use client';

import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpeakingAnimation from '../components/animation';
import { useRouter } from 'next/navigation';

// Define the interface for the structure expected by the schedule API route
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
    let userName: string = 'User'; // Default name for the prompt

    // 1. 🚀 FETCH USER PROFILE & GET ID (New Logic)
    try {
      const profileRes = await fetch("/api/users/profile", {
         method: "GET",
         credentials: "include"
      });
      
      const profileData = await profileRes.json();
      
      if (profileRes.ok && profileData.success) {
        // The MongoDB ObjectId is under user._id
        currentUserId = profileData.user._id;
        userName = profileData.user.userName || 'User';
      } else {
        // Handle case where token is missing or user not found
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

    // Check if we successfully retrieved the user ID
    if (!currentUserId) {
        setResponse('❌ User ID not available. Cannot proceed.');
        setLoading(false);
        return;
    }

    // 2. GEMINI API CALL
    try {
      setIsAnimationOn(false);
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are a personal scheduling assistant.
        You will help the user create a daily schedule based on their tasks and preferences.

Rules:
1. Respond strictly in JSON only.
2. JSON structure:
{
  "type": "conversation" | "schedule",
  "message": "text (for conversation type)",
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

Instructions:
- While user is chatting: type "conversation"
- When ready to provide schedule: type "schedule"
- Do not include any extra text outside JSON.

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

      // 3. HANDLE SCHEDULE AND DB SUBMISSION
      if (parsed.type === 'schedule') {
        setSchedule(parsed.data);
        setResponse('✅ Schedule generated successfully! Attempting to save...');
        setIsAnimationOn(false)
        try {
          // Construct the required payload for /api/schedule/create
          const payload: SchedulePayload = {
            userId: currentUserId, // 👈 Correctly using the retrieved MongoDB ID
            ...parsed.data,       // 👈 Spreading the schedule data to the top level
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
              router.push("/schedule/week");
          } else {
              setResponse(`❌ DB Save Failed: ${data.message || 'Check console for details.'}`);
              console.error('DB Save Error:', data.message || 'Unknown save error');
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

  // The return block (JSX) remains exactly the same as you provided.
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-between px-8 py-10 bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white gap-8">
      
      {/* AI Chat Panel */}
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white">
      
    {/* AI Chat Panel - Centered and full focus */}
    <div className="flex flex-col items-center w-full max-w-2xl bg-[#111827] bg-opacity-90 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-[#1f2937] shadow-[0_0_60px_rgba(0,255,255,0.15)]">
        
        {/* Header and Title */}
        <h1 className="text-4xl font-extrabold text-center mb-10 tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to WeekWise
        </h1>
        
        {/* Animation Area */}
        <div className="w-full flex justify-center mb-10">
            <div className="scale-[1.5] max-w-[400px]">
                <SpeakingAnimation 
                    isPlaying={isAnimationOn}
                    isListening={isListeningMode} 
                />
            </div>
        </div>

        {/* Current AI Response Display (Enhanced BG) */}
        <div className="w-full mb-8">
            <label className="block text-sm font-medium text-cyan-400 mb-2 text-left">AI Assistant Response</label>
            
            {/* The primary response area with a distinct, light background for contrast */}
            <div className="p-4 md:p-6 rounded-xl bg-gray-900 border border-cyan-600 shadow-xl min-h-[120px] whitespace-pre-wrap">
                <p className="font-light text-xl text-gray-100">
                    {/* Display only the current response */}
                    {response || 'Start by telling me your scheduling needs...'}
                </p>
            </div>
        </div>

        {/* Input and Send Button */}
        <div className="w-full">
            <label htmlFor="user-input" className="block text-sm font-medium text-gray-400 mb-2 text-left">Your Message</label>
            <div className="flex items-center gap-3">
                <input
                    id="user-input"
                    type="text"
                    placeholder="E.g., Plan a day with 3 hours work and 1 hour exercise..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !loading) getAnswer();
                    }}
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
      {/* Schedule Panel
      <div className="w-full lg:w-[40%] bg-[#111827]/70 backdrop-blur-2xl p-8 rounded-3xl border border-[#1f2937] shadow-[0_0_40px_rgba(0,255,255,0.08)] overflow-y-auto max-h-[85vh]">
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          📅 Your Schedule
        </h2>
        {schedule ? (
          <div className="space-y-4">
            {schedule.daily_schedule.map((day: any) => (
              <div key={day.date} className="p-4 bg-[#0d121f] rounded-xl border border-[#1e293b]">
                <h3 className="font-semibold text-lg text-blue-400 mb-3">
                  {day.day_of_week} - {day.date}
                </h3>
                {day.events.map((event: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-[#0b0f1a] p-3 rounded-lg border border-[#1f2937] hover:border-cyan-500 transition"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 accent-cyan-400 rounded-md border border-cyan-400/40 cursor-pointer"
                    />
                    <div>
                      <strong className="text-white text-base">{event.title}</strong>
                      <p className="text-sm text-gray-400">{event.start_time} - {event.end_time}</p>
                      <p className="text-sm text-gray-300">{event.description}</p>
                      {event.materials?.length > 0 && (
                        <p className="text-xs text-cyan-300 mt-1">🔗 {event.materials.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No schedule yet. Ask me to create one!</p>
        )}
      </div> */}
    </div>
  );
}