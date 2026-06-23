import { ProductSearchResult, SmartAlternative, AIReviewSummary } from '../types';

// ─── Types ──────────────────────────────────────────────────────────

export interface APIError {
  error: string;
  status?: number;
}

export interface SearchResponse {
  results: ProductSearchResult[];
}

export interface AlternativesResponse {
  alternatives: SmartAlternative[];
}

export interface ReviewsResponse {
  summary: AIReviewSummary;
}

export interface CompareResponse {
  comparison: {
    verdict: string;
    winner: 'A' | 'B' | 'Tie';
    productASummary: string;
    productBSummary: string;
    metrics: { name: string; valA: string; valB: string; winner: 'A' | 'B' | 'Tie' }[];
    pros: { a: string[]; b: string[] };
    cons: { a: string[]; b: string[] };
  };
}

export interface ChatResponse {
  reply: string;
  products?: ProductSearchResult[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// ─── Core Fetch Wrapper ─────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const err = new Error(errorData.error || `HTTP ${response.status}`);
        (err as any).status = response.status;
        throw err;
      }

      return await response.json() as T;
    } catch (err: any) {
      lastError = err;

      // Don't retry on 4xx client errors
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// ─── Public API Methods ─────────────────────────────────────────────

/**
 * Search for products across platforms by name or URL
 */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const data = await apiRequest<SearchResponse>(
    `/api/search?q=${encodeURIComponent(query)}`
  );
  return data.results || [];
}

/**
 * Get AI-powered smarter alternatives for a product
 */
export async function getAlternatives(
  productName: string,
  price: number,
  platform: string
): Promise<SmartAlternative[]> {
  const data = await apiRequest<AlternativesResponse>('/api/alternatives', {
    method: 'POST',
    body: JSON.stringify({ productName, price, platform }),
  });
  return data.alternatives || [];
}

/**
 * Get real merchant deals for a product
 */
export async function getRealDeals(
  productName: string,
  currentPrice: number
): Promise<any[]> {
  const data = await apiRequest<{ deals: any[] }>('/api/deals', {
    method: 'POST',
    body: JSON.stringify({ productName, currentPrice }),
  });
  return data.deals || [];
}

/**
 * Get AI-synthesized review summary (pros, cons, verdict)
 */
export async function getReviewSummary(
  productName: string,
  platform: string
): Promise<AIReviewSummary> {
  const data = await apiRequest<ReviewsResponse>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({ productName, platform }),
  });
  return data.summary;
}

/**
 * Get AI-powered head-to-head product comparison
 */
export async function getComparison(
  productA: { title: string; price: number; platform: string; rating: number; reviewsCount: number; specs?: Record<string, string> },
  productB: { title: string; price: number; platform: string; rating: number; reviewsCount: number; specs?: Record<string, string> }
): Promise<CompareResponse['comparison']> {
  const data = await apiRequest<CompareResponse>('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ productA, productB }),
  });
  return data.comparison;
}

/**
 * Send a message to the AI shopping assistant
 */
export async function sendChatMessage(
  message: string,
  context?: { watchlist?: string[]; recentSearches?: string[] }
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
}

/**
 * Health check
 */
export async function checkHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/api/health');
}
