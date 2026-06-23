import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Settings,
  User,
  Bell,
  Sliders,
  ShieldAlert,
  Save,
  Trash2,
  RefreshCw,
  LogOut,
  Download,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { saveUserPreferences, getUserPreferences, exportWatchlistCSV, subscribeToUserWatchlist } from "../firebase-service";
import { TrackedProduct } from "../types";

export default function SettingsPage() {
  const {
    currentUser,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    handleSignOut,
    addNotification
  } = useApp();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(true);
  const [thresholdSlider, setThresholdSlider] = useState(10);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [watchlist, setWatchlist] = useState<TrackedProduct[]>([]);
  const [exporting, setExporting] = useState(false);

  // Load saved preferences from Firestore on mount
  useEffect(() => {
    if (!currentUser) {
      setLoadingPrefs(false);
      return;
    }

    setLoadingPrefs(true);
    getUserPreferences()
      .then((prefs) => {
        if (prefs) {
          if (prefs.theme === "light") setDarkMode(false);
          else if (prefs.theme === "dark") setDarkMode(true);
          setCurrency(prefs.currency || "INR");
          setEmailAlerts(prefs.emailNotifications ?? true);
          setBrowserAlerts(prefs.notificationsEnabled ?? true);
          setThresholdSlider(prefs.defaultPriceDropPercent ?? 10);
        }
      })
      .catch((err) => console.warn("Failed to load preferences:", err))
      .finally(() => setLoadingPrefs(false));

    // Subscribe to watchlist for export feature
    const unsubscribe = subscribeToUserWatchlist(
      currentUser.uid,
      (tracks) => setWatchlist(tracks),
      (err: any) => console.warn("Watchlist load failed:", err)
    );
    return () => unsubscribe();
  }, [currentUser]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await saveUserPreferences({
        theme: darkMode ? "dark" : "light",
        currency,
        notificationsEnabled: browserAlerts,
        emailNotifications: emailAlerts,
        defaultPriceDropPercent: thresholdSlider,
        favoriteCategories: [],
      });

      setSaveSuccess(true);
      addNotification({
        id: Date.now().toString(),
        title: "⚙️ Preferences Saved",
        message: "Your notification and display configurations were synchronized to Firestore.",
        productName: "Configuration console",
        priceTag: "Save Success",
        platform: "SYSTEM",
        type: "system"
      });

      // Reset success indicator after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      addNotification({
        id: Date.now().toString(),
        title: "❌ Save Failed",
        message: "Could not save preferences. Please try again.",
        productName: "Configuration console",
        priceTag: "Error",
        platform: "SYSTEM",
        type: "alert"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = () => {
    addNotification({
      id: Date.now().toString(),
      title: "🗑 Search History Cleared",
      message: "Your local e-commerce queries index has been wiped.",
      productName: "Index flush",
      priceTag: "Done",
      platform: "SYSTEM",
      type: "info"
    });
    // Clear localStorage search history
    localStorage.removeItem("pricewise_search_history");
  };

  const handleExportCSV = () => {
    if (watchlist.length === 0) {
      addNotification({
        id: Date.now().toString(),
        title: "📂 No Data",
        message: "Your watchlist is empty. Track some products first!",
        productName: "Export",
        priceTag: "Empty",
        platform: "SYSTEM",
        type: "info"
      });
      return;
    }

    setExporting(true);
    try {
      const csv = exportWatchlistCSV(watchlist);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `pricewise_watchlist_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        id: Date.now().toString(),
        title: "📁 Export Complete",
        message: `Downloaded ${watchlist.length} tracked products as CSV.`,
        productName: "Export",
        priceTag: "Done",
        platform: "SYSTEM",
        type: "system"
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center text-center max-w-md mx-auto px-4 py-12">
        <div className={`border p-8 rounded-3xl backdrop-blur-md ${
          darkMode ? "bg-white/[0.02] border-white/5 shadow-2xl text-white" : "bg-white border-neutral-200 shadow-md text-neutral-900"
        }`}>
          <Settings className="animate-spin text-indigo-400 mx-auto mb-4" size={32} />
          <h2 className="text-xl font-bold tracking-tight mb-2">Access Denied</h2>
          <p className={`text-xs mb-6 ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
            Please sign in to configure account profile credentials and customized price alert targets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-6 py-6 md:py-10 max-w-4xl mx-auto w-full gap-6">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4 mb-2 flex items-center gap-2">
        <Settings size={18} className="text-indigo-400" />
        <h1 className={`text-xl font-bold font-mono uppercase tracking-widest ${darkMode ? "text-white" : "text-neutral-900"}`}>
          Console Settings Panel
        </h1>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Side: Profile Summary & Account Actions */}
        <div className="md:col-span-4 space-y-6">
          
          {/* User profile card */}
          <div className={`rounded-3xl border p-5 text-center flex flex-col items-center justify-center ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <img
              src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"}
              alt={currentUser.displayName}
              className="h-16 w-16 rounded-full border border-white/10 object-cover mb-4"
            />
            <h3 className={`text-sm font-bold truncate leading-tight ${darkMode ? "text-white" : "text-neutral-900"}`}>
              {currentUser.displayName || "Smart Shopper"}
            </h3>
            <p className={`text-[10px] font-mono mt-1 ${darkMode ? "text-white/30" : "text-neutral-450"}`}>
              {currentUser.email}
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className={`w-full mt-6 py-2 border rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                darkMode ? "border-[#FF0033]/15 text-[#FF0033]/70 hover:bg-[#FF0033]/10" : "border-red-200 text-red-500 hover:bg-red-50"
              }`}
            >
              <LogOut size={13} /> Sign Out Session
            </button>
          </div>

          {/* Data Export Card */}
          <div className={`rounded-3xl border p-5 space-y-4 ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <h4 className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              darkMode ? "text-white/60" : "text-neutral-600"
            }`}>
              <Download size={14} className="text-indigo-400" /> Data Export
            </h4>
            
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting}
              className={`w-full py-2 border text-xs font-mono font-bold rounded-xl transition-all cursor-pointer text-left px-3.5 flex items-center justify-between ${
                darkMode ? "border-white/5 bg-transparent hover:bg-white/5 text-white/70" : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600"
              }`}
            >
              {exporting ? (
                <><Loader2 size={13} className="animate-spin" /> Exporting...</>
              ) : (
                <>Export Watchlist as CSV <Download size={13} /></>
              )}
            </button>
            <p className={`text-[9px] ${darkMode ? "text-white/25" : "text-neutral-400"}`}>
              {watchlist.length} product{watchlist.length !== 1 ? "s" : ""} currently tracked
            </p>
          </div>

          {/* Dangerous Zone */}
          <div className={`rounded-3xl border p-5 space-y-4 ${
            darkMode ? "bg-[#180a0d]/30 border-[#FF0033]/15" : "bg-red-50/20 border-red-200"
          }`}>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF0033] flex items-center gap-1.5">
              <ShieldAlert size={14} /> Hazard Zone Actions
            </h4>
            
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleClearHistory}
                className={`w-full py-2 border text-xs font-mono font-bold rounded-xl transition-all cursor-pointer text-left px-3.5 flex items-center justify-between ${
                  darkMode ? "border-white/5 bg-transparent hover:bg-white/5 text-white/70" : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600"
                }`}
              >
                Clear Search History <Trash2 size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Detailed Configurations */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Loading indicator */}
          {loadingPrefs && (
            <div className={`rounded-3xl border p-6 text-center ${
              darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200"
            }`}>
              <Loader2 className="animate-spin mx-auto mb-2 text-indigo-400" size={24} />
              <p className={`text-xs ${darkMode ? "text-white/40" : "text-neutral-500"}`}>Loading saved preferences...</p>
            </div>
          )}

          {/* Notifications config */}
          <div className={`rounded-3xl border p-6 space-y-5 ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <div className="border-b border-white/5 pb-3 mb-1 flex items-center gap-2">
              <Bell size={14} className="text-indigo-400" />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${darkMode ? "text-white" : "text-neutral-900"}`}>
                Alert & Notification Channels
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold ${darkMode ? "text-white" : "text-neutral-800"}`}>Email Notifications</h4>
                  <p className={`text-[10px] mt-0.5 ${darkMode ? "text-white/40" : "text-neutral-500"}`}>Receive target threshold matches inside your inbox</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className={`w-4 h-4 cursor-pointer accent-indigo-500`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold ${darkMode ? "text-white" : "text-neutral-800"}`}>Browser Notifications</h4>
                  <p className={`text-[10px] mt-0.5 ${darkMode ? "text-white/40" : "text-neutral-500"}`}>Get real-time browser alerts and sound prompts on deal drops</p>
                </div>
                <input
                  type="checkbox"
                  checked={browserAlerts}
                  onChange={(e) => setBrowserAlerts(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Preferences and Threshold Defaults */}
          <div className={`rounded-3xl border p-6 space-y-5 ${
            darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <div className="border-b border-white/5 pb-3 mb-1 flex items-center gap-2">
              <Sliders size={14} className="text-indigo-400" />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${darkMode ? "text-white" : "text-neutral-900"}`}>
                Default Tracking Thresholds
              </h3>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className={`font-semibold ${darkMode ? "text-white" : "text-neutral-850"}`}>Default Alert Threshold</h4>
                  <span className="font-mono font-bold text-indigo-400 text-xs">-{thresholdSlider}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={thresholdSlider}
                  onChange={(e) => setThresholdSlider(Number(e.target.value))}
                  className="w-full h-1 cursor-pointer accent-indigo-500 rounded-lg bg-neutral-200 dark:bg-white/10 appearance-none"
                />
                <p className={`text-[10px] leading-relaxed ${darkMode ? "text-white/35" : "text-neutral-450"}`}>
                  PriceWise will configure this default percentage drop target automatically when you quick-track items.
                </p>
              </div>

              {/* Display settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase font-semibold ${darkMode ? "text-white/40" : "text-neutral-500"}`}>Currency Mode</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono focus:outline-none ${
                      darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-white border-neutral-200 text-neutral-800"
                    }`}
                  >
                    <option value="INR">₹ INR (Rupees)</option>
                    <option value="USD">$ USD (Dollars)</option>
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-between">
                  <label className={`text-[10px] font-mono uppercase font-semibold ${darkMode ? "text-white/40" : "text-neutral-500"}`}>Visual Theme Mode</label>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className={`w-full py-2.5 border rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      darkMode ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit card */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 text-white text-xs font-bold font-mono uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer flex items-center gap-2 ${
                saveSuccess
                  ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/10"
                  : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/10"
              }`}
            >
              {saving ? (
                <><RefreshCw className="animate-spin" size={14} /> Saving...</>
              ) : saveSuccess ? (
                <><CheckCircle size={14} /> Saved Successfully!</>
              ) : (
                <><Save size={14} /> Save All Preferences</>
              )}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
