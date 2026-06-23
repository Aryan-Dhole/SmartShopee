import { PricePoint } from '../types';

/**
 * Simple deterministic hash for generating consistent IDs from strings
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Simulated chronological price history (used as fallback when no real history exists).
 */
export function generateFallbackPriceHistory(
  currentPrice: number,
  timeframe: '1M' | '3M' | '6M' | '1Y' = '1M'
): PricePoint[] {
  const history: PricePoint[] = [];
  const now = new Date();

  let daysLimit = 30;
  let pointsCount = 7;

  if (timeframe === '3M') { daysLimit = 90; pointsCount = 9; }
  else if (timeframe === '6M') { daysLimit = 180; pointsCount = 10; }
  else if (timeframe === '1Y') { daysLimit = 365; pointsCount = 12; }

  const step = Math.floor(daysLimit / (pointsCount - 1));

  for (let i = pointsCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i * step);

    let variance = 0;
    if (i !== 0) {
      const seed = Math.sin(i * 1.73 + step * 0.1);
      const direction = seed > 0 ? 1 : -1;
      const rawVariance = Math.abs(seed) * 0.125;
      variance = direction === -1 ? -rawVariance : rawVariance * 0.8;
    }

    const historicalPrice = Math.round(currentPrice * (1 + variance));

    const formatConfig: Intl.DateTimeFormatOptions =
      timeframe === '1Y' || timeframe === '6M'
        ? { month: 'short', year: '2-digit' }
        : { month: 'short', day: 'numeric' };

    history.push({
      price: historicalPrice,
      timestamp: d.toLocaleDateString('en-IN', formatConfig),
    });
  }

  return history;
}

/**
 * Estimate a base price category for a product name (used for mock fallbacks)
 */
export function getEstimatedBasePrice(query: string): number {
  const q = query.toLowerCase();
  if (q.includes('iphone') || q.includes('macbook') || q.includes('samsung s')) return 79999;
  if (q.includes('laptop') || q.includes('computer')) return 54999;
  if (q.includes('phone') || q.includes('pixel') || q.includes('oneplus')) return 32999;
  if (q.includes('watch') || q.includes('smartwatch') || q.includes('garmin')) return 14999;
  if (q.includes('headphone') || q.includes('sony') || q.includes('earbuds') || q.includes('bose')) return 11999;
  if (q.includes('shoe') || q.includes('nike') || q.includes('sneaker')) return 6999;
  return 4999;
}

/**
 * Get a placeholder image URL based on product category
 */
export function getPlaceholderImage(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('phone') || q.includes('iphone') || q.includes('pixel') || q.includes('samsung'))
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=60';
  if (q.includes('macbook') || q.includes('laptop') || q.includes('computer') || q.includes('asus') || q.includes('dell'))
    return 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=300&auto=format&fit=crop&q=60';
  if (q.includes('headphone') || q.includes('earbuds') || q.includes('sony') || q.includes('bose'))
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=60';
  if (q.includes('shoe') || q.includes('sneaker') || q.includes('running') || q.includes('nike') || q.includes('adidas'))
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=60';
  if (q.includes('watch') || q.includes('smartwatch') || q.includes('apple watch') || q.includes('garmin'))
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60';
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60';
}

/**
 * Format a price in INR with proper locale formatting
 */
export function formatINR(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Calculate percentage discount between original and current price
 */
export function calcDiscount(currentPrice: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Calculate a deal score (0-100) based on price vs original, rating, and review count
 */
export function calculateDealScore(
  price: number,
  originalPrice?: number,
  rating?: number,
  reviewsCount?: number
): { score: number; label: string } {
  let score = 50; // baseline

  // Price discount factor (max +30 points)
  if (originalPrice && originalPrice > price) {
    const discount = ((originalPrice - price) / originalPrice) * 100;
    score += Math.min(30, discount * 1.5);
  }

  // Rating factor (max +15 points)
  if (rating) {
    score += Math.max(0, (rating - 3.5) * 10);
  }

  // Review count factor (max +5 points — social proof)
  if (reviewsCount) {
    score += Math.min(5, Math.log10(reviewsCount + 1) * 2);
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  let label = 'Fair Deal';
  if (score >= 90) label = 'Steal';
  else if (score >= 75) label = 'Great Deal';
  else if (score >= 60) label = 'Good Deal';
  else if (score >= 40) label = 'Fair Deal';
  else label = 'Bad Deal';

  return { score, label };
}
