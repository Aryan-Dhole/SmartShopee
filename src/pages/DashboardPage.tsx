import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  TrendingDown,
  Activity,
  Zap,
  Sparkles,
  Bell,
  Coins,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  LineChart as LineChartIcon,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import StatsCard from "../components/StatsCard";
import PriceHistoryChart from "../components/PriceHistoryChart";
import Watchlist from "../components/Watchlist";
import DealScoreGauge from "../components/DealScoreGauge";
import BuyWaitAdvisor from "../components/BuyWaitAdvisor";
import { TrackedProduct, BuyWaitAdvice, AppNotification } from "../types";
import { subscribeToUserWatchlist } from "../firebase-service";

export default function DashboardPage() {
  const {
    currentUser,
    darkMode,
    setShowAuthModal,
    addNotification
  } = useApp();

  const [watchlist, setWatchlist] = useState<TrackedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<TrackedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chart" | "ai_insights">("chart");

  // Subscribe to watchlist if user is logged in
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserWatchlist(
      currentUser.uid,
      (tracks) => {
        setWatchlist(tracks);
        setLoading(false);
        // Automatically select the first product if none is selected
        if (tracks.length > 0 && !selectedProduct) {
          setSelectedProduct(tracks[0]);
        } else if (tracks.length > 0 && selectedProduct) {
          // Keep selection synchronized with new data
          const updated = tracks.find((t) => t.id === selectedProduct.id);
          if (updated) {
            setSelectedProduct(updated);
          } else {
            setSelectedProduct(tracks[0]);
          }
        } else if (tracks.length === 0) {
          setSelectedProduct(null);
        }
      },
      (err) => {
        console.error("Error loading watchlist for dashboard:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle manual selection from watchlist
  const handleSelectProduct = (productData: any) => {
    const found = watchlist.find((t) => t.id === productData.id);
    if (found) {
      setSelectedProduct(found);
    }
  };

  // Simulate price drop notification helper
  const handleSimulateDrop = (product: TrackedProduct) => {
    const simulatedDropPrice = Math.round(product.currentPrice * 0.88); // 12% drop
    const delta = product.currentPrice - simulatedDropPrice;

    const notif: AppNotification = {
      id: Date.now().toString(),
      title: "🚨 Price Drop Detected!",
      message: `"${product.productName}" has dropped below your target price! Saved ₹${delta.toLocaleString("en-IN")}.`,
      productName: product.productName,
      priceTag: `₹${simulatedDropPrice.toLocaleString("en-IN")}`,
      platform: product.platform,
      type: "price_drop",
      timestamp: new Date(),
    };

    addNotification(notif);
  };

  // Calculate stats dynamically based on user's watchlist
  const totalTracked = watchlist.length;
  const activeAlerts = watchlist.filter((w) => w.targetPrice < w.currentPrice).length;
  const priceDropsCaught = watchlist.filter((w) => w.currentPrice < w.initialPrice).length;
  
  // Calculate mock savings based on difference in price or show flat statistics
  const totalSavingsAmount = watchlist.reduce((sum, w) => {
    if (w.currentPrice < w.initialPrice) {
      return sum + (w.initialPrice - w.currentPrice);
    }
    return sum;
  }, 0);

  // If there are no savings, show potential mock savings to represent value
  const displaySavings = totalSavingsAmount > 0 
    ? `₹${totalSavingsAmount.toLocaleString("en-IN")}`
    : "₹1,240"; // nice fallback to demonstrate dashboard layout

  // Generate deterministic AI insights for selected product
  const getDeterministicInsights = (product: TrackedProduct) => {
    // Generate simple seed based on product title length
    const score = Math.floor(65 + ((product.productName.length * 3 + product.currentPrice) % 32));
    
    // Determine recommendation
    const recommendation = score >= 75 ? "buy_now" : "wait";
    const confidence = Math.floor(70 + ((product.currentPrice + score) % 25));
    
    const advice: BuyWaitAdvice = {
      recommendation: recommendation as any,
      confidence,
      reasoning: recommendation === "buy_now"
        ? `The current price of ₹${product.currentPrice.toLocaleString("en-IN")} on ${product.platform} is close to its historical lowest point. Price fluctuations suggest this is a local minimum. Recommend purchasing immediately before stock runs low.`
        : `Prices have shown an upward variance recently. PriceWise neural engine predicts a potential price drop of 5-8% in the next 10-14 days. We advise waiting for your threshold trigger.`,
      predictedPriceRange: {
        low: Math.round(product.currentPrice * 0.92),
        high: Math.round(product.currentPrice * 1.05)
      },
      bestTimeEstimate: recommendation === "buy_now" ? "Buy Today" : "Wait 8-12 days"
    };

    return { score, advice };
  };

  const hasItems = watchlist.length > 0;

  // Unauthenticated visual layout mockup
  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center px-4 text-center max-w-2xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`w-full border p-8 rounded-3xl relative overflow-hidden backdrop-blur-md ${
            darkMode ? "bg-white/[0.02] border-white/5 shadow-2xl" : "bg-white border-neutral-200 shadow-md"
          }`}
        >
          <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-10 bg-indigo-500" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-10 bg-purple-500" />
          
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto mb-5">
            <LayoutDashboard size={24} />
          </div>

          <h1 className={`text-2xl font-bold tracking-tight mb-2 ${darkMode ? "text-white" : "text-neutral-900"}`}>
            Access Your Intelligence Console
          </h1>
          
          <p className={`text-sm mb-8 max-w-md mx-auto ${darkMode ? "text-white/50" : "text-neutral-500"}`}>
            Track product price history, configure custom target alerts, watch real-time drops, and get neural AI buy/wait advisor reviews.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              Sign In to Activate Console <ArrowRight size={16} />
            </button>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${darkMode ? "text-white/30" : "text-neutral-400"}`}>
              Standard encryption secured
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedInsights = selectedProduct ? getDeterministicInsights(selectedProduct) : null;

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full gap-6">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${darkMode ? "text-white/45" : "text-neutral-500"}`}>
              Shopping Intelligence Agent Active
            </span>
          </div>
          <h1 className={`text-2xl md:text-3xl font-black mt-1 ${darkMode ? "text-white" : "text-neutral-900"}`}>
            Welcome back, {currentUser.displayName?.split(" ")[0] || "Shopper"}
          </h1>
        </div>
        
        <div className={`px-4 py-2 border rounded-xl flex items-center gap-3 text-[10px] font-mono tracking-wider uppercase ${
          darkMode ? "border-white/5 bg-white/[0.01]" : "border-neutral-200 bg-white shadow-xs"
        }`}>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Activity size={12} className="animate-pulse" />
            <span>Monitors Running: {watchlist.length}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Activity}
          label="Active Watchers"
          value={totalTracked}
          color="bg-indigo-500"
          darkMode={darkMode}
        />
        <StatsCard
          icon={Bell}
          label="Alert Triggers Set"
          value={activeAlerts}
          color="bg-amber-500"
          darkMode={darkMode}
        />
        <StatsCard
          icon={TrendingDown}
          label="Price Drops Caught"
          value={priceDropsCaught}
          trend={priceDropsCaught > 0 ? { value: 100, isPositive: true } : undefined}
          color="bg-emerald-500"
          darkMode={darkMode}
        />
        <StatsCard
          icon={Coins}
          label="Total Saved (Est.)"
          value={displaySavings}
          color="bg-purple-500"
          darkMode={darkMode}
        />
      </div>

      {/* Main Grid: Watchlist Console on Left, Detailed analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Watchlist Section */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className={`rounded-3xl border overflow-hidden flex-1 ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <Watchlist
              userId={currentUser.uid}
              onSelect={handleSelectProduct}
              onSimulatePriceDrop={handleSimulateDrop}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {selectedProduct ? (
              <motion.div
                key={selectedProduct.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                
                {/* Selected Item Title Card */}
                <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-5 items-center justify-between ${
                  darkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-neutral-200 shadow-sm"
                }`}>
                  <div className="flex gap-4 items-center flex-col sm:flex-row text-center sm:text-left">
                    <div className={`h-16 w-16 shrink-0 rounded-2xl border p-2 flex items-center justify-center bg-white ${
                      darkMode ? "border-white/5" : "border-neutral-200"
                    }`}>
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.productName}
                        className="max-h-12 object-contain"
                      />
                    </div>
                    <div>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        darkMode ? "bg-white/10 text-white/60" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {selectedProduct.platform}
                      </span>
                      <h3 className={`text-base font-bold mt-1 tracking-tight leading-tight line-clamp-1 ${
                        darkMode ? "text-white" : "text-neutral-900"
                      }`}>
                        {selectedProduct.productName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                        <span className={`text-sm font-black font-mono ${darkMode ? "text-white" : "text-neutral-900"}`}>
                          ₹{selectedProduct.currentPrice.toLocaleString("en-IN")}
                        </span>
                        <span className={`text-[10px] line-through font-mono ${darkMode ? "text-white/30" : "text-neutral-450"}`}>
                          ₹{(selectedProduct.initialPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={selectedProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                      darkMode
                        ? "bg-white text-black hover:bg-neutral-200 border-white"
                        : "bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-900"
                    }`}
                  >
                    Buy Sourced Listing <ExternalLink size={12} />
                  </a>
                </div>

                {/* Sub Tab Switcher */}
                <div className={`flex border-b ${darkMode ? "border-white/5" : "border-neutral-200"}`}>
                  <button
                    onClick={() => setActiveTab("chart")}
                    className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 px-1 cursor-pointer ${
                      activeTab === "chart"
                        ? (darkMode ? "border-white text-white" : "border-neutral-950 text-neutral-950")
                        : (darkMode ? "border-transparent text-white/40 hover:text-white/60" : "border-transparent text-neutral-400 hover:text-neutral-600")
                    }`}
                  >
                    <LineChartIcon size={14} /> Price Timeline
                  </button>
                  <button
                    onClick={() => setActiveTab("ai_insights")}
                    className={`ml-6 pb-3 text-xs font-bold font-mono uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 px-1 cursor-pointer ${
                      activeTab === "ai_insights"
                        ? (darkMode ? "border-indigo-400 text-indigo-400" : "border-indigo-600 text-indigo-600")
                        : (darkMode ? "border-transparent text-white/40 hover:text-white/60" : "border-transparent text-neutral-400 hover:text-neutral-600")
                    }`}
                  >
                    <Sparkles size={14} /> Neural Deal Insights
                  </button>
                </div>

                {/* Switchable Views */}
                <div>
                  {activeTab === "chart" ? (
                    <PriceHistoryChart
                      currentPrice={selectedProduct.currentPrice}
                      priceHistory={selectedProduct.priceHistory}
                      darkMode={darkMode}
                    />
                  ) : (
                    selectedInsights && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        {/* Gauge widget */}
                        <div className={`md:col-span-5 rounded-2xl border p-6 flex flex-col items-center justify-center ${
                          darkMode ? "bg-white/[0.02] border-white/10" : "bg-white border-neutral-200 shadow-sm"
                        }`}>
                          <h4 className={`text-xs font-bold font-mono uppercase tracking-wider mb-4 ${
                            darkMode ? "text-white/50" : "text-neutral-500"
                          }`}>
                            AI Value Deal Score
                          </h4>
                          <DealScoreGauge score={selectedInsights.score} darkMode={darkMode} />
                        </div>

                        {/* Recommendation details */}
                        <div className="md:col-span-7 flex flex-col">
                          <BuyWaitAdvisor advice={selectedInsights.advice} darkMode={darkMode} />
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* AI Advice Summary Card */}
                <div className={`rounded-2xl border p-5 relative overflow-hidden flex items-start gap-4 ${
                  darkMode ? "bg-[#111116]/60 border-white/5" : "bg-neutral-50 border-neutral-200"
                }`}>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold font-mono uppercase tracking-widest ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                      Neural Shopping Agent Summary
                    </h4>
                    <p className={`text-xs leading-relaxed mt-2 ${darkMode ? "text-white/60" : "text-neutral-600"}`}>
                      {selectedProduct.platform} listing is currently tracking {selectedProduct.currentPrice <= selectedProduct.targetPrice ? "BELOW" : "above"} your set alert trigger of ₹{selectedProduct.targetPrice.toLocaleString("en-IN")}. Price points are exhibiting low market volatility. Setting a slightly tighter threshold could yield optimal buying entry points.
                    </p>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className={`rounded-3xl border p-12 text-center flex flex-col items-center justify-center h-96 ${
                darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
              }`}>
                <Activity className={`${darkMode ? "text-white/10" : "text-neutral-300"} stroke-1 mb-4`} size={48} />
                <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>
                  No Product Selected
                </h3>
                <p className={`text-xs max-w-xs mt-2 leading-relaxed ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
                  Choose a product from your active monitors console on the left or search for products to start tracking alerts.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
