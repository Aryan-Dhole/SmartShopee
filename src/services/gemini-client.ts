/**
 * Browser-side Gemini service using Google Search Grounding.
 * The AI Studio API key (AQ. prefix) works from browsers but not from Node.js servers.
 * This is why we perform Gemini calls client-side for the search feature.
 */
import { GoogleGenAI } from "@google/genai";
import { ProductSearchResult } from "../types";
import { getPlaceholderImage } from "../utils/price-utils";

// ─── Utilities ──────────────────────────────────────────────────────

function extractJson(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const arrayMatch = trimmed.match(/(\[[\s\S]*\])/);
  if (arrayMatch) return arrayMatch[1].trim();
  const objectMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (objectMatch) return objectMatch[1].trim();
  return trimmed;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function normalizePlatformName(name: string): string {
  const lower = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const map: Record<string, string> = {
    "amazon": "Amazon India",
    "amazon india": "Amazon India",
    "amazon in": "Amazon India",
    "flipkart": "Flipkart",
    "myntra": "Myntra",
    "snapdeal": "Snapdeal",
    "croma": "Croma Store",
    "croma store": "Croma Store",
    "vijay sales": "Vijay Sales",
    "vijaysales": "Vijay Sales",
    "reliance digital": "Reliance Digital",
    "reliance": "Reliance Digital",
    "meesho": "Meesho",
    "blinkit": "Blinkit",
    "jiomart": "JioMart",
    "tata cliq": "Tata CLiQ",
    "tatacliq": "Tata CLiQ",
  };
  return map[lower] || name;
}

function validateResults(results: any[], query: string): ProductSearchResult[] {
  return results
    .filter((item) => {
      const price = Number(item.price);
      if (!price || price <= 0 || price > 50_000_000) return false;
      if (!item.title || typeof item.title !== "string" || item.title.trim().length < 2) return false;
      return true;
    })
    .map((item, index) => {
      const itemPrice = Number(item.price);
      const originalPrice = item.originalPrice ? Number(item.originalPrice) : undefined;
      let platform = normalizePlatformName(String(item.platform || "Unknown").trim());
      let url = item.url || "#";
      if (!url.startsWith("http")) url = "#";
      let imageUrl = item.imageUrl || "";
      if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

      return {
        id: simpleHash(platform + item.title + index),
        title: item.title.trim(),
        price: itemPrice,
        originalPrice: originalPrice && originalPrice > itemPrice ? originalPrice : undefined,
        platform,
        url,
        imageUrl,
        rating: Math.min(5, Math.max(0, Number(item.rating) || 4.0)),
        reviewsCount: Math.max(0, Number(item.reviewsCount) || 0),
        specs: item.specs || {},
      };
    });
}

// ─── Client-side Gemini Search ──────────────────────────────────────

let geminiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  try {
    // Try to get the API key from environment (Vite exposes VITE_ prefixed vars)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({ apiKey });
    }
    return geminiClient;
  } catch {
    return null;
  }
}

// Simple in-memory cache
const cache = new Map<string, { data: ProductSearchResult[]; expiry: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export async function searchProductsWithGemini(query: string): Promise<ProductSearchResult[] | null> {
  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) return cached.data;

  const ai = getClient();
  if (!ai) return null;

  const prompt = `Search for "${query}" on major Indian e-commerce platforms.

Instructions:
1. Search across: Amazon India, Flipkart, Croma, Vijay Sales, Reliance Digital, Snapdeal, Meesho, JioMart, Tata CLiQ
2. Return 4-6 real, currently available product listings with CURRENT prices in INR
3. Include the exact product title as shown on each platform
4. Include real star ratings (out of 5) and review counts
5. Include actual product listing URLs (e.g. https://www.amazon.in/dp/XXXXX)
6. Include product image URLs

Return the result as a JSON array wrapped in \`\`\`json block. Each object must have: title (string), price (number), originalPrice (number), platform (string), url (string), imageUrl (string), rating (number), reviewsCount (number).
IMPORTANT: Only include listings you can verify. Do NOT fabricate data.`;

  const TIMEOUT_MS = 25_000;

  const geminiPromise = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini search timed out")), TIMEOUT_MS)
  );

  try {
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const jsonText = extractJson(response.text || "");
    if (jsonText) {
      const rawResults = JSON.parse(jsonText);
      if (Array.isArray(rawResults) && rawResults.length > 0) {
        const validated = validateResults(rawResults, query);
        if (validated.length > 0) {
          cache.set(cacheKey, { data: validated, expiry: Date.now() + CACHE_TTL });
          return validated;
        }
      }
    }
    return null;
  } catch (err) {
    console.warn("[ClientGemini] Search failed:", err);
    return null;
  }
}

export async function fetchDealsWithGemini(productName: string, currentPrice: number): Promise<any[] | null> {
  const ai = getClient();
  if (!ai) return null;

  const prompt = `Find real, current prices for "${productName}" (reference price ~₹${currentPrice}) across Amazon India, Flipkart, Croma, Reliance Digital.

Return as a JSON array in \`\`\`json block. Each object: platform (string), price (number), originalPrice (number), url (string), deliveryText (string), stockStatus ("in_stock" or "out_of_stock").`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const jsonText = extractJson(response.text || "");
    if (jsonText) {
      const deals = JSON.parse(jsonText);
      if (Array.isArray(deals)) {
        const sorted = deals.sort((a, b) => a.price - b.price);
        if (sorted.length > 0) sorted[0].isLowest = true;
        return sorted;
      }
    }
    return null;
  } catch (err) {
    console.warn("[ClientGemini] Deals fetch failed:", err);
    return null;
  }
}
