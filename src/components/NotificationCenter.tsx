import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function NotificationCenter() {
  const { darkMode, notifications, removeNotification } = useApp();

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className={`pointer-events-auto border p-4 rounded-2xl shadow-xl backdrop-blur-md flex flex-col gap-2 relative overflow-hidden ${
              darkMode
                ? 'bg-black/90 border-emerald-500/40 text-white'
                : 'bg-white border-emerald-500/50 text-neutral-900'
            }`}
          >
            {/* Top indicator */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-indigo-400" />

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Zap size={13} className="animate-bounce" />
                <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                  {notif.title}
                </span>
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className={`cursor-pointer ${
                  darkMode ? 'text-white/40 hover:text-white' : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <X size={12} />
              </button>
            </div>

            <div className="text-xs">
              <span
                className={`font-semibold line-clamp-1 ${
                  darkMode ? 'text-white/95' : 'text-neutral-900'
                }`}
              >
                {notif.productName}
              </span>
              <p
                className={`text-[11px] mt-1 leading-normal ${
                  darkMode ? 'text-white/50' : 'text-neutral-500'
                }`}
              >
                {notif.message}
              </p>
            </div>

            <div
              className={`mt-1.5 flex items-center justify-between border rounded-lg p-2 ${
                darkMode ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex flex-col text-[10px]">
                <span
                  className={`font-mono uppercase text-[9px] ${
                    darkMode ? 'text-white/35' : 'text-neutral-400'
                  }`}
                >
                  Platform
                </span>
                <span
                  className={`font-bold uppercase ${
                    darkMode ? 'text-white' : 'text-neutral-800'
                  }`}
                >
                  {notif.platform}
                </span>
              </div>
              <div className="text-right flex flex-col">
                <span
                  className={`font-mono text-[9px] ${
                    darkMode ? 'text-white/35' : 'text-neutral-400'
                  }`}
                >
                  STATUS
                </span>
                <span className="font-mono font-extrabold text-xs text-emerald-500">
                  {notif.priceTag}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
