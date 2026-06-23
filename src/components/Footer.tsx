import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Github, Twitter, Heart } from 'lucide-react';

const FOOTER_LINKS = {
  product: [
    { label: 'Search', path: '/search' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Compare', path: '/compare' },
    { label: 'Pricing', path: '/pricing' },
  ],
  company: [
    { label: 'About', path: '#' },
    { label: 'Blog', path: '#' },
    { label: 'Careers', path: '#' },
    { label: 'Contact', path: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', path: '#' },
    { label: 'Terms of Service', path: '#' },
    { label: 'Cookie Policy', path: '#' },
  ],
};

const PLATFORMS = [
  'Amazon India', 'Flipkart', 'Myntra', 'Croma', 'Reliance Digital',
  'Vijay Sales', 'Snapdeal', 'Meesho', 'JioMart', 'Tata CLiQ',
];

export default function Footer() {
  const { darkMode, currentUser } = useApp();

  return (
    <footer
      className={`z-10 border-t transition-all ${
        darkMode ? 'bg-[#050505] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl font-black ${
                  darkMode ? 'bg-white text-black' : 'bg-neutral-900 text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-sm ${darkMode ? 'bg-black' : 'bg-white'}`} />
              </div>
              <span className="font-semibold text-lg tracking-tight">PriceWise</span>
            </div>
            <p className={`text-xs leading-relaxed max-w-sm ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
              India's most intelligent price comparison engine. Powered by Gemini AI, tracking
              prices across {PLATFORMS.length}+ platforms in real-time so you never overpay.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                className={`rounded-full border p-2 transition-all ${
                  darkMode
                    ? 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                    : 'border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Twitter size={14} />
              </a>
              <a
                href="#"
                className={`rounded-full border p-2 transition-all ${
                  darkMode
                    ? 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                    : 'border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Github size={14} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4
              className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-4 ${
                darkMode ? 'text-white/50' : 'text-neutral-500'
              }`}
            >
              Product
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className={`text-xs transition-colors ${
                      darkMode ? 'text-white/40 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4
              className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-4 ${
                darkMode ? 'text-white/50' : 'text-neutral-500'
              }`}
            >
              Company
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className={`text-xs transition-colors ${
                      darkMode ? 'text-white/40 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4
              className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-4 ${
                darkMode ? 'text-white/50' : 'text-neutral-500'
              }`}
            >
              Legal
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className={`text-xs transition-colors ${
                      darkMode ? 'text-white/40 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Supported Platforms Strip */}
        <div
          className={`mt-10 pt-6 border-t ${darkMode ? 'border-white/5' : 'border-neutral-100'}`}
        >
          <p
            className={`text-[9px] font-mono uppercase tracking-widest mb-3 ${
              darkMode ? 'text-white/25' : 'text-neutral-400'
            }`}
          >
            Tracking prices across
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${
                  darkMode
                    ? 'bg-white/5 text-white/40 border border-white/5'
                    : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className={`border-t px-6 py-3.5 ${darkMode ? 'border-white/5 bg-black/40' : 'border-neutral-100 bg-neutral-50'}`}
      >
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-2">
          <div
            className={`flex gap-6 text-[10px] font-mono uppercase tracking-wider ${
              darkMode ? 'text-white/25' : 'text-neutral-400'
            }`}
          >
            <span>Session: {currentUser ? 'Active' : 'Guest'}</span>
            <span className="hidden sm:inline">Latency: ~24ms</span>
            <span className="hidden sm:inline">Grounding: Enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono flex items-center gap-1.5 ${
                darkMode ? 'text-white/25' : 'text-neutral-400'
              }`}
            >
              Built with <Heart size={9} className="text-red-500 fill-red-500" /> using Gemini AI
            </span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_#22c55e]" />
            <span
              className={`text-[10px] uppercase tracking-widest font-semibold font-mono ${
                darkMode ? 'text-white/40' : 'text-neutral-500'
              }`}
            >
              Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
