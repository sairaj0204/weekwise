'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/logout', { method: 'GET' });
      if (res.ok) {
        router.push('/login'); // redirect to login page
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-[#0A192F] text-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 text-2xl font-bold text-emerald-400">
            WeekWise
          </div>

          {/* Centered Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-emerald-400 transition-colors duration-200">
              Home
            </Link>
            <Link href="/modify" className="hover:text-emerald-400 transition-colors duration-200">
              Modify
            </Link>
            <Link href="/schedule/week" className="hover:text-emerald-400 transition-colors duration-200">
              Week
            </Link>
            <Link href="/schedule/today" className="hover:text-emerald-400 transition-colors duration-200">
              Today
            </Link>
            <Link href="/progress" className="hover:text-emerald-400 transition-colors duration-200">
              Progress
            </Link>
            <Link href="/about" className="hover:text-emerald-400 transition-colors duration-200">
              Contact
            </Link>
          </div>

          {/* Logout Button */}
          <div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-emerald-400 hover:bg-emerald-500 text-[#0A192F] font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {/* You can add hamburger menu here if needed */}
          </div>
        </div>
      </div>
    </nav>
  );
}
