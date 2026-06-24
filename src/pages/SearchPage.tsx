import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Activity,
  Zap,
  Sparkles,
  Clock,
  X,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronRight,
  Radio,
  Loader2,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ProductSearchResult } from '../types';
import ProductCard from '../components/ProductCard';
import SearchFilters, { FilterState } from '../components/SearchFilters';

// ─── Search Loader Component ────────────────────────────────────────

const SCAN_STEPS = [
  { platform: "Amazon India", icon: "🟠", color: "text-amber-400" },
  { platform: "Flipkart", icon: "🔵", color: "text-blue-400" },
  { platform: "Croma", icon: "🟢", color: "text-teal-400" },
  { platform: "Reliance Digital", icon: "🟡", color: "text-orange-400" },
  { platform: "Vijay Sales", icon: "🔴", color: "text-red-400" },
  { platform: "Snapdeal", icon: "🟣", color: "text-purple-400" },
];

function SearchLoader() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDone(prev => [...prev, step]);
      setStep(s => (s + 1) % SCAN_STEPS.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      {/* Central spinner */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 animate-ping [animation-delay:150ms]" />
        <div className="relative w-20 h-20 rounded-full border-2 border-indigo-500/30 flex items-center justify-center">
          <Radio className="text-indigo-400 animate-pulse" size={26} />
        </div>
      </div>

      {/* Headline */}
      <div className="text-center">
        <p className="text-sm font-mono uppercase tracking-widest text-white/40 animate-pulse">
          Scanning live prices
        </p>
        <p className="text-xs text-white/20 mt-1">Powered by Gemini Search Grounding</p>
      </div>

      {/* Platform scan progress */}
      <div className="w-full max-w-xs space-y-2">
        {SCAN_STEPS.map((s, i) => {
          const isDone = done.includes(i);
          const isActive = step === i;
          return (
            <motion.div
              key={s.platform}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: isDone ? 0.5 : isActive ? 1 : 0.3 }}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl"
              style={{ background: isActive ? 'rgba(99,102,241,0.06)' : 'transparent' }}
            >
              <span className="text-sm">{s.icon}</span>
              <span className={`text-xs font-mono flex-1 ${isDone ? 'text-white/30 line-through' : isActive ? s.color : 'text-white/30'}`}>
                {s.platform}
              </span>
              {isDone && <span className="text-[10px] text-emerald-500 font-mono">✓</span>}
              {isActive && <Loader2 size={11} className={`${s.color} animate-spin`} />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


export default function SearchPage() {
  const {
    darkMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    handleSearch,
    searchHistory,
    clearSearchHistory,
    comparedProducts,
    handleToggleCompare,
    currentUser,
    addNotification,
  } = useApp();

  const [filteredResults, setFilteredResults] = useState<ProductSearchResult[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    priceRange: [0, 0],
    minRating: 0,
    sortBy: 'relevance',
  });

  // Search history dropdown
  const [showHistory, setShowHistory] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Trigger search on mount if query exists
  useEffect(() => {
    if (searchQuery) {
      handleSearch(undefined, searchQuery);
    }
  }, [location.pathname]);

  // Apply filters whenever results or filters change
  useEffect(() => {
    applyFilters(searchResults, filters);
  }, [searchResults, filters]);


  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyFilters = (data: ProductSearchResult[], currentFilters: FilterState) => {
    let filtered = [...data];

    if (currentFilters.platforms.length > 0) {
      filtered = filtered.filter((p) => currentFilters.platforms.includes(p.platform));
    }
    if (currentFilters.priceRange[0] > 0) {
      filtered = filtered.filter((p) => p.price >= currentFilters.priceRange[0]);
    }
    if (currentFilters.priceRange[1] > 0) {
      filtered = filtered.filter((p) => p.price <= currentFilters.priceRange[1]);
    }
    if (currentFilters.minRating > 0) {
      filtered = filtered.filter((p) => p.rating >= currentFilters.minRating);
    }

    if (currentFilters.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentFilters.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentFilters.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentFilters.sortBy === 'reviews') {
      filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    setFilteredResults(filtered);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    handleSearch(undefined, query);
    inputRef.current?.blur();
  };

  const handleCompareNavigate = () => {
    navigate('/compare');
  };

  const handleProductSelect = (product: ProductSearchResult) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const showHistoryDropdown = inputFocused && searchHistory.length > 0 && !searching;

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full gap-6">

      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

        {/* Search Input with History Dropdown */}
        <div className="w-full md:w-2/3 lg:w-1/2 relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowHistory(false);
              handleSearch(e);
            }}
            className={`flex items-center p-1.5 border rounded-2xl transition-all shadow-sm ${
              darkMode
                ? 'bg-[#0a0a0c] border-white/10 focus-within:border-indigo-500/50 focus-within:shadow-indigo-500/10 focus-within:shadow-lg'
                : 'bg-white border-neutral-200 focus-within:border-indigo-500/40 focus-within:shadow-indigo-500/10 focus-within:shadow-lg'
            }`}
          >
            <Search
              className={`ml-3 mr-2 shrink-0 transition-colors ${
                inputFocused
                  ? 'text-indigo-500'
                  : darkMode ? 'text-white/30' : 'text-neutral-400'
              }`}
              size={18}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowHistory(true);
              }}
              onFocus={() => {
                setInputFocused(true);
                setShowHistory(true);
              }}
              onBlur={() => setInputFocused(false)}
              placeholder="Search products or paste a URL..."
              className={`w-full bg-transparent border-none py-2 text-sm focus:outline-none ${
                darkMode ? 'text-white placeholder:text-white/30' : 'text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowHistory(false);
                  inputRef.current?.focus();
                }}
                className={`p-1.5 mr-1 rounded-lg transition-colors ${
                  darkMode ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={searching}
              className="ml-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search History Dropdown */}
          <AnimatePresence>
            {showHistoryDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl border shadow-2xl overflow-hidden ${
                  darkMode
                    ? 'bg-[#0d0d10] border-white/10 shadow-black/50'
                    : 'bg-white border-neutral-200 shadow-neutral-200/80'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${darkMode ? 'text-white/40' : 'text-neutral-400'}`}>
                    Recent Searches
                  </span>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearSearchHistory();
                    }}
                    className={`text-[10px] hover:underline transition-colors ${darkMode ? 'text-white/30 hover:text-white/60' : 'text-neutral-400 hover:text-neutral-600'}`}
                  >
                    Clear all
                  </button>
                </div>
                <ul className="py-1.5">
                  {searchHistory.map((query, i) => (
                    <li key={i}>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleHistoryClick(query);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                          darkMode ? 'hover:bg-white/5 text-white/70' : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <Clock size={13} className={darkMode ? 'text-white/25 shrink-0' : 'text-neutral-300 shrink-0'} />
                        <span className="truncate flex-1">{query}</span>
                        <ArrowUpRight size={12} className={`shrink-0 opacity-0 group-hover:opacity-100 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Intelligence Status indicator */}
        {searchResults.length > 0 && !searching && (
          <div className={`hidden md:flex items-center gap-3 px-4 py-2 border rounded-xl text-[10px] font-mono tracking-widest uppercase ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-neutral-200 bg-white shadow-sm'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-500">
              <Activity size={12} />
              <span>Realtime Scrape</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Zap size={12} />
              <span>Gemini Analysed</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 shrink-0">
          <SearchFilters darkMode={darkMode} onFilterChange={handleFilterChange} />

          {/* Compare queue mini-widget */}
          <AnimatePresence>
            {comparedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className={`mt-4 border rounded-2xl p-4 ${
                  darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-neutral-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                    Compare Queue
                  </h4>
                  <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-md">
                    {comparedProducts.length}/2
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {comparedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <img src={p.imageUrl} className="w-6 h-6 object-contain rounded bg-white" />
                      <span className={`text-xs truncate flex-1 ${darkMode ? 'text-white/70' : 'text-neutral-600'}`}>{p.title}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCompareNavigate}
                  disabled={comparedProducts.length < 2}
                  className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Compare Now <ChevronRight size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {searching ? (
          <SearchLoader />
          ) : filteredResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
                  Found {filteredResults.length} {filteredResults.length === 1 ? 'match' : 'matches'}
                </span>
                <span className={`text-xs ${darkMode ? 'text-white/20' : 'text-neutral-400'}`}>
                  Powered by Gemini Search Grounding
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isCompared={comparedProducts.some((p) => p.id === product.id)}
                    onToggleCompare={handleToggleCompare}
                    onSelect={() => handleProductSelect(product)}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            /* Filters active but nothing matches */
            <div className={`flex flex-col items-center justify-center py-20 text-center border rounded-[32px] border-dashed ${darkMode ? 'border-white/10 bg-white/[0.01]' : 'border-neutral-200 bg-neutral-50'}`}>
              <SlidersHorizontal className={`mb-4 ${darkMode ? 'text-white/20' : 'text-neutral-300'}`} size={36} />
              <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>No results match filters</h3>
              <p className={`text-sm max-w-sm ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
                Try widening your price range or removing platform filters to see more results.
              </p>
            </div>
          ) : searchQuery && !searching ? (
            <div className={`flex flex-col items-center justify-center py-20 text-center border rounded-[32px] border-dashed ${darkMode ? 'border-white/10 bg-white/[0.01]' : 'border-neutral-200 bg-neutral-50'}`}>
              <Search className={`mb-4 ${darkMode ? 'text-white/20' : 'text-neutral-300'}`} size={48} />
              <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>No results found</h3>
              <p className={`text-sm max-w-md ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
                We couldn't find any exact matches. Try a broader term or paste a product URL directly.
              </p>
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-24 text-center border rounded-[32px] border-dashed ${darkMode ? 'border-white/10 bg-white/[0.01]' : 'border-neutral-200 bg-neutral-50'}`}>
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="mb-4 text-indigo-500/50" size={52} />
              </motion.div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>Search across everything</h3>
              <p className={`text-sm max-w-md mb-6 ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
                Type a product name or paste an Amazon / Flipkart URL. Gemini will scan the web and find you the best live deals.
              </p>
              {searchHistory.length > 0 && (
                <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? 'text-white/30' : 'text-neutral-400'}`}>Recent</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {searchHistory.slice(0, 5).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleHistoryClick(q)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          darkMode
                            ? 'border-white/10 text-white/50 hover:border-indigo-500/40 hover:text-white/80 hover:bg-indigo-500/5'
                            : 'border-neutral-200 text-neutral-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
