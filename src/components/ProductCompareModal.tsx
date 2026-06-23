import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Star,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Check,
  Zap,
  Sparkles,
  Loader2,
  Minimize2,
  Coins,
  ShieldCheck,
  Grid
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { ProductSearchResult } from "../types";
import { generateFallbackPriceHistory } from "../utils/price-utils";

interface ProductCompareModalProps {
  productA: ProductSearchResult;
  productB: ProductSearchResult;
  onClose: () => void;
  darkMode: boolean;
}

export default function ProductCompareModal({
  productA,
  productB,
  onClose,
  darkMode
}: ProductCompareModalProps) {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState<{
    verdict: string;
    productAShort: string;
    productBShort: string;
    metrics: { name: string; valA: string; valB: string; winner: "A" | "B" | "Tie" }[];
  } | null>(null);

  // Generate and combine price history data for side-by-side visualization
  const historyA = generateFallbackPriceHistory(productA.price);
  const historyB = generateFallbackPriceHistory(productB.price);

  const combinedHistory = historyA.map((pt, idx) => {
    const labelA = productA.title.substring(0, 12) + "...";
    const labelB = productB.title.substring(0, 12) + "...";
    return {
      timestamp: pt.timestamp,
      [labelA]: pt.price,
      [labelB]: historyB[idx]?.price || productB.price
    };
  });

  const titleA = productA.title.substring(0, 12) + "...";
  const titleB = productB.title.substring(0, 12) + "...";

  useEffect(() => {
    // Generate side-by-side dynamic comparison metrics or call API
    setLoadingSummary(true);
    
    // Call API for dynamic comparison (using Gemini reviews endpoint or fallback)
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: `${productA.title} vs ${productB.title}`, platform: `${productA.platform} & ${productB.platform}` })
    })
      .then((res) => res.json())
      .then((data) => {
        // Build rich side-by-side comparison verdict
        const summaryText = data.summary?.summary || `Comparing ${productA.title} and ${productB.title}. Both offer high-grade specs.`;
        setComparisonSummary({
          verdict: data.summary?.verdict || `The ${productA.price < productB.price ? productA.title : productB.title} offers superior value at a lower price point. However, both devices rank excellent.`,
          productAShort: data.summary?.pros?.[0] || "Offers durable chassis and direct merchant access.",
          productBShort: data.summary?.pros?.[1] || "Features compact form factor and immediate shipping.",
          metrics: [
            {
              name: "Value Metric",
              valA: `₹${productA.price.toLocaleString("en-IN")}`,
              valB: `₹${productB.price.toLocaleString("en-IN")}`,
              winner: productA.price < productB.price ? "A" : "B"
            },
            {
              name: "User Sentiment Rating",
              valA: `${productA.rating} / 5.0`,
              valB: `${productB.rating} / 5.0`,
              winner: productA.rating > productB.rating ? "A" : "B"
            },
            {
              name: "Reliability Baseline",
              valA: `${productA.reviewsCount.toLocaleString()} Reviews`,
              valB: `${productB.reviewsCount.toLocaleString()} Reviews`,
              winner: productA.reviewsCount > productB.reviewsCount ? "A" : "B"
            },
            {
              name: "Primary Sourced Platform",
              valA: productA.platform,
              valB: productB.platform,
              winner: "Tie"
            },
            {
              name: "Colorway Spec",
              valA: productA.specs?.color || "Default",
              valB: productB.specs?.color || "Default",
              winner: "Tie"
            }
          ]
        });
      })
      .catch((err) => {
        console.error("Comparison load error: ", err);
      })
      .finally(() => setLoadingSummary(false));
  }, [productA, productB]);

  // Nothing accent dot class
  const nothingDot = <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF0033] mx-1" />;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Backdrop glass transition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 ${
            darkMode ? "bg-neutral-950/80 backdrop-blur-md" : "bg-neutral-500/30 backdrop-blur-md"
          }`}
          onClick={onClose}
        />

        {/* Modal Outer Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className={`relative z-10 flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border ${
            darkMode
              ? "border-neutral-800 bg-[#07070a]/98 text-neutral-100 shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
              : "border-neutral-300 bg-white text-neutral-900 shadow-[0_25px_60px_rgba(0,0,0,0.15)]"
          }`}
        >
          {/* Header Bar */}
          <div className={`flex items-center justify-between border-b px-6 py-4.5 ${
            darkMode ? "border-neutral-800 bg-neutral-900/10" : "border-neutral-200 bg-neutral-50"
          }`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] uppercase font-bold tracking-widest ${
                darkMode ? "bg-[#FF0033]/10 text-[#FF0033] border border-[#FF0033]/20" : "bg-neutral-900 text-white"
              }`}>
                VS
              </span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold uppercase tracking-widest font-mono">
                  Nothing Analytics Module
                </span>
                <span className={`text-[10px] ${darkMode ? "text-neutral-500" : "text-neutral-400"} font-mono`}>
                  Precision side-by-side hardware evaluation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${
                darkMode ? "border-neutral-800 text-neutral-400 bg-neutral-905" : "border-neutral-200 text-neutral-500 bg-white"
              }`}>
                {nothingDot} Live Grid Linked
              </span>
              <button
                onClick={onClose}
                className={`rounded-full p-2 transition-all border cursor-pointer ${
                  darkMode
                    ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-black"
                }`}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Modal content viewport */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            
            {/* Grid 1: Side by Side Core Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Product A */}
              <div className={`relative rounded-2xl border p-5 flex flex-col justify-between ${
                darkMode ? "border-neutral-800/80 bg-neutral-900/20" : "border-neutral-200 bg-neutral-50/50"
              }`}>
                {/* Red Target Accent Dot */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF0033]" />
                  <span className={`text-[9px] uppercase tracking-wider font-mono font-bold ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                    Item A • {productA.platform}
                  </span>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                  <div className={`h-28 w-28 shrink-0 rounded-xl border p-3 flex items-center justify-center bg-white ${
                    darkMode ? "border-neutral-800" : "border-neutral-200"
                  }`}>
                    <img
                      src={productA.imageUrl}
                      alt={productA.title}
                      referrerPolicy="no-referrer"
                      className="max-h-24 object-contain"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-sm font-semibold tracking-tight leading-tight line-clamp-2">
                      {productA.title}
                    </h3>
                    
                    {/* Rating row */}
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-mono">
                      <Star size={11} className="fill-yellow-400 stroke-yellow-400" />
                      <span className="font-bold">{productA.rating}</span>
                      <span className={`${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                        ({productA.reviewsCount.toLocaleString()} reviews)
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono">₹{productA.price.toLocaleString("en-IN")}</span>
                      {productA.originalPrice && (
                        <span className={`text-xs line-through font-mono ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                          ₹{productA.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-dashed border-neutral-300 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400">Spec Sourced:</span>
                  <a
                    href={productA.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border font-bold transition-all ${
                      darkMode
                        ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    View Listing <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Product B */}
              <div className={`relative rounded-2xl border p-5 flex flex-col justify-between ${
                darkMode ? "border-neutral-800/80 bg-neutral-900/20" : "border-neutral-200 bg-neutral-50/50"
              }`}>
                {/* Red Target Accent Dot */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-400" />
                  <span className={`text-[9px] uppercase tracking-wider font-mono font-bold ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                    Item B • {productB.platform}
                  </span>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                  <div className={`h-28 w-28 shrink-0 rounded-xl border p-3 flex items-center justify-center bg-white ${
                    darkMode ? "border-neutral-800" : "border-neutral-200"
                  }`}>
                    <img
                      src={productB.imageUrl}
                      alt={productB.title}
                      referrerPolicy="no-referrer"
                      className="max-h-24 object-contain"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-sm font-semibold tracking-tight leading-tight line-clamp-2">
                      {productB.title}
                    </h3>
                    
                    {/* Rating row */}
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-mono">
                      <Star size={11} className="fill-yellow-400 stroke-yellow-400" />
                      <span className="font-bold">{productB.rating}</span>
                      <span className={`${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                        ({productB.reviewsCount.toLocaleString()} reviews)
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono">₹{productB.price.toLocaleString("en-IN")}</span>
                      {productB.originalPrice && (
                        <span className={`text-xs line-through font-mono ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                          ₹{productB.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-dashed border-neutral-300 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400">Spec Sourced:</span>
                  <a
                    href={productB.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider border font-bold transition-all ${
                      darkMode
                        ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    View Listing <ExternalLink size={10} />
                  </a>
                </div>
              </div>

            </div>

            {/* Grid 2: Combined Side-by-Side 30-Day price trends */}
            <div className={`rounded-2xl border p-5 ${
              darkMode ? "border-neutral-800 bg-neutral-900/10" : "border-neutral-200 bg-neutral-50/20"
            }`}>
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-mono font-bold">
                    Price fluctuation matrix (30d Trend)
                  </h4>
                  <span className={`text-[10px] ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                    Comparison overlays of simulated re-scraped metrics
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF0033]" />
                    {productA.title.substring(0, 10)}...
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                    {productB.title.substring(0, 10)}...
                  </span>
                </div>
              </div>

              <div className="h-52 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke={darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: darkMode ? "rgba(7, 7, 10, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        borderRadius: "16px",
                        border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        color: darkMode ? "#fff" : "#000"
                      }}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey={titleA}
                      stroke="#FF0033"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 0, fill: "#FF0033" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={titleB}
                      stroke="#a3a3a3"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 0, fill: "#a3a3a3" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grid 3: Side-by-Side Detailed Specifications Comparison Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              darkMode ? "border-neutral-800" : "border-neutral-200"
            }`}>
              <div className={`px-4 py-3 border-b font-mono text-[10px] uppercase font-bold ${
                darkMode ? "bg-neutral-900/30 border-neutral-800 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}>
                Side-by-side spec comparison
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-mono text-xs">
                {comparisonSummary ? (
                  <>
                    {comparisonSummary.metrics.map((metric, idx) => (
                      <div key={idx} className="grid grid-cols-3 p-3.5 items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold text-left ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                          {metric.name}
                        </span>

                        <div className={`flex items-center gap-1.5 text-center justify-start ${
                          metric.winner === "A" ? "text-[#FF0033] font-bold" : ""
                        }`}>
                          {metric.valA}
                          {metric.winner === "A" && <Check size={11} className="stroke-2 text-[#FF0033]" />}
                        </div>

                        <div className={`flex items-center gap-1.5 text-center justify-start ${
                          metric.winner === "B" ? "text-emerald-500 font-bold" : ""
                        }`}>
                          {metric.valB}
                          {metric.winner === "B" && <Check size={11} className="stroke-2 text-emerald-500" />}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-8 text-center flex flex-col justify-center items-center">
                    <Loader2 className="animate-spin text-neutral-400 mb-2" size={20} />
                    <span className="text-[11px] text-neutral-400">Loading live data specifications...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side Gemini Consensus or Pros & Cons */}
            <div className={`rounded-2xl border p-5 ${
              darkMode ? "border-neutral-800/80 bg-[#121217]/50" : "border-neutral-200 bg-neutral-50/10"
            }`}>
              <div className="mb-4 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#FF0033] animate-pulse" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold">
                  Gemini comparison review synthesis
                </h4>
              </div>

              {loadingSummary ? (
                <div className="py-6 text-center space-y-2">
                  <Loader2 className="animate-spin text-neutral-400 mx-auto" size={20} />
                  <p className="text-[11px] text-neutral-400">Consulting review databases side-by-side...</p>
                </div>
              ) : comparisonSummary ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Item A smart review snippet */}
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? "border-neutral-850 bg-neutral-900/30" : "border-neutral-200/80 bg-white"
                    }`}>
                      <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#FF0033] block mb-1">
                        Consensus: {productA.title.substring(0, 15)}...
                      </span>
                      <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed italic">
                        "{comparisonSummary.productAShort}"
                      </p>
                    </div>

                    {/* Item B smart review snippet */}
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? "border-neutral-850 bg-neutral-900/30" : "border-neutral-200/80 bg-white"
                    }`}>
                      <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500 dark:text-neutral-300 block mb-1">
                        Consensus: {productB.title.substring(0, 15)}...
                      </span>
                      <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed italic">
                        "{comparisonSummary.productBShort}"
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border border-dashed text-left ${
                    darkMode ? "bg-neutral-900/40 border-neutral-800" : "bg-[#FF0033]/5 border-[#FF0033]/20"
                  }`}>
                    <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-[#FF0033] block mb-1.5">
                      Unified Recommendation Verdict
                    </span>
                    <p className="leading-relaxed font-semibold">
                      {comparisonSummary.verdict}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500 font-mono">Feedback aggregates empty.</p>
              )}
            </div>

          </div>

          {/* Footer lock state */}
          <div className={`border-t px-6 py-4 flex justify-between items-center bg-transparent ${
            darkMode ? "border-neutral-850" : "border-neutral-250"
          }`}>
            <span className={`text-[9px] font-mono uppercase tracking-wider ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
              Device comparisons compiled at runtime
            </span>
            <button
              onClick={onClose}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer ${
                darkMode
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >
              Close comparisons
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
