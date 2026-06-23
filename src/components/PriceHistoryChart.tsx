import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { PricePoint } from '../types';


const TIMEFRAMES = ['1W', '1M', '3M', '6M', '1Y'] as const;

interface PriceHistoryChartProps {
  currentPrice: number;
  priceHistory?: PricePoint[];
  darkMode?: boolean;
  compact?: boolean;
}

export default function PriceHistoryChart({
  currentPrice,
  priceHistory,
  darkMode = true,
  compact = false,
}: PriceHistoryChartProps) {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>('1M');

  // Use provided history or fallback to a single data point
  const data =
    priceHistory && priceHistory.length > 0
      ? priceHistory
      : [{ price: currentPrice, timestamp: new Date().toISOString() }];

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const priceDiff = lastPrice - firstPrice;
  const priceDiffPercent = ((priceDiff / firstPrice) * 100).toFixed(1);
  const isUp = priceDiff > 0;
  const isFlat = Math.abs(priceDiff) < firstPrice * 0.01;

  const chartColor = isFlat ? '#6366f1' : isUp ? '#ef4444' : '#22c55e';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`rounded-xl px-3.5 py-2.5 shadow-xl border text-xs ${
            darkMode
              ? 'bg-[#0a0a0c] border-white/10 text-white'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          <p className={`font-mono text-[9px] uppercase ${darkMode ? 'text-white/40' : 'text-neutral-400'}`}>
            {label}
          </p>
          <p className="font-bold font-mono text-sm" style={{ color: chartColor }}>
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className="w-full h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`compactGrad-${currentPrice}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={1.5}
              fill={`url(#compactGrad-${currentPrice})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-2xl border p-5 ${
        darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-neutral-200 shadow-xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4
            className={`text-sm font-bold tracking-tight ${
              darkMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            Price History
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {isFlat ? (
              <Minus size={12} className="text-indigo-500" />
            ) : isUp ? (
              <TrendingUp size={12} className="text-red-400" />
            ) : (
              <TrendingDown size={12} className="text-emerald-500" />
            )}
            <span
              className={`text-[10px] font-mono font-bold ${
                isFlat ? 'text-indigo-500' : isUp ? 'text-red-400' : 'text-emerald-500'
              }`}
            >
              {isUp ? '+' : ''}
              {priceDiffPercent}% ({timeframe})
            </span>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                  : darkMode
                  ? 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'}
            />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 9, fill: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[minPrice * 0.95, maxPrice * 1.05]}
              tick={{ fontSize: 9, fill: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgPrice}
              stroke={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
              strokeDasharray="4 4"
              label={{
                value: 'Avg',
                position: 'right',
                fill: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                fontSize: 9,
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 4,
                stroke: chartColor,
                strokeWidth: 2,
                fill: darkMode ? '#0a0a0c' : '#fff',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div
        className={`mt-4 grid grid-cols-3 gap-3 pt-4 border-t ${
          darkMode ? 'border-white/5' : 'border-neutral-100'
        }`}
      >
        <div className="text-center">
          <p
            className={`text-[9px] font-mono uppercase ${
              darkMode ? 'text-white/25' : 'text-neutral-400'
            }`}
          >
            Lowest
          </p>
          <p className="text-xs font-bold text-emerald-500 font-mono">
            ₹{minPrice.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p
            className={`text-[9px] font-mono uppercase ${
              darkMode ? 'text-white/25' : 'text-neutral-400'
            }`}
          >
            Average
          </p>
          <p
            className={`text-xs font-bold font-mono ${
              darkMode ? 'text-white/70' : 'text-neutral-600'
            }`}
          >
            ₹{avgPrice.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p
            className={`text-[9px] font-mono uppercase ${
              darkMode ? 'text-white/25' : 'text-neutral-400'
            }`}
          >
            Highest
          </p>
          <p className="text-xs font-bold text-red-400 font-mono">
            ₹{maxPrice.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
