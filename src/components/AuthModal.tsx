import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, ChevronRight, X, Mail, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, handleGoogleSignIn, handleEmailSignIn, darkMode } =
    useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!showAuthModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAuthModal(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`relative z-10 w-full max-w-md rounded-[28px] border p-8 shadow-2xl ${
            darkMode ? 'bg-[#0a0a0c] border-white/10' : 'bg-white border-neutral-200'
          }`}
        >
          {/* Close button */}
          <button
            onClick={() => setShowAuthModal(false)}
            className={`absolute top-5 right-5 p-1.5 rounded-full transition-all cursor-pointer ${
              darkMode
                ? 'bg-white/5 hover:bg-white/15 text-white/50 hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <X size={14} />
          </button>

          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-3 text-white shadow-lg shadow-indigo-500/20">
              <Shield size={26} />
            </div>
            <div>
              <h3
                className={`text-xl font-bold tracking-tight ${
                  darkMode ? 'text-white' : 'text-neutral-900'
                }`}
              >
                Welcome to PriceWise
              </h3>
              <p
                className={`text-xs mt-1.5 max-w-[280px] mx-auto ${
                  darkMode ? 'text-white/40' : 'text-neutral-500'
                }`}
              >
                Sign in to unlock price tracking, alerts, and your personalized shopping dashboard.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className={`w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 font-bold tracking-tight transition-all cursor-pointer text-sm border ${
                darkMode
                  ? 'bg-white text-black hover:bg-neutral-200 border-white/20'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-900'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill={darkMode ? '#000' : '#fff'}
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill={darkMode ? '#333' : '#ddd'}
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill={darkMode ? '#222' : '#ccc'}
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill={darkMode ? '#111' : '#bbb'}
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative flex py-3 items-center">
              <div
                className={`flex-grow border-t ${
                  darkMode ? 'border-white/5' : 'border-neutral-200'
                }`}
              />
              <span
                className={`flex-shrink mx-3 text-[10px] font-mono uppercase ${
                  darkMode ? 'text-white/25' : 'text-neutral-400'
                }`}
              >
                or continue with email
              </span>
              <div
                className={`flex-grow border-t ${
                  darkMode ? 'border-white/5' : 'border-neutral-200'
                }`}
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2.5">
              <div className="relative">
                <Mail
                  className={`absolute top-3.5 left-3.5 ${
                    darkMode ? 'text-white/25' : 'text-neutral-400'
                  }`}
                  size={15}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={`w-full border rounded-xl py-3 pr-4 pl-10 text-sm transition-all focus:outline-none ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/30'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              <div className="relative">
                <Lock
                  className={`absolute top-3.5 left-3.5 ${
                    darkMode ? 'text-white/25' : 'text-neutral-400'
                  }`}
                  size={15}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full border rounded-xl py-3 pr-10 pl-10 text-sm transition-all focus:outline-none ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/30'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-3.5 right-3.5 cursor-pointer ${
                    darkMode ? 'text-white/30 hover:text-white/60' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={() => handleEmailSignIn(email || 'user@pricewise.app')}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white tracking-tight hover:opacity-90 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Sign In
            </button>

            {/* Quick Demo Access */}
            <div className="pt-1">
              <button
                onClick={() => handleEmailSignIn('demo@pricewise.app')}
                className={`w-full text-center py-2 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  darkMode
                    ? 'text-white/30 hover:text-white/60'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Skip — Use Demo Account →
              </button>
            </div>
          </div>

          {/* Footer text */}
          <p
            className={`text-center text-[9px] mt-5 font-mono ${
              darkMode ? 'text-white/20' : 'text-neutral-400'
            }`}
          >
            Protected by AES-256 encryption · Zero-trust architecture
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
