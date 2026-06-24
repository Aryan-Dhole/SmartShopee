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
      if (!item.title || typeof item.title !== "string" || item.title.trim().length < 5) return false;
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

      // Fix duplicate brand names (e.g., "DailyObjects DailyObjects Bag")
      let title = item.title.trim();
      const words = title.split(" ");
      if (words.length >= 2) {
        const firstWord = words[0].toLowerCase();
        const secondWord = words[1].toLowerCase();
        if (firstWord === secondWord) {
          title = words.slice(1).join(" ");
        }
      }

      // Round rating to 1 decimal
      const rawRating = Number(item.rating) || 4.0;
      const rating = Math.round(Math.min(5, Math.max(0, rawRating)) * 10) / 10;

      return {
        id: simpleHash(platform + title + index),
        title,
        price: itemPrice,
        originalPrice: originalPrice && originalPrice > itemPrice && originalPrice <= itemPrice * 3 ? originalPrice : undefined,
        platform,
        url,
        imageUrl,
        rating,
        reviewsCount: Math.max(0, Math.round(Number(item.reviewsCount) || 0)),
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

You MUST:
1. Search across ALL platforms: Amazon India, Flipkart, Croma, Vijay Sales, Reliance Digital, Snapdeal, Meesho, JioMart, Tata CLiQ, Myntra
2. Return 8-15 real, currently available listings with CURRENT prices in INR
3. Only return the EXACT product matching "${query}" — do NOT return accessories, cases, covers, cables, adapters, or related items
4. Ratings must be rounded to 1 decimal place (e.g., 4.2 not 4.5873017)
5. Include actual product listing URLs
6. Include product image URLs

Return ONLY a JSON array in \`\`\`json block. Each object: title (string), price (number), originalPrice (number or null), platform (string), url (string), imageUrl (string), rating (number 1 decimal), reviewsCount (number).
Do NOT fabricate data. If unsure, omit that platform.`;

  const TIMEOUT_MS = 30_000;

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

/**
 * Fetch AI-synthesized review summary directly from browser-side Gemini.
 * This bypasses the server — necessary because the AQ. prefix API key
 * only works from browser contexts, not Node.js.
 */
export async function fetchReviewSummaryWithGemini(
  productName: string,
  platform: string
): Promise<{ summary: string; pros: string[]; cons: string[]; verdict: string } | null> {
  const ai = getClient();
  if (!ai) return null;

  const prompt = `Synthesize customer feedback and reviews for "${productName}" from ${platform} and other sources.

Generate:
1. A concise summary of overall customer sentiment (2-3 sentences)
2. 3-4 specific pros (things customers consistently praise)
3. 2-3 specific cons (common complaints or issues)
4. A clear buy/skip verdict with reasoning

Base this on actual customer reviews and expert opinions available online. Be specific — mention actual features, not generic praise.
Return the result strictly as a valid JSON object. It must have: summary (string), pros (array of strings), cons (array of strings), verdict (string). Wrap the object in a \`\`\`json block. Do not include any other text.`;

  const TIMEOUT_MS = 30_000;

  try {
    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini review timed out")), TIMEOUT_MS)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const jsonText = extractJson(response.text || "");
    if (jsonText) {
      const result = JSON.parse(jsonText);
      if (result && result.summary && Array.isArray(result.pros)) {
        return result;
      }
    }
    return null;
  } catch (err) {
    console.warn("[ClientGemini] Review summary failed:", err);
    return null;
  }
}

/**
 * Send a chat message to Gemini AI shopping assistant directly from browser.
 * Bypasses the server for the same API key reason.
 */
export async function sendChatWithGemini(
  message: string,
  context?: { watchlist?: string[]; recentSearches?: string[] }
): Promise<{ reply: string } | null> {
  const ai = getClient();
  if (!ai) return null;

  let contextBlock = "";
  if (context?.watchlist?.length) {
    contextBlock += `\nUser is tracking these products: ${context.watchlist.join(", ")}`;
  }
  if (context?.recentSearches?.length) {
    contextBlock += `\nRecent searches: ${context.recentSearches.join(", ")}`;
  }

  const prompt = `You are PriceWise AI, a helpful shopping assistant for Indian e-commerce. You help users find the best deals, compare products, and make smart purchasing decisions.
${contextBlock}

User message: "${message}"

Respond naturally and helpfully. If the user asks about specific products, provide current pricing context. Keep responses concise but informative. Use ₹ for Indian Rupee prices.`;

  const TIMEOUT_MS = 30_000;

  try {
    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini chat timed out")), TIMEOUT_MS)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const reply = response.text?.trim();
    if (reply) {
      return { reply };
    }
    return null;
  } catch (err) {
    console.warn("[ClientGemini] Chat failed:", err);
    return null;
  }
}

