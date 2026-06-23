import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Loader2,
  Clock,
  LayoutDashboard,
  CreditCard,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const NAV_LINKS = [
  { path: '/', label: 'Home', icon: null },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pricing', label: 'Pricing', icon: CreditCard },
];

export default function Header() {
  const {
    currentUser,
    loadingAuth,
    handleSignOut,
    darkMode,
    toggleDarkMode,
    setShowAuthModal,
    watchlistOpen,
    setWatchlistOpen,
  } = useApp();

  const location = useLocation();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all ${
        darkMode
          ? 'border-neutral-850 bg-[#050505]/80 text-[#F5F5F7]'
          : 'border-neutral-200/85 bg-white/75 text-neutral-900'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-sans font-black transition-transform group-hover:scale-105 ${
              darkMode ? 'bg-white text-black' : 'bg-neutral-900 text-white'
            }`}
          >
            <div className={`w-4 h-4 rounded-sm ${darkMode ? 'bg-black' : 'bg-white'}`} />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-sans font-semibold text-lg tracking-tight ${
                darkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              PriceWise
            </span>
            <span
              className={`text-[9px] font-mono uppercase tracking-widest ${
                darkMode ? 'text-white/40' : 'text-neutral-450'
              }`}
            >
              Intel Engine v2.0
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  isActive
                    ? darkMode
                      ? 'text-white bg-white/10'
                      : 'text-neutral-900 bg-neutral-100'
                    : darkMode
                    ? 'text-white/50 hover:text-white hover:bg-white/5'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-indigo-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status + Controls */}
        <div className="flex items-center gap-3">
          {/* Time & Status - hidden on mobile */}
          <div
            className={`hidden lg:flex items-center gap-4 text-[10px] font-mono ${
              darkMode ? 'text-white/35' : 'text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock size={11} className={darkMode ? 'text-white/25' : 'text-neutral-400'} />
              <span>{currentTime.toISOString().replace('T', ' ').substring(11, 19)} UTC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Watchlist bell */}
          {currentUser && (
            <button
              onClick={() => setWatchlistOpen(!watchlistOpen)}
              className={`relative rounded-full border p-2 transition-all cursor-pointer ${
                darkMode
                  ? 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Bell size={16} />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1]" />
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`rounded-full border p-2 transition-all cursor-pointer ${
              darkMode
                ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Settings for logged in users */}
          {currentUser && (
            <Link
              to="/settings"
              className={`rounded-full border p-2 transition-all cursor-pointer hidden sm:flex ${
                darkMode
                  ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Settings size={16} />
            </Link>
          )}

          {/* Auth */}
          {loadingAuth ? (
            <div className="h-9 w-9 flex items-center justify-center">
              <Loader2
                className={`animate-spin ${darkMode ? 'text-white/40' : 'text-neutral-400'}`}
                size={16}
              />
            </div>
          ) : currentUser ? (
            <div
              className={`flex items-center gap-2 border rounded-2xl p-1.5 pr-3 ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-neutral-200 shadow-sm'
              }`}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="h-7 w-7 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-[10px]">
                  {currentUser.displayName?.substring(0, 2).toUpperCase() || 'US'}
                </div>
              )}
              <span
                className={`hidden text-xs font-semibold sm:block ${
                  darkMode ? 'text-white/80' : 'text-neutral-800'
                }`}
              >
                {currentUser.displayName?.split(' ')[0]}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                  darkMode
                    ? 'text-white/40 hover:bg-red-500/10 hover:text-red-400'
                    : 'text-neutral-400 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black tracking-tight hover:bg-white/90 shadow-sm transition-all cursor-pointer"
            >
              Sign in
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden rounded-xl border p-2 transition-all cursor-pointer ${
              darkMode
                ? 'border-white/10 bg-white/5 text-white/60'
                : 'border-neutral-200 bg-white text-neutral-600'
            }`}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`md:hidden border-t px-6 py-4 ${
            darkMode ? 'border-white/5 bg-[#050505]/95' : 'border-neutral-100 bg-white'
          }`}
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? darkMode
                        ? 'text-white bg-white/10'
                        : 'text-neutral-900 bg-neutral-100'
                      : darkMode
                      ? 'text-white/50 hover:text-white hover:bg-white/5'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {currentUser && (
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  darkMode
                    ? 'text-white/50 hover:text-white hover:bg-white/5'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Settings
              </Link>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
}
