import React from 'react';
import { motion } from 'motion/react';

interface DealScoreGaugeProps {
  score: number; // 0-100
  size?: number;
  darkMode?: boolean;
}

function getScoreInfo(score: number) {
  if (score >= 85) return { label: 'STEAL', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', emoji: '🔥' };
  if (score >= 70) return { label: 'GREAT DEAL', color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.1)', emoji: '✨' };
  if (score >= 50) return { label: 'GOOD DEAL', color: '#facc15', bgColor: 'rgba(250, 204, 21, 0.1)', emoji: '👍' };
  if (score >= 30) return { label: 'FAIR', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)', emoji: '😐' };
  return { label: 'OVERPRICED', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', emoji: '⚠️' };
}

export default function DealScoreGauge({ score, size = 120, darkMode = true }: DealScoreGaugeProps) {
  const info = getScoreInfo(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference * 0.75;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-135">
          {/* Background arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            strokeWidth="6"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={info.color}
            strokeWidth="6"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${info.color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono font-black text-2xl"
            style={{ color: info.color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            {score}
          </motion.span>
          <span
            className={`text-[8px] font-mono uppercase tracking-widest ${
              darkMode ? 'text-white/30' : 'text-neutral-400'
            }`}
          >
            / 100
          </span>
        </div>
      </div>
      <div
        className="px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider"
        style={{ backgroundColor: info.bgColor, color: info.color }}
      >
        {info.emoji} {info.label}
      </div>
    </div>
  );
}
