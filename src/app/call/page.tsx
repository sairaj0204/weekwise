'use client';

import { useState } from 'react';

export default function CallTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestCall = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 🚀 Call the Reminder API Route (GET /api/schedule/remind)
      const response = await fetch('/api/schedule/reminde', {
        method: 'GET',
        // Credentials are not strictly needed for this Cron route but included for consistency
        credentials: 'same-origin', 
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        // Capture the error message returned by the API route (e.g., 401, 500 status)
        setError(data.message || `API call failed with status: ${response.status}`);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError('Network error occurred. The server may be unreachable or the fetch failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="p-8 border rounded-xl shadow-2xl bg-white max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Reminder API Test Tool
        </h1>
        
        <button
          onClick={handleTestCall}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400"
        >
          {loading ? 'Executing Reminder Logic...' : 'Trigger Reminder Check (GET /api/schedule/remind)'}
        </button>

        {/* --- Results Display --- */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Test Result:</h2>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md whitespace-pre-wrap">
              <strong className="font-bold">Error:</strong> {error}
              <p className="mt-2 text-sm">Check your server console for database query errors.</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <p className={`p-2 rounded-md ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <strong>Status:</strong> {result.message}
              </p>
              <p className="text-sm text-gray-600">
                  Executed at: {new Date(result.timestamp).toLocaleTimeString()}
              </p>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <strong className="block mb-1 text-gray-800">Sent Emails:</strong>
                  <pre className="text-sm overflow-x-auto text-gray-900 bg-gray-100 p-2 rounded">
                      {JSON.stringify(result.sentEmails || 'No emails were found for this window.', null, 2)}
                  </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}