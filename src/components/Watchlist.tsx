import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Trash2,
  TrendingDown,
  TrendingUp,
  Flame,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Loader2,
  Heart,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { TrackedProduct } from "../types";
import {
  subscribeToUserWatchlist,
  untrackProduct,
  updateTrackedPriceThreshold,
  toggleTrackedFavorite
} from "../firebase-service";

interface WatchlistProps {
  userId: string;
  onSelect: (p: any) => void;
  onClose?: () => void;
  onSimulatePriceDrop?: (p: TrackedProduct) => void; // allow simulating drop alerts
  darkMode?: boolean;
}

export default function Watchlist({
  userId,
  onSelect,
  onClose,
  onSimulatePriceDrop,
  darkMode = true
}: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<TrackedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"alerts" | "bucketlist">("alerts");
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Realtime Firestore Sync
    const unsubscribe = subscribeToUserWatchlist(
      userId,
      (tracks) => {
        setWatchlist(tracks);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore sync error: ", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleUntrack = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await untrackProduct(id);
    } catch (e) {
      console.error("Failed to delete alert: ", e);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent, track: TrackedProduct) => {
    e.stopPropagation();
    if (expandedTrackId === track.id) {
      setExpandedTrackId(null);
    } else {
      setExpandedTrackId(track.id);
      setEditPrice(track.targetPrice);
    }
  };

  const handleSaveThreshold = async (e: React.FormEvent, trackId: string) => {
    e.preventDefault();
    try {
      await updateTrackedPriceThreshold(trackId, editPrice);
      setExpandedTrackId(null);
    } catch (err) {
      console.error("Failed to update target price: ", err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, track: TrackedProduct) => {
    e.stopPropagation();
    setUpdatingId(track.id);
    try {
      await toggleTrackedFavorite(track.id, !!track.favorite);
    } catch (err) {
      console.error("Failed to toggle favorite: ", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter watchlist items into alerts vs favorites
  const alertsList = watchlist.filter((track) => !track.favorite);
  const bucketList = watchlist.filter((track) => !!track.favorite);
  const renderList = activeSubTab === "alerts" ? watchlist : bucketList; // Allow alerts/all in primary tab and favs in secondary

  // Adaptive Styles
  const borderCol = darkMode ? "border-white/5" : "border-neutral-200";
  const textTitle = darkMode ? "text-white" : "text-neutral-900";
  const textMuted = darkMode ? "text-white/40" : "text-neutral-500";
  const badgeColors = darkMode ? "bg-white/10 border-white/15 text-white" : "bg-neutral-100 border-neutral-300 text-neutral-850";

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* Header with Title and Global Count */}
      <div className={`flex items-center justify-between border-b px-6 py-5 ${borderCol}`}>
        <div className="flex items-center gap-2">
          <Bell className={`${darkMode ? "text-white/60" : "text-neutral-600"} animate-pulse`} size={18} />
          <h2 className={`font-semibold text-xs uppercase tracking-wider font-mono ${textTitle}`}>
            Intelligence Console
          </h2>
        </div>
        <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold font-mono ${badgeColors}`}>
          {watchlist.length} Total
        </span>
      </div>

      {/* Sub tabs matching premium glass style */}
      <div className={`flex border-b bg-white/[0.01] ${borderCol}`}>
        <button
          onClick={() => setActiveSubTab("alerts")}
          className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === "alerts"
              ? (darkMode ? "border-white text-white" : "border-neutral-900 text-neutral-900 font-extrabold")
              : (darkMode ? "border-transparent text-white/40 hover:text-white/70" : "border-transparent text-neutral-400 hover:text-neutral-650")
          }`}
        >
          All Monitors ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveSubTab("bucketlist")}
          className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === "bucketlist"
              ? (darkMode ? "border-indigo-400 text-indigo-300 bg-indigo-500/[0.02]" : "border-indigo-600 text-indigo-600 bg-indigo-50/50 font-extrabold")
              : (darkMode ? "border-transparent text-white/40 hover:text-white/70" : "border-transparent text-neutral-400 hover:text-neutral-650")
          }`}
        >
          Bucketlist ❤ ({bucketList.length})
        </button>
      </div>

      {/* List viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <Loader2 className={`animate-spin ${textMuted}`} size={24} />
            <p className={`mt-2 text-xs ${textMuted}`}>Synchronizing database...</p>
          </div>
        ) : renderList.length === 0 ? (
          <div className={`flex h-60 flex-col items-center justify-center text-center p-6 rounded-2xl border select-none ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-neutral-50/50 border-neutral-200"
          }`}>
            {activeSubTab === "bucketlist" ? (
              <>
                <Heart className={`${darkMode ? "text-white/10" : "text-neutral-300"} stroke-1`} size={36} />
                <span className={`mt-3 text-xs font-semibold ${darkMode ? "text-white/80" : "text-neutral-700"}`}>
                  Your Bucketlist is Empty
                </span>
                <p className={`mt-1 text-[11px] max-w-[180px] ${textMuted}`}>
                  Click the heart icon on any active monitor to favorite and add it here.
                </p>
              </>
            ) : (
              <>
                <Bell className={`${darkMode ? "text-white/10" : "text-neutral-300"} stroke-1`} size={36} />
                <span className={`mt-3 text-xs font-semibold ${darkMode ? "text-white/80" : "text-neutral-700"}`}>
                  No Trackers Configured Yet
                </span>
                <p className={`mt-1 text-[11px] max-w-[180px] ${textMuted}`}>
                  Search for any product and set a Price Drop trigger to begin alert tracking!
                </p>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {renderList.map((track) => {
              const priceDeltaPercent = Math.round(
                ((track.currentPrice - track.initialPrice) / track.initialPrice) * 100
              );
              const isAlertTriggered = track.currentPrice <= track.targetPrice;

              return (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() =>
                    onSelect({
                      id: track.id,
                      title: track.productName,
                      price: track.currentPrice,
                      url: track.url,
                      imageUrl: track.imageUrl,
                      platform: track.platform,
                      rating: 4.8,
                      reviewsCount: 384
                    })
                  }
                  className={`group relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all ${
                    darkMode
                      ? "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white"
                      : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-900 shadow-xs"
                  } ${
                    isAlertTriggered
                      ? "ring-1 ring-emerald-500/50 bg-emerald-500/[0.02] border-emerald-500/25"
                      : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className={`h-14 w-14 shrink-0 rounded-xl border p-1 flex items-center justify-center relative ${
                      darkMode ? "bg-white/5 border-white/5" : "bg-neutral-50 border-neutral-200"
                    }`}>
                      <img src={track.imageUrl} alt={track.productName} className="h-12 object-contain" />
                      
                      {/* Heart Indicator absolute overlay */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, track)}
                        disabled={updatingId === track.id}
                        className={`absolute -top-1.5 -right-1.5 p-1 rounded-full border transition-colors cursor-pointer ${
                          darkMode ? "bg-black/80 border-white/10 text-white/65 hover:text-red-400" : "bg-white border-neutral-300 text-neutral-600 hover:text-red-500 shadow-sm"
                        }`}
                      >
                        <Heart
                          size={10}
                          className={track.favorite ? "fill-red-500 text-red-500 animate-pulse" : ""}
                        />
                      </button>
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold truncate uppercase max-w-[80px] font-mono ${textMuted}`}>
                          {track.platform}
                        </span>
                        {isAlertTriggered ? (
                          <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/15 border border-emerald-500/20 tracking-wider">
                            <Flame size={10} className="animate-pulse text-emerald-400" />
                            DROP!
                          </span>
                        ) : (
                          <span className={`text-[9px] font-mono ${textMuted}`}>
                            Target: ₹{track.targetPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <h4 className={`mt-1 line-clamp-1 font-semibold ${darkMode ? "text-white/90" : "text-neutral-800"}`}>
                        {track.productName}
                      </h4>

                      {/* Prices comparison line */}
                      <div className="mt-2 flex items-baseline justify-between gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-sm font-bold font-mono ${darkMode ? "text-white" : "text-neutral-900"}`}>
                            ₹{track.currentPrice.toLocaleString("en-IN")}
                          </span>
                          <span className={`text-[10px] font-mono ${textMuted}`}>
                            Init: ₹{track.initialPrice.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Percent difference indicator */}
                        {priceDeltaPercent < 0 ? (
                          <span className="flex items-center gap-0.5 font-bold text-emerald-500 text-[10px] font-mono">
                            <TrendingDown size={11} />
                            {Math.abs(priceDeltaPercent)}%
                          </span>
                        ) : priceDeltaPercent > 0 ? (
                          <span className="flex items-center gap-0.5 font-bold text-red-500 text-[10px] font-mono">
                            <TrendingUp size={11} />
                            +{priceDeltaPercent}%
                          </span>
                        ) : (
                          <span className={`text-[10px] font-semibold font-mono ${textMuted}`}>Flat</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons shelf */}
                  <div className={`mt-3 flex items-center justify-between border-t pt-3 ${borderCol}`}>
                    <button
                      onClick={(e) => handleToggleExpand(e, track)}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                        darkMode ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                      }`}
                    >
                      <Settings size={12} />
                      Set Threshold
                      {expandedTrackId === track.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>

                    {/* Simulation trigger inside dashboard alerts */}
                    {onSimulatePriceDrop && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSimulatePriceDrop(track);
                        }}
                        title="Simulate Real-time Price Drop Alert"
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          darkMode ? "text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300" : "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        <RefreshCw size={11} />
                        Simulate Drop
                      </button>
                    )}

                    <button
                      onClick={(e) => handleUntrack(e, track.id)}
                      className={`rounded-lg p-1 transition-colors cursor-pointer ${
                        darkMode ? "text-white/30 hover:bg-[#FF0033]/15 hover:text-[#FF0033]" : "text-neutral-400 hover:bg-red-50 hover:text-red-500"
                      }`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Expanded Slider form overlay for adjusting target thresholds */}
                  <AnimatePresence>
                    {expandedTrackId === track.id && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={(e) => handleSaveThreshold(e, track.id)}
                        className={`mt-3 border-t pt-3 text-xs space-y-2 ${borderCol}`}
                      >
                        <div className="flex items-center justify-between">
                          <label className={`text-[10px] font-semibold uppercase ${textMuted}`}>
                            Target Threshold
                          </label>
                          <span className="font-bold text-indigo-500 font-mono text-xs">
                            ₹{editPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={Math.round(track.initialPrice * 0.4)}
                          max={track.initialPrice}
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className={`h-1 w-full cursor-pointer appearance-none rounded-lg ${
                            darkMode ? "bg-white/10 accent-white" : "bg-neutral-200 accent-neutral-900"
                          }`}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTrackId(null);
                            }}
                            className={`flex-1 rounded-lg border py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                              darkMode ? "border-white/10 bg-transparent text-white/65 hover:bg-white/5" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-all cursor-pointer ${
                              darkMode ? "bg-white text-black hover:bg-white/90" : "bg-neutral-900 text-white hover:bg-neutral-800"
                            }`}
                          >
                            Save Alert
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
