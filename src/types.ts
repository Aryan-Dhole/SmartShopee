export interface MerchantDeal {
  platform: string;
  price: number;
  originalPrice?: number;
  url: string;
  isLowest?: boolean;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  deliveryText?: string;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  platform: string;
  url: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  specs?: Record<string, string>;
  merchantDeals?: MerchantDeal[];
  dealScore?: number;
}

export interface PricePoint {
  price: number;
  timestamp: string;
}

export interface TrackedProduct {
  id: string;
  userId: string;
  productName: string;
  url: string;
  imageUrl: string;
  platform: string;
  currentPrice: number;
  targetPrice: number;
  initialPrice: number;
  priceHistory: PricePoint[];
  favorite?: boolean;
  createdAt: any; // Firebase Timestamp or ISO string
  updatedAt: any; // Firebase Timestamp or ISO string
}

export interface AIReviewSummary {
  summary: string;
  pros: string[];
  cons: string[];
  verdict: string;
}

export interface SmartAlternative {
  title: string;
  price: number;
  platform: string;
  reason: string;
  url: string;
  savings: number;
}

// ─── New Types for SaaS Features ───────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  productName: string;
  priceTag: string;
  platform: string;
  type?: 'price_drop' | 'system' | 'alert' | 'info';
  read?: boolean;
  timestamp?: Date;
}

export interface DealScore {
  score: number; // 0-100
  label: 'bad_deal' | 'fair_deal' | 'good_deal' | 'great_deal' | 'steal';
  reasoning: string;
  priceVsAverage: number; // percentage above/below avg
  priceVsLowest: number;  // percentage above/below lowest
}

export interface BuyWaitAdvice {
  recommendation: 'buy_now' | 'wait';
  confidence: number; // 0-100
  reasoning: string;
  predictedPriceRange: { low: number; high: number };
  bestTimeEstimate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface UserPreferences {
  userId: string;
  displayName?: string;
  email?: string;
  theme: 'dark' | 'light' | 'system';
  currency: 'INR' | 'USD';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  defaultPriceDropPercent: number;
  favoriteCategories: string[];
  createdAt: any;
  updatedAt: any;
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  resultsCount: number;
  timestamp: any;
}

export interface SavingsStats {
  totalSaved: number;
  totalTracked: number;
  activeAlerts: number;
  priceDropsCaught: number;
  avgSavingsPercent: number;
}

export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  period: string;
  features: string[];
  alertLimit: number;
  highlighted?: boolean;
}
