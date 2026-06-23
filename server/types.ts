/**
 * Server-side type definitions for PriceWise.
 * Re-exports shared types from the client `src/types.ts` that are used
 * across the server codebase (gemini-service, price-utils, url-parser).
 * 
 * This keeps server code self-contained while maintaining a single source
 * of truth for type shapes in `src/types.ts`.
 */
export type {
  ProductSearchResult,
  SmartAlternative,
  AIReviewSummary,
  MerchantDeal,
  PricePoint,
  TrackedProduct,
  AppNotification,
  DealScore,
  BuyWaitAdvice,
  ChatMessage,
  UserPreferences,
  SearchHistoryEntry,
  SavingsStats,
  SubscriptionTier,
  PricingTier,
} from '../src/types';
