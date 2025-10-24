'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import TimezoneSelect from 'react-timezone-select';
import { Toaster, toast } from 'react-hot-toast'; // Import Toaster

interface UserData {
  _id: string;
  userName: string;
  email: string;
  timezone: string;
}

export default function Navbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user data on mount using your profile route
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchUser();
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/logout', { method: 'GET' });
      if (res.ok) {
        router.push('/login'); // redirect to login page
      } else {
        console.error('Logout failed');
        toast.error('Logout failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during logout.');
    } finally {
      setLoading(false);
    }
  };

  // Calls the new API route
  const handleTimezoneChange = async (timezone: any) => {
    if (!user || timezone.value === user.timezone) return;

    try {
      // This route will get the user ID from the cookie
      const res = await fetch('/api/users/updateTimezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: timezone.value }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Timezone updated!");
        setUser(prev => prev ? { ...prev, timezone: data.timezone } : null);
        setIsDropdownOpen(false); // Close dropdown on success
      } else {
        toast.error(data.message || "Failed to update timezone.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <nav className="relative z-50 bg-[#0A192F] text-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Brand */}
            <div className="flex-shrink-0 text-2xl font-bold text-emerald-400">
              <Link href="/">WeekWise</Link>
            </div>

            {/* Centered Links */}
            <div className="hidden md:flex space-x-8">
              <Link href="/schedule/today" className="hover:text-emerald-400 transition-colors duration-200">
                Today
              </Link>
              <Link href="/schedule/week" className="hover:text-emerald-400 transition-colors duration-200">
                Week
              </Link>
              <Link href="/modify" className="hover:text-emerald-400 transition-colors duration-200">
                Modify
              </Link>
              <Link href="/progress" className="hover:text-emerald-400 transition-colors duration-200">
                Progress
              </Link>
              <Link href="/about" className="hover:text-emerald-400 transition-colors duration-200">
                Contact
              </Link>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="w-10 h-10 rounded-full bg-emerald-400 text-[#0A192F] flex items-center justify-center font-bold text-lg"
              >
                {user ? user.userName.charAt(0).toUpperCase() : '?'}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#112240] border border-[#233554] rounded-lg shadow-xl overflow-hidden">
                  {user ? (
                    <>
                      <div className="p-4 border-b border-[#233554]">
                        <p className="font-semibold text-white">{user.userName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <div className="p-4 space-y-2">
                        <label className="text-sm font-medium text-gray-300">Your Timezone</label>
                        <TimezoneSelect
                          value={user.timezone}
                          onChange={handleTimezoneChange}
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: '#0A192F',
                              borderColor: '#233554',
                              color: 'white',
                            }),
                            singleValue: (base) => ({ ...base, color: 'white' }),
                            input: (base) => ({...base, color: 'white'}),
                            menu: (base) => ({ ...base, backgroundColor: '#112240' }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? '#16a34a' : isFocused ? '#233554' : '#112240',
                              color: 'white',
                            }),
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          disabled={loading}
                          className="w-full text-left px-4 py-2 rounded-md text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200"
                        >
                          {loading ? 'Logging out...' : 'Logout'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-gray-400">Loading user...</div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              {/* You can add hamburger menu here if needed */}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}