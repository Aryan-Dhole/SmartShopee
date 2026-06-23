import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ShoppingBag, Bell, TrendingDown, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import PlatformLogos from '../components/PlatformLogos';

const PRESET_TAGS = [
  'iPhone 16 pro',
  'Sony WH-1000XM4',
  'Nike Pegasus',
  'MacBook Pro M4',
  'Apple Watch Ultra',
];

const WORKING_STEPS = [
  {
    step: '01',
    title: 'Synthesize Store Telemetry',
    desc: 'Our high-speed scraper extracts real-time product inventories directly across Amazon, Flipkart, Croma, and top stores.',
    icon: ShoppingBag,
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
  },
  {
    step: '02',
    title: 'AI Analysis via Gemini',
    desc: 'In under 3 seconds, Gemini Flash synthesizes hundreds of buyer reviews into clear lists of pros, weaknesses, and a consensus verdict.',
    icon: Sparkles,
    color: 'from-purple-500/20 to-pink-500/20 text-purple-400',
  },
  {
    step: '03',
    title: 'Configure Threat Alert Limits',
    desc: 'Set a custom target price. Choose from prepared 5%, 10%, or 15% discounts, or define your own absolute decimal value threshold.',
    icon: Bell,
    color: 'from-amber-500/20 to-red-500/20 text-amber-400',
  },
  {
    step: '04',
    title: 'Instant Dropped Dispatches',
    desc: 'Receive urgent interface notices and direct updates when platform price engines trigger beneath your threat boundary line.',
    icon: TrendingDown,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
  },
];

const TESTIMONIALS = [
  {
    id: 't1',
    author: 'Elena Rostov',
    role: 'Lead Hardware Architect',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    quote: 'PriceWise saved me over ₹18,000 on my workspace setup. The real-time notification popped up when Flipkart dropped the price on the Apple MacBook Pro by 12% in the middle of the night!',
    rating: 5,
    tag: 'Saved ₹18,000',
  },
  {
    id: 't2',
    author: 'Devansh Mehta',
    role: 'Fullstack Developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    quote: 'I integrated the threat monitor on the Sony WH-1000XM5. The tracking charts were precise, showing exactly when Amazon tried to bait using dynamic pricing. Bought it at the ultimate dip!',
    rating: 5,
    tag: 'Saved ₹5,400',
  },
  {
    id: 't3',
    author: 'Zoe Sinclair',
    role: 'Professional Filmmaker',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    quote: 'Smarter Alternatives recommended DJI action cams over the standard GoPro with 15% lower price yet native water specs. Incredible intelligence engine! Fully worth signing in.',
    rating: 5,
    tag: 'Found Alternatives',
  },
];

export default function LandingPage() {
  const { darkMode, searchQuery, setSearchQuery } = useApp();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent, customQuery?: string) => {
    e.preventDefault();
    const query = customQuery || searchQuery;
    if (query.trim()) {
      setSearchQuery(query);
      navigate('/search');
    }
  };

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl space-y-6 relative z-10"
        >
          <span className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-indigo-500 uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full inline-flex items-center gap-1.5">
            <Sparkles size={12} className="animate-pulse" />
            AI-Powered Shopping Intelligence
          </span>
          <h1
            className={`text-4xl md:text-6xl font-black tracking-tight leading-tight ${
              darkMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            Never Overpay for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Tech & Lifestyle
            </span>{' '}
            Again.
          </h1>
          <p
            className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${
              darkMode ? 'text-white/50' : 'text-neutral-500'
            }`}
          >
            PriceWise instantly scans 10+ Indian platforms to find the lowest prices, tracks historical
            drops, and uses Gemini AI to synthesize reviews into actionable buying advice.
          </p>

          {/* Large Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className={`flex flex-col sm:flex-row gap-3 p-2 rounded-3xl border shadow-2xl backdrop-blur-xl ${
                darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="relative flex-1 flex items-center">
                <Search
                  className={`absolute left-4 ${darkMode ? 'text-white/30' : 'text-neutral-400'}`}
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Paste an Amazon/Flipkart URL or search for a product..."
                  className={`w-full bg-transparent border-none py-3 pr-4 pl-12 text-sm focus:outline-none ${
                    darkMode
                      ? 'text-white placeholder:text-white/30'
                      : 'text-neutral-900 placeholder:text-neutral-400'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="shrink-0 flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold tracking-tight text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                Scan Deals
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Presets */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span
                className={`font-mono uppercase tracking-wider text-[10px] ${
                  darkMode ? 'text-white/30' : 'text-neutral-400'
                }`}
              >
                Trending:
              </span>
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => handleSearchSubmit(e, tag)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    darkMode
                      ? 'border-white/5 bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Platform Scroller */}
      <section className="py-10 border-y bg-black/5 dark:border-white/5 border-neutral-100">
        <PlatformLogos darkMode={darkMode} />
      </section>

      {/* 3. How it Works */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="space-y-16"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2
              className={`text-3xl font-black tracking-tight ${
                darkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              How PriceWise Intel Protects Capital
            </h2>
            <p className={`text-sm ${darkMode ? 'text-white/50' : 'text-neutral-500'}`}>
              Dynamic e-commerce listings shift with every customer visit. Here is how our automated
              agent preserves your budget transparently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKING_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`border rounded-[24px] p-6 flex flex-col space-y-5 relative overflow-hidden transition-all ${
                    darkMode
                      ? 'bg-white/[0.02] border-white/5 hover:border-white/15'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                  }`}
                >
                  <div className={`p-3.5 rounded-xl w-fit bg-gradient-to-br ${step.color}`}>
                    <StepIcon size={24} />
                  </div>
                  <span
                    className={`absolute top-5 right-5 font-mono font-black text-3xl ${
                      darkMode ? 'text-white/5' : 'text-neutral-900/5'
                    }`}
                  >
                    {step.step}
                  </span>
                  <div className="space-y-2">
                    <h4
                      className={`font-bold text-sm uppercase tracking-wide font-mono ${
                        darkMode ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p
                      className={`text-xs leading-relaxed ${
                        darkMode ? 'text-white/50' : 'text-neutral-500'
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* 4. Testimonials */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="space-y-16"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-emerald-500 uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              Verified Audits
            </span>
            <h2
              className={`text-3xl font-black tracking-tight ${
                darkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              Real Savings. Real Users.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={`border rounded-[24px] p-8 flex flex-col justify-between space-y-6 ${
                  darkMode
                    ? 'bg-gradient-to-b from-white/[0.04] to-transparent border-white/10'
                    : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                    {t.tag}
                  </span>
                  <p
                    className={`text-sm italic leading-relaxed ${
                      darkMode ? 'text-white/70' : 'text-neutral-600'
                    }`}
                  >
                    "{t.quote}"
                  </p>
                </div>
                <div
                  className={`flex items-center gap-3 pt-5 border-t ${
                    darkMode ? 'border-white/10' : 'border-neutral-100'
                  }`}
                >
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h5 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                      {t.author}
                    </h5>
                    <p className={`text-[10px] font-mono ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 5. CTA Section */}
      <section className="px-6 py-24 mb-10 max-w-4xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`rounded-[40px] border p-12 md:p-20 relative overflow-hidden ${
            darkMode
              ? 'bg-gradient-to-b from-indigo-900/20 to-purple-900/10 border-white/10'
              : 'bg-gradient-to-b from-indigo-50 to-white border-indigo-100 shadow-xl'
          }`}
        >
          {/* Decorative blur elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]" />

          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            <h2
              className={`text-3xl md:text-5xl font-black tracking-tight ${
                darkMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              Stop guessing. Start saving.
            </h2>
            <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-neutral-600'}`}>
              Join thousands of smart shoppers using AI to track prices and uncover hidden deals across
              the Indian e-commerce landscape.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => document.querySelector('input')?.focus(), 500);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all"
              >
                Start Free Search
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                  darkMode
                    ? 'border-white/20 text-white hover:bg-white/5'
                    : 'border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                }`}
              >
                View Pricing
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
