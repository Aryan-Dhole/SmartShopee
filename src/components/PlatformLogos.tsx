import React from 'react';
import { motion } from 'motion/react';

const PLATFORMS = [
  { name: 'Amazon', color: 'bg-orange-500', logo: 'A' },
  { name: 'Flipkart', color: 'bg-blue-500', logo: 'F' },
  { name: 'Myntra', color: 'bg-pink-500', logo: 'M' },
  { name: 'Croma', color: 'bg-teal-500', logo: 'C' },
  { name: 'Reliance', color: 'bg-red-500', logo: 'R' },
  { name: 'Vijay Sales', color: 'bg-indigo-500', logo: 'V' },
  { name: 'Snapdeal', color: 'bg-rose-500', logo: 'S' },
  { name: 'Meesho', color: 'bg-fuchsia-500', logo: 'M' },
  { name: 'Blinkit', color: 'bg-yellow-500', logo: 'B' },
  { name: 'JioMart', color: 'bg-blue-600', logo: 'J' },
  { name: 'Tata CLiQ', color: 'bg-zinc-800', logo: 'T' },
];

export default function PlatformLogos({ darkMode = true }: { darkMode?: boolean }) {
  // Duplicate array to create seamless loop
  const logos = [...PLATFORMS, ...PLATFORMS];

  return (
    <div className="w-full overflow-hidden relative py-6">
      {/* Gradient masks for smooth fade in/out at edges */}
      <div
        className={`absolute inset-y-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r ${
          darkMode ? 'from-[#050505] to-transparent' : 'from-[#FAFAFB] to-transparent'
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l ${
          darkMode ? 'from-[#050505] to-transparent' : 'from-[#FAFAFB] to-transparent'
        }`}
      />

      <div className="flex w-[200%]">
        <motion.div
          className="flex gap-6 whitespace-nowrap px-3"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 35,
          }}
        >
          {logos.map((platform, i) => (
            <div
              key={`${platform.name}-${i}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all hover:-translate-y-1 ${
                darkMode
                  ? 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black text-white ${platform.color} shadow-sm`}
              >
                {platform.logo}
              </div>
              <span
                className={`text-xs font-bold tracking-tight ${
                  darkMode ? 'text-white/80' : 'text-neutral-700'
                }`}
              >
                {platform.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
