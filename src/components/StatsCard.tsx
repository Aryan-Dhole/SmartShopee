import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color: string;
  darkMode?: boolean;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  darkMode = true,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border p-5 relative overflow-hidden group transition-all ${
        darkMode
          ? 'bg-white/[0.03] border-white/5 hover:border-white/15'
          : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
      }`}
    >
      {/* Subtle gradient glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity ${color}`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-xl ${color} bg-opacity-10`}>
            <Icon size={18} />
          </div>
          {trend && (
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'text-emerald-500 bg-emerald-500/10'
                  : 'text-red-400 bg-red-500/10'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p
            className={`text-2xl font-bold tracking-tight ${
              darkMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          <p
            className={`text-[10px] font-mono uppercase tracking-widest ${
              darkMode ? 'text-white/35' : 'text-neutral-450'
            }`}
          >
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
