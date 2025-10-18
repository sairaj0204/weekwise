'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you can connect to an API to send message if needed
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0b0f1a] via-[#101826] to-[#0c0e14] text-white p-6">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl p-8 rounded-3xl bg-[#111827]/80 backdrop-blur-lg border border-[#1f2937] shadow-lg"
      >
        <h1 className="text-4xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Contact Us
        </h1>

        <p className="text-center text-gray-300 mb-8">
          You can reach us via email or phone, or send us a message using the form below.
        </p>

        <div className="mb-8 flex flex-col sm:flex-row justify-around gap-6">
          <div className="text-center bg-[#0d121f] p-6 rounded-xl border border-[#1e293b] shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-cyan-400">Email</h2>
            <p className="text-gray-200">weekwise.official@gmail.com</p>
          </div>
          <div className="text-center bg-[#0d121f] p-6 rounded-xl border border-[#1e293b] shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-cyan-400">Mobile</h2>
            <p className="text-gray-200">+91 9172961047</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full p-4 rounded-xl bg-[#0d121f] border border-[#1e293b] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full p-4 rounded-xl bg-[#0d121f] border border-[#1e293b] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <textarea
            placeholder="Your Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            rows={5}
            className="w-full p-4 rounded-xl bg-[#0d121f] border border-[#1e293b] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <motion.button
            type="submit"
            whileHover={{ scale: !loading ? 1.03 : 1 }}
            whileTap={{ scale: !loading ? 0.97 : 1 }}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition
              ${loading
                ? "bg-white/25 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95"
              }`}
          >
            {loading ? 'Sending…' : 'Send Message'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
