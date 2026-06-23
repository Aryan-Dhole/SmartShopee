import React from 'react';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Clock, ShieldCheck } from 'lucide-react';
import { BuyWaitAdvice } from '../types';

interface BuyWaitAdvisorProps {
  advice: BuyWaitAdvice;
  darkMode?: boolean;
}

export default function BuyWaitAdvisor({ advice, darkMode = true }: BuyWaitAdvisorProps) {
  const isBuy = advice.recommendation === 'buy_now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-5 relative overflow-hidden ${
        darkMode
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-neutral-200 shadow-sm'
      }`}
    >
      {/* Top accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          isBuy
            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
            : 'bg-gradient-to-r from-amber-500 to-yellow-400'
        }`}
      />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`shrink-0 p-3 rounded-xl ${
            isBuy
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-amber-500/10 text-amber-500'
          }`}
        >
          {isBuy ? <TrendingDown size={22} /> : <Clock size={22} />}
        </div>

        <div className="flex-1 space-y-3">
          {/* Recommendation badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest font-mono ${
                isBuy
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
              }`}
            >
              {isBuy ? '🛒 BUY NOW' : '⏳ WAIT'}
            </span>
            <span
              className={`text-[10px] font-mono ${
                darkMode ? 'text-white/40' : 'text-neutral-400'
              }`}
            >
              {advice.confidence}% confidence
            </span>
          </div>

          {/* Confidence bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
            <motion.div
              className={`h-full rounded-full ${
                isBuy ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${advice.confidence}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>

          {/* Reasoning */}
          <p
            className={`text-xs leading-relaxed ${
              darkMode ? 'text-white/55' : 'text-neutral-600'
            }`}
          >
            {advice.reasoning}
          </p>

          {/* Predicted range */}
          <div
            className={`flex items-center gap-4 pt-2 border-t text-[10px] font-mono ${
              darkMode ? 'border-white/5 text-white/40' : 'border-neutral-100 text-neutral-500'
            }`}
          >
            <div className="flex items-center gap-1">
              <TrendingDown size={11} className="text-emerald-500" />
              <span>Low: ₹{advice.predictedPriceRange.low.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp size={11} className="text-red-400" />
              <span>High: ₹{advice.predictedPriceRange.high.toLocaleString('en-IN')}</span>
            </div>
            {advice.bestTimeEstimate && (
              <div className="flex items-center gap-1">
                <Clock size={11} />
                <span>{advice.bestTimeEstimate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
