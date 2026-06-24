import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth, googleAuthProvider } from '../firebase';
import { signInWithPopup, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { ProductSearchResult, AppNotification } from '../types';

// ─── Context Shape ──────────────────────────────────────────────────

interface AppContextType {
  // Auth
  currentUser: User | any | null;
  loadingAuth: boolean;
  handleGoogleSignIn: () => Promise<void>;
  handleEmailSignIn: (email: string) => void;
  handleSignOut: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;

  // Theme
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: ProductSearchResult[];
  setSearchResults: (r: ProductSearchResult[]) => void;
  searching: boolean;
  hasSearched: boolean;
  handleSearch: (e?: React.FormEvent, customQuery?: string) => Promise<void>;
  searchHistory: string[];
  clearSearchHistory: () => void;

  // Compare
  comparedProducts: ProductSearchResult[];
  handleToggleCompare: (product: ProductSearchResult) => void;
  clearCompare: () => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (n: AppNotification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Watchlist
  watchlistOpen: boolean;
  setWatchlistOpen: (v: boolean) => void;

  // Selected Product
  selectedProduct: ProductSearchResult | null;
  setSelectedProduct: (p: ProductSearchResult | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Theme
  const [darkMode, setDarkMode] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pricewise_search_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Compare
  const [comparedProducts, setComparedProducts] = useState<ProductSearchResult[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Watchlist
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  // Selected product
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);

  // ── Auth Listener ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setWatchlistOpen(true);
      } else {
        const storedClerk = localStorage.getItem('clerk_demo_session');
        if (storedClerk) {
          setCurrentUser(JSON.parse(storedClerk));
          setWatchlistOpen(true);
        } else {
          setCurrentUser(null);
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Auth Handlers ──
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoadingAuth(true);
      const res = await signInWithPopup(auth, googleAuthProvider);
      setCurrentUser(res.user);
      setWatchlistOpen(true);
      setShowAuthModal(false);
    } catch (e) {
      console.error('Google Auth failed:', e);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const handleEmailSignIn = useCallback((emailOrDemo: string) => {
    setLoadingAuth(true);

    // Derive a display name from the email
    const email = emailOrDemo || 'user@pricewise.app';
    let displayName = 'User';
    if (email.includes('@')) {
      // Extract part before @ and capitalize first letter
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ').trim();
      displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    if (email === 'demo@pricewise.app') {
      displayName = 'Demo User';
    }

    const simulatedUser = {
      uid: 'email_authorized_user_' + Date.now(),
      email,
      displayName,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    };
    localStorage.setItem('clerk_demo_session', JSON.stringify(simulatedUser));
    setCurrentUser(simulatedUser);
    setWatchlistOpen(true);
    setShowAuthModal(false);
    setLoadingAuth(false);

    const welcomeNotification: AppNotification = {
      id: Date.now().toString(),
      title: 'Session Activated',
      message: 'You have authenticated successfully. All tracking monitors are now active.',
      productName: 'Auth Guard',
      priceTag: 'Live connection',
      platform: 'SYSTEM',
      type: 'system',
      timestamp: new Date(),
    };
    addNotification(welcomeNotification);
  }, []);

  const handleSignOut = useCallback(() => {
    signOut(auth);
    localStorage.removeItem('clerk_demo_session');
    setCurrentUser(null);
    setWatchlistOpen(false);
  }, []);

  // ── Theme ──
  const toggleDarkMode = useCallback(() => setDarkMode((prev) => !prev), []);

  // ── Search ──
  const handleSearch = useCallback(
    async (e?: React.FormEvent, customQuery?: string) => {
      if (e) e.preventDefault();
      const queryToRun = customQuery || searchQuery;
      if (!queryToRun.trim()) return;

      setSearching(true);
      setHasSearched(true);
      setSearchQuery(queryToRun);

      // Persist to search history
      setSearchHistory(prev => {
        const filtered = prev.filter(q => q.toLowerCase() !== queryToRun.toLowerCase());
        const updated = [queryToRun, ...filtered].slice(0, 10);
        try { localStorage.setItem('pricewise_search_history', JSON.stringify(updated)); } catch {}
        return updated;
      });

      try {
        // Use server API exclusively — it runs all 5 scrapers + Gemini in parallel
        // and returns properly deduplicated, validated results across all platforms.
        // Client-side Gemini is NOT used here to prevent Myntra-only race condition.
        const response = await fetch(`/api/search?q=${encodeURIComponent(queryToRun)}`);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const results = data.results || [];
        setSearchResults(results);
      } catch (err) {
        console.error('Search query failed:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [searchQuery]
  );


  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try { localStorage.removeItem('pricewise_search_history'); } catch {}
  }, []);

  // ── Compare ──
  const handleToggleCompare = useCallback(
    (product: ProductSearchResult) => {
      setComparedProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) return prev.filter((p) => p.id !== product.id);
        if (prev.length >= 2) {
          addNotification({
            id: Date.now().toString(),
            title: '⚠️ Compare Limit',
            message: 'You can compare up to 2 items side-by-side. Deselect one first.',
            productName: 'Compare Queue',
            priceTag: 'Max 2',
            platform: 'SYSTEM',
            type: 'info',
          });
          return prev;
        }
        return [...prev, product];
      });
    },
    []
  );

  const clearCompare = useCallback(() => setComparedProducts([]), []);

  // ── Notifications ──
  const addNotification = useCallback((n: AppNotification) => {
    const notif = { ...n, timestamp: n.timestamp || new Date(), read: false };
    setNotifications((prev) => [notif, ...prev]);
    // Auto-remove after 8s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((existing) => existing.id !== notif.id));
    }, 8500);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const value: AppContextType = {
    currentUser,
    loadingAuth,
    handleGoogleSignIn,
    handleEmailSignIn,
    handleSignOut,
    showAuthModal,
    setShowAuthModal,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searching,
    hasSearched,
    handleSearch,
    searchHistory,
    clearSearchHistory,
    comparedProducts,
    handleToggleCompare,
    clearCompare,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    watchlistOpen,
    setWatchlistOpen,
    selectedProduct,
    setSelectedProduct,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
