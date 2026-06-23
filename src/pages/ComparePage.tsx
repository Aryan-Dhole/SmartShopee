import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  X,
  Star,
  ExternalLink,
  Check,
  Loader2,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertCircle,
  Plus,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useApp } from "../contexts/AppContext";
import { ProductSearchResult } from "../types";
import { getComparison } from "../services/api-client";
import { generateFallbackPriceHistory } from "../utils/price-utils";
import { subscribeToUserWatchlist } from "../firebase-service";

export default function ComparePage() {
  const {
    comparedProducts,
    handleToggleCompare,
    clearCompare,
    darkMode,
    searchResults,
    currentUser
  } = useApp();

  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState<{
    verdict: string;
    productAShort: string;
    productBShort: string;
    metrics: { name: string; valA: string; valB: string; winner: "A" | "B" | "Tie" }[];
  } | null>(null);

  const productA = comparedProducts[0];
  const productB = comparedProducts[1];

  // Load watchlist if user is logged in to help them pick items for comparison
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToUserWatchlist(
        currentUser.uid,
        (tracks: any[]) => {
          setWatchlist(tracks);
        },
        (err: any) => console.error("Compare page watchlist failed:", err)
      );
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Fetch AI comparison when 2 products are selected
  useEffect(() => {
    if (!productA || !productB) {
      setComparisonSummary(null);
      return;
    }

    setLoadingSummary(true);
    
    getComparison(productA, productB)
      .then((data) => {
        setComparisonSummary({
          verdict: data.verdict,
          productAShort: data.productASummary,
          productBShort: data.productBSummary,
          metrics: data.metrics,
        });
      })
      .catch((err) => {
        console.error("Comparison load error: ", err);
      })
      .finally(() => setLoadingSummary(false));
  }, [productA, productB]);

  // Combine price history for the chart
  const getCombinedChartData = () => {
    if (!productA || !productB) return [];
    
    const historyA = generateFallbackPriceHistory(productA.price);
    const historyB = generateFallbackPriceHistory(productB.price);

    const labelA = productA.title.substring(0, 15) + "...";
    const labelB = productB.title.substring(0, 15) + "...";

    return historyA.map((pt, idx) => ({
      timestamp: pt.timestamp,
      [labelA]: pt.price,
      [labelB]: historyB[idx]?.price || productB.price
    }));
  };

  const combinedHistory = getCombinedChartData();
  const labelA = productA ? productA.title.substring(0, 15) + "..." : "";
  const labelB = productB ? productB.title.substring(0, 15) + "..." : "";

  // Helper lists to pick compare candidates from
  const candidatePool = [
    ...watchlist.map(w => ({
      id: w.id,
      title: w.productName,
      price: w.currentPrice,
      platform: w.platform,
      imageUrl: w.imageUrl,
      rating: 4.8,
      reviewsCount: 384,
      url: w.url
    })),
    ...searchResults
  ].filter(
    (item, index, self) =>
      self.findIndex((t) => t.title === item.title) === index && // deduplicate
      !comparedProducts.some((cp) => cp.title === item.title) // exclude already compared
  );

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full gap-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FF0033] animate-pulse" />
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${darkMode ? "text-white/45" : "text-neutral-500"}`}>
              Specs & Price Overlap Engine
            </span>
          </div>
          <h1 className={`text-2xl md:text-3xl font-black mt-1 ${darkMode ? "text-white" : "text-neutral-900"}`}>
            Hardware Comparison Console
          </h1>
        </div>

        {comparedProducts.length > 0 && (
          <button
            onClick={clearCompare}
            className={`px-4 py-2 border rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              darkMode ? "border-white/10 hover:bg-white/5 text-white/70 hover:text-white" : "border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Clear Comparison Queue
          </button>
        )}
      </div>

      {/* Main Layout Blocks */}
      {comparedProducts.length === 2 ? (
        <div className="grid grid-cols-1 gap-6">
          
          {/* Side by Side Product Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A */}
            <div className={`relative rounded-3xl border p-6 flex flex-col justify-between overflow-hidden ${
              darkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-neutral-200 shadow-sm"
            }`}>
              <button
                onClick={() => handleToggleCompare(productA)}
                className="absolute top-4 right-4 p-1 rounded-full border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 cursor-pointer"
                title="Remove from comparison"
              >
                <X size={14} />
              </button>
              
              <div className="flex items-center gap-1.5 mb-4">
                <span className="h-2 w-2 rounded-full bg-[#FF0033]" />
                <span className={`text-[9px] uppercase tracking-wider font-mono font-bold ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
                  Item A • {productA.platform}
                </span>
              </div>

              <div className="flex gap-5 items-center md:items-start flex-col sm:flex-row text-center sm:text-left">
                <div className={`h-24 w-24 shrink-0 rounded-2xl border p-2 flex items-center justify-center bg-white ${
                  darkMode ? "border-white/5" : "border-neutral-200"
                }`}>
                  <img src={productA.imageUrl} alt={productA.title} className="max-h-20 object-contain" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className={`text-base font-bold tracking-tight leading-tight line-clamp-2 ${darkMode ? "text-white" : "text-neutral-900"}`}>
                    {productA.title}
                  </h3>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-xs">
                    <Star size={12} className="fill-yellow-400 stroke-yellow-400" />
                    <span className="font-bold">{productA.rating}</span>
                    <span className={darkMode ? "text-white/40" : "text-neutral-500"}>({productA.reviewsCount} reviews)</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold font-mono ${darkMode ? "text-white" : "text-neutral-900"}`}>
                      ₹{productA.price.toLocaleString("en-IN")}
                    </span>
                    {productA.originalPrice && (
                      <span className={`text-xs line-through font-mono ${darkMode ? "text-white/30" : "text-neutral-450"}`}>
                        ₹{productA.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-white/5 flex items-center justify-between">
                <span className={`text-[10px] font-mono ${darkMode ? "text-white/30" : "text-neutral-400"}`}>Compare Source ID: {productA.id.slice(0, 8)}</span>
                <a
                  href={productA.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border font-bold transition-all cursor-pointer ${
                    darkMode ? "bg-white/5 border-white/15 text-white/80 hover:text-white" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  Go to Merchant <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Card B */}
            <div className={`relative rounded-3xl border p-6 flex flex-col justify-between overflow-hidden ${
              darkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-neutral-200 shadow-sm"
            }`}>
              <button
                onClick={() => handleToggleCompare(productB)}
                className="absolute top-4 right-4 p-1 rounded-full border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/5 cursor-pointer"
                title="Remove from comparison"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-1.5 mb-4">
                <span className="h-2 w-2 rounded-full bg-white/40" />
                <span className={`text-[9px] uppercase tracking-wider font-mono font-bold ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
                  Item B • {productB.platform}
                </span>
              </div>

              <div className="flex gap-5 items-center md:items-start flex-col sm:flex-row text-center sm:text-left">
                <div className={`h-24 w-24 shrink-0 rounded-2xl border p-2 flex items-center justify-center bg-white ${
                  darkMode ? "border-white/5" : "border-neutral-200"
                }`}>
                  <img src={productB.imageUrl} alt={productB.title} className="max-h-20 object-contain" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className={`text-base font-bold tracking-tight leading-tight line-clamp-2 ${darkMode ? "text-white" : "text-neutral-900"}`}>
                    {productB.title}
                  </h3>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-xs">
                    <Star size={12} className="fill-yellow-400 stroke-yellow-400" />
                    <span className="font-bold">{productB.rating}</span>
                    <span className={darkMode ? "text-white/40" : "text-neutral-500"}>({productB.reviewsCount} reviews)</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold font-mono ${darkMode ? "text-white" : "text-neutral-900"}`}>
                      ₹{productB.price.toLocaleString("en-IN")}
                    </span>
                    {productB.originalPrice && (
                      <span className={`text-xs line-through font-mono ${darkMode ? "text-white/30" : "text-neutral-450"}`}>
                        ₹{productB.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-white/5 flex items-center justify-between">
                <span className={`text-[10px] font-mono ${darkMode ? "text-white/30" : "text-neutral-400"}`}>Compare Source ID: {productB.id.slice(0, 8)}</span>
                <a
                  href={productB.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border font-bold transition-all cursor-pointer ${
                    darkMode ? "bg-white/5 border-white/15 text-white/80 hover:text-white" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  Go to Merchant <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Pricing Timeline Charts side by side overlay */}
          <div className={`rounded-3xl border p-5 ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <div className="mb-4">
              <h4 className={`text-xs uppercase tracking-wider font-mono font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>
                Price Fluctuation Overlays (30d Trend)
              </h4>
              <p className={`text-[10px] font-mono ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
                Comparative tracking curves between Item A (Red) and Item B (Gray)
              </p>
            </div>

            <div className="h-60 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} vertical={false} />
                  <XAxis dataKey="timestamp" stroke={darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke={darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} fontSize={8} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: darkMode ? "#0a0a0c" : "#fff",
                      borderRadius: "16px",
                      border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                      color: darkMode ? "#fff" : "#000"
                    }}
                  />
                  <Line type="monotone" dataKey={labelA} stroke="#FF0033" strokeWidth={2.5} dot={{ r: 3, fill: "#FF0033" }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey={labelB} stroke="#a3a3a3" strokeWidth={2} dot={{ r: 3, fill: "#a3a3a3" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Specifications Table */}
          <div className={`rounded-3xl border overflow-hidden ${
            darkMode ? "border-white/5" : "border-neutral-200"
          }`}>
            <div className={`px-5 py-4 border-b font-mono text-[10px] uppercase font-bold ${
              darkMode ? "bg-white/[0.02] border-white/5 text-white/80" : "bg-neutral-50 border-neutral-200 text-neutral-700"
            }`}>
              Side-by-side spec comparison table
            </div>
            
            <div className="divide-y divide-white/5 dark:divide-white/5 font-mono text-xs">
              {comparisonSummary ? (
                comparisonSummary.metrics.map((metric, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-4 items-center gap-3 md:gap-2">
                    <span className={`text-[10px] uppercase font-bold text-left ${darkMode ? "text-white/30" : "text-neutral-450"}`}>
                      {metric.name}
                    </span>
                    <div className={`flex items-center gap-1.5 ${metric.winner === "A" ? "text-[#FF0033] font-bold" : darkMode ? "text-white/80" : "text-neutral-800"}`}>
                      {metric.valA}
                      {metric.winner === "A" && <Check size={11} className="text-[#FF0033]" />}
                    </div>
                    <div className={`flex items-center gap-1.5 ${metric.winner === "B" ? "text-emerald-500 font-bold" : darkMode ? "text-white/80" : "text-neutral-800"}`}>
                      {metric.valB}
                      {metric.winner === "B" && <Check size={11} className="text-emerald-500" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center flex flex-col justify-center items-center">
                  <Loader2 className="animate-spin text-neutral-400 mb-2" size={20} />
                  <span className="text-[11px] text-neutral-400">Loading specs matrix...</span>
                </div>
              )}
            </div>
          </div>

          {/* Gemini AI review synthesis comparison */}
          <div className={`rounded-3xl border p-6 relative overflow-hidden ${
            darkMode ? "bg-white/[0.02] border-white/5" : "bg-[#fcfcff] border-neutral-200 shadow-sm"
          }`}>
            <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full blur-3xl opacity-10 bg-[#FF0033]" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-10 bg-indigo-500" />
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-[#FF0033] animate-pulse" />
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold">
                Neural aggregate comparison review
              </h4>
            </div>

            {loadingSummary ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="animate-spin text-neutral-400 mx-auto" size={24} />
                <p className="text-xs text-neutral-400">Consulting review indices...</p>
              </div>
            ) : comparisonSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${darkMode ? "border-white/5 bg-white/[0.01]" : "border-neutral-200 bg-white"}`}>
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#FF0033] block mb-1">
                      {productA.title.substring(0, 20)}...
                    </span>
                    <p className={`text-xs leading-relaxed italic ${darkMode ? "text-white/60" : "text-neutral-600"}`}>
                      "{comparisonSummary.productAShort}"
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${darkMode ? "border-white/5 bg-white/[0.01]" : "border-neutral-200 bg-white"}`}>
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-400 dark:text-white/60 block mb-1">
                      {productB.title.substring(0, 20)}...
                    </span>
                    <p className={`text-xs leading-relaxed italic ${darkMode ? "text-white/60" : "text-neutral-600"}`}>
                      "{comparisonSummary.productBShort}"
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border border-dashed text-left ${
                  darkMode ? "bg-white/[0.01] border-white/5" : "bg-emerald-50/20 border-emerald-500/25 text-emerald-950 dark:text-emerald-300"
                }`}>
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-emerald-500 block mb-1">
                    System Value recommendation verdict
                  </span>
                  <p className={`text-xs leading-relaxed font-bold ${darkMode ? "text-white/90" : "text-neutral-800"}`}>
                    {comparisonSummary.verdict}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Comparison Status Pane */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className={`rounded-3xl border p-8 flex flex-col justify-center items-center text-center relative overflow-hidden h-96 ${
              darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
            }`}>
              <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full blur-3xl opacity-10 bg-indigo-500" />
              
              <Activity className={`${darkMode ? "text-white/10" : "text-neutral-300"} stroke-1 mb-4`} size={48} />
              
              <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>
                Comparison Queue Incomplete
              </h2>
              
              <p className={`text-xs max-w-sm mt-2 leading-relaxed ${darkMode ? "text-white/50" : "text-neutral-500"}`}>
                You have selected <span className="font-bold text-indigo-400 font-mono">{comparedProducts.length} / 2</span> products to compare. Navigate to the Search or Dashboard screens and click "Compare" on items to add them.
              </p>

              {comparedProducts.length === 1 && (
                <div className={`mt-6 p-4 rounded-2xl border flex items-center gap-3 max-w-md w-full text-left bg-white/[0.02] ${
                  darkMode ? "border-white/5" : "border-neutral-200 bg-neutral-50"
                }`}>
                  <img src={productA.imageUrl} alt={productA.title} className="h-10 w-10 shrink-0 object-contain bg-white rounded-lg p-1 border border-white/5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">{productA.platform}</span>
                    <h4 className="text-xs font-bold truncate text-white leading-tight">{productA.title}</h4>
                    <span className="text-xs font-bold font-mono text-white/50">₹{productA.price.toLocaleString("en-IN")}</span>
                  </div>
                  <button
                    onClick={() => handleToggleCompare(productA)}
                    className="p-1 text-white/30 hover:text-white/80 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <Link
                  to="/search"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Go to Search
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-5 py-2.5 border text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                    darkMode ? "border-white/10 hover:bg-white/5 text-white/80" : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  Access Watchlist
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Add Sidebar picker */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className={`rounded-3xl border p-5 flex-1 flex flex-col overflow-hidden max-h-[500px] ${
              darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
            }`}>
              <div className="border-b border-white/5 pb-4 mb-4 flex items-center gap-2">
                <Plus size={14} className="text-indigo-400" />
                <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${darkMode ? "text-white" : "text-neutral-900"}`}>
                  Quick Add Candidates
                </h3>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {candidatePool.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center">
                    <HelpCircle size={28} className="text-white/10 mb-2" />
                    <p className={`text-xs ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
                      No quick compare candidates found. Search for a product first.
                    </p>
                  </div>
                ) : (
                  candidatePool.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleToggleCompare(product)}
                      className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all hover:translate-x-1 ${
                        darkMode ? "bg-white/[0.02] border-white/5 hover:bg-white/5" : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 shadow-xs"
                      }`}
                    >
                      <img src={product.imageUrl} alt={product.title} className="h-10 w-10 shrink-0 object-contain bg-white rounded-lg p-1" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[8px] font-mono uppercase ${darkMode ? "text-white/40" : "text-neutral-500"}`}>{product.platform}</span>
                        <h4 className={`text-xs font-bold truncate leading-tight ${darkMode ? "text-white" : "text-neutral-800"}`}>{product.title}</h4>
                        <span className={`text-xs font-bold font-mono ${darkMode ? "text-white/70" : "text-neutral-600"}`}>₹{product.price.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Plus size={14} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
