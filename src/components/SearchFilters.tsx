import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const PLATFORMS = [
  'Amazon India', 'Flipkart', 'Myntra', 'Snapdeal', 'Croma Store',
  'Vijay Sales', 'Reliance Digital', 'Meesho', 'Blinkit', 'JioMart',
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rating' },
  { value: 'reviews', label: 'Most Reviews' },
];

interface SearchFiltersProps {
  darkMode?: boolean;
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  platforms: string[];
  priceRange: [number, number];
  minRating: number;
  sortBy: string;
}

export default function SearchFilters({ darkMode = true, onFilterChange }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const clearFilters = () => {
    setSelectedPlatforms([]);
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setSortBy('relevance');
  };

  const activeFilterCount =
    selectedPlatforms.length +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (sortBy !== 'relevance' ? 1 : 0);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        darkMode
          ? 'bg-white/[0.02] border-white/5'
          : 'bg-white border-neutral-200 shadow-xs'
      }`}
    >
      {/* Toggle bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-5 py-3 cursor-pointer ${
          darkMode ? 'text-white/60 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} />
          <span className="text-xs font-semibold">Filters & Sort</span>
          {activeFilterCount > 0 && (
            <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className={`px-5 pb-5 space-y-5 border-t ${darkMode ? 'border-white/5' : 'border-neutral-100'}`}>
          {/* Platforms */}
          <div className="pt-4">
            <label
              className={`text-[10px] font-mono uppercase tracking-widest block mb-2.5 ${
                darkMode ? 'text-white/35' : 'text-neutral-400'
              }`}
            >
              Platforms
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                    selectedPlatforms.includes(p)
                      ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
                      : darkMode
                      ? 'border-white/5 text-white/40 hover:text-white/70 hover:bg-white/5'
                      : 'border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range + Rating + Sort */}
          <div className="flex flex-col gap-4">
            {/* Price Range */}
            <div>
              <label
                className={`text-[10px] font-mono uppercase tracking-widest block mb-2 ${
                  darkMode ? 'text-white/35' : 'text-neutral-400'
                }`}
              >
                Price Range (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className={`w-full border rounded-lg px-3 py-2 text-xs ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                  }`}
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className={`w-full border rounded-lg px-3 py-2 text-xs ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                  }`}
                />
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <label
                className={`text-[10px] font-mono uppercase tracking-widest block mb-2 ${
                  darkMode ? 'text-white/35' : 'text-neutral-400'
                }`}
              >
                Min Rating
              </label>
              <div className="flex gap-1">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-2.5 py-2 rounded-lg text-[10px] font-medium cursor-pointer border transition-all ${
                      minRating === r
                        ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
                        : darkMode
                        ? 'border-white/5 text-white/40 hover:bg-white/5'
                        : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {r === 0 ? 'Any' : `${r}★+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label
                className={`text-[10px] font-mono uppercase tracking-widest block mb-2 ${
                  darkMode ? 'text-white/35' : 'text-neutral-400'
                }`}
              >
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs cursor-pointer ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                }`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear button */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide cursor-pointer ${
                darkMode ? 'text-white/35 hover:text-white/60' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <X size={11} />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
