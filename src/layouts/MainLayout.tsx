import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import NotificationCenter from '../components/NotificationCenter';
import AIChatPanel from '../components/AIChatPanel';
import PremiumCursor from '../components/PremiumCursor';
import { useApp } from '../contexts/AppContext';

export default function MainLayout() {
  const { darkMode } = useApp();

  return (
    <div
      className={`min-h-screen transition-all duration-300 relative overflow-hidden flex flex-col font-sans ${
        darkMode ? 'bg-[#050505] text-[#F5F5F7]' : 'bg-[#FAFAFB] text-[#1D1D1F]'
      }`}
    >
      <PremiumCursor />

      {/* Ambient Mesh Gradient Blur Circles */}
      {darkMode ? (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1a1a2e] rounded-full blur-[120px] opacity-40 pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2d1b0a] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
        </>
      ) : (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E5F1FF]/40 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFF1F1]/30 rounded-full blur-[100px] pointer-events-none z-0" />
        </>
      )}

      {/* Shared Modals and Panels */}
      <NotificationCenter />
      <AuthModal />
      <AIChatPanel />

      <Header />

      {/* Main Content Area */}
      <main className="flex-1 z-10 w-full relative">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
