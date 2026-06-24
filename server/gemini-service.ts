import { GoogleGenAI, Type } from "@google/genai";
import { ProductSearchResult, SmartAlternative, AIReviewSummary } from "./types";
import { simpleHash, getPlaceholderImage } from "./utils/price-utils";
import { isProductUrl, parseProductUrl } from "./utils/url-parser";
import { scrapeAllPlatforms, scrapeDealsForProduct } from "./scrapers/multi-platform-scraper";
import type { ScrapeMetadata } from "./scrapers/multi-platform-scraper";

// ─── Utilities ────────────────────────────────────────────────────────

function extractJson(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();

  // Try extracting from a ```json ... ``` block first
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try finding a bare JSON array or object
  const arrayMatch = trimmed.match(/(\[[\s\S]*\])/);
  if (arrayMatch) return arrayMatch[1].trim();
  const objectMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (objectMatch) return objectMatch[1].trim();

  return trimmed;
}

// ─── Gemini Client (Lazy Init) ──────────────────────────────────────

let aiInstance: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not set. Please create a .env file with your API key.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "pricewise-server" },
      },
    });
  }
  return aiInstance;
}

// ─── In-Memory Cache ────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
  // Prune old entries if cache gets large
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now >= v.expiry) cache.delete(k);
    }
  }
}

// ─── Result Validation ──────────────────────────────────────────────

function validateSearchResults(results: any[], query: string): ProductSearchResult[] {
  return results
    .filter((item) => {
      // Remove results with clearly invalid prices
      const price = Number(item.price);
      if (!price || price <= 0 || price > 50_000_000) return false;
      // Must have a title of reasonable length
      if (!item.title || typeof item.title !== "string" || item.title.trim().length < 5) return false;
      return true;
    })
    .map((item, index) => {
      const itemPrice = Number(item.price);
      const originalPrice = item.originalPrice ? Number(item.originalPrice) : undefined;

      // Normalize platform name
      let platform = String(item.platform || "Unknown").trim();
      platform = normalizePlatformName(platform);

      // Validate URL pattern
      let url = item.url || "#";
      if (!url.startsWith("http")) {
        url = "#";
      }

      // Image fallback
      let imageUrl = item.imageUrl || "";
      if (!imageUrl.startsWith("http")) {
        imageUrl = getPlaceholderImage(query);
      }

      // Fix duplicate brand names (e.g., "DailyObjects DailyObjects Bag" → "DailyObjects Bag")
      let title = item.title.trim();
      const words = title.split(" ");
      if (words.length >= 2) {
        const firstWord = words[0].toLowerCase();
        const secondWord = words[1].toLowerCase();
        if (firstWord === secondWord) {
          title = words.slice(1).join(" ");
        }
      }

      // Round rating to 1 decimal place
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
  };
  return map[lower] || name;
}

// ─── Gemini Search (for platforms we don't scrape directly) ─────────

async function geminiSearch(query: string, isUrl: boolean): Promise<ProductSearchResult[]> {
  const ai = getGemini();

  let targetPrompt = "";

  if (isUrl) {
    const parsed = parseProductUrl(query);
    const queryHint = parsed.keywords ? `(likely product: "${parsed.keywords}")` : "";
    targetPrompt = `The user provided an e-commerce product URL: "${query}" ${queryHint}.
Using real-time web search, find this exact product and locate it across major Indian e-commerce platforms.

Instructions:
1. Identify the exact product from the URL
2. Search for the same product on: Croma, Vijay Sales, Reliance Digital, Snapdeal, Meesho, JioMart, Tata CLiQ
3. Return 2-4 real listings with CURRENT prices in INR
4. Include actual product titles as listed on each platform
5. Include real ratings and review counts
6. Include actual product listing URLs (not generic store URLs)
7. Include product image URLs if available

CRITICAL: Only include listings you can verify exist through web search. Do NOT fabricate or estimate any prices, URLs, or data. If you cannot find a product on a platform, do not include it.
Return the result strictly as a valid JSON array of objects. Each object must have: title (string), price (number), originalPrice (number or null), platform (string), url (string), imageUrl (string), rating (number), reviewsCount (number). Wrap the array in a \`\`\`json block. Do not include any other text.`;
  } else {
    targetPrompt = `Search for "${query}" on major Indian e-commerce platforms.

Instructions:
1. Search across ALL of these platforms: Amazon India, Flipkart, Croma, Vijay Sales, Reliance Digital, Snapdeal, Meesho, JioMart, Tata CLiQ, Myntra
2. Return 8-15 real, currently available product listings with CURRENT prices in INR
3. Include the exact product title as shown on each platform — must be the ACTUAL product matching the query, NOT accessories, cases, covers, or adapters
4. Include real star ratings (out of 5, rounded to 1 decimal) and review/rating counts
5. Include actual product listing URLs
6. Include product image URLs if available
7. If the product has variants, pick the most popular/default variant
8. IMPORTANT: Only return listings for the ACTUAL product searched, not accessories or related items. For example, if the query is "iPhone 16", return iPhone 16 phone listings, NOT iPhone cases, screen protectors, chargers, etc.

CRITICAL: Only include listings you can verify through web search. Do NOT fabricate or estimate any prices, URLs, or data. If you cannot find the product on a platform, simply omit that platform.
Return the result strictly as a valid JSON array of objects. Each object must have: title (string), price (number), originalPrice (number or null), platform (string), url (string), imageUrl (string), rating (number), reviewsCount (number). Wrap the array in a \`\`\`json block. Do not include any other text.`;
  }

  // Retry up to 2 times on 503 (transient overload)
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt));
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: targetPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const jsonText = response.text ? extractJson(response.text) : "";
      if (jsonText) {
        const rawResults = JSON.parse(jsonText);
        const validated = validateSearchResults(rawResults, query);
        console.log(`[Gemini] Validated ${validated.length} of ${rawResults.length} results from Gemini`);
        return validated;
      }
      return [];
    } catch (err: any) {
      lastError = err;
      if (!err?.status || err.status !== 503) break;
      console.warn(`[Gemini] 503 on attempt ${attempt + 1}, retrying...`);
    }
  }
  console.warn("[Gemini] Search failed after retries:", lastError?.message);
  return [];
}

// ─── Product Search (Main Entry Point) ──────────────────────────────

export interface SearchResultWithMetadata {
  results: ProductSearchResult[];
  metadata: ScrapeMetadata;
}

export async function performProductSearch(query: string): Promise<ProductSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = getCached<ProductSearchResult[]>(cacheKey);
  if (cached) {
    console.log("[Search] Cache hit for:", query);
    return cached;
  }

  const isUrl = isProductUrl(query);
  const allResults: ProductSearchResult[] = [];

  try {
    // Run scrapers and Gemini in parallel
    const [scrapeResult, geminiResults] = await Promise.allSettled([
      scrapeAllPlatforms(query),
      geminiSearch(query, isUrl),
    ]);

    // Collect scraper results
    if (scrapeResult.status === "fulfilled") {
      const { results, metadata } = scrapeResult.value;
      console.log(`[Search] Scrapers returned ${results.length} results (${metadata.totalTimeMs}ms)`);
      metadata.sources.forEach(s => {
        console.log(`  - ${s.name}: ${s.resultCount} results (${s.responseTimeMs}ms, ${s.status})`);
      });
      allResults.push(...results);
    } else {
      console.error("[Search] Scraper orchestrator failed:", scrapeResult.reason);
    }

    // Collect Gemini results — deduplicate by platform+title similarity
    if (geminiResults.status === "fulfilled") {
      const gemini = geminiResults.value;
      console.log(`[Search] Gemini returned ${gemini.length} additional results`);
      // Only add Gemini results for platforms where scrapers returned 0 results
      const scrapedPlatformsWithResults = new Set(
        allResults.map(r => r.platform)
      );
      const newGemini = gemini.filter(r => !scrapedPlatformsWithResults.has(r.platform));
      allResults.push(...newGemini);
      console.log(`[Search] Added ${newGemini.length} Gemini results (skipped ${gemini.length - newGemini.length} for covered platforms)`);
    } else {
      console.warn("[Search] Gemini search failed:", (geminiResults as any).reason?.message);
    }

    // Sort by price
    allResults.sort((a, b) => a.price - b.price);

    if (allResults.length > 0) {
      setCache(cacheKey, allResults);
      console.log(`[Search] Total: ${allResults.length} results for "${query}"`);
      return allResults;
    }

    // If everything failed, return empty — no fake data
    console.warn(`[Search] No results found for "${query}" from any source`);
    return [];

  } catch (error) {
    console.error("[Search] Unexpected error:", error);
    return [];
  }
}

// ─── Real Merchant Deals ─────────────────────────────────────────────

export async function fetchRealMerchantDeals(productName: string, currentPrice: number): Promise<any[]> {
  const cacheKey = `deals:${productName.toLowerCase()}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    // Run scrapers and Gemini deals search in parallel
    const [scrapeResult, geminiResult] = await Promise.allSettled([
      scrapeDealsForProduct(productName, currentPrice),
      fetchGeminiDeals(productName, currentPrice),
    ]);

    const allDeals: any[] = [];
    const seenPlatforms = new Set<string>();

    // Add scraper deals first (more reliable)
    if (scrapeResult.status === "fulfilled") {
      for (const deal of scrapeResult.value.deals) {
        if (!seenPlatforms.has(deal.platform)) {
          allDeals.push(deal);
          seenPlatforms.add(deal.platform);
        }
      }
    }

    // Add Gemini deals for platforms not covered
    if (geminiResult.status === "fulfilled") {
      for (const deal of geminiResult.value) {
        const normalized = normalizePlatformName(deal.platform);
        if (!seenPlatforms.has(normalized)) {
          deal.platform = normalized;
          allDeals.push(deal);
          seenPlatforms.add(normalized);
        }
      }
    }

    // Sort and mark lowest
    if (allDeals.length > 0) {
      allDeals.sort((a, b) => a.price - b.price);
      allDeals.forEach(d => d.isLowest = false);
      allDeals[0].isLowest = true;
      setCache(cacheKey, allDeals);
    }

    return allDeals;
  } catch (error) {
    console.warn("[Deals] Failed to fetch deals:", error);
    return [];
  }
}

// Gemini-based deal fetching for other platforms
async function fetchGeminiDeals(productName: string, currentPrice: number): Promise<any[]> {
  try {
    const ai = getGemini();
    const prompt = `Find real, current prices for the exact product "${productName}" (reference price around ₹${currentPrice}) across Indian e-commerce platforms like Croma, Reliance Digital, Vijay Sales, Snapdeal, Meesho.

Return exactly 2 to 4 real store listings.
For each listing, provide:
1. platform: The retail platform name
2. price: The current price in INR (number)
3. originalPrice: The original MRP in INR if discounted (number or null)
4. url: The product listing URL
5. deliveryText: Delivery estimate text
6. stockStatus: "in_stock" or "out_of_stock"

CRITICAL: Only include real verifiable listings. Do NOT fabricate data.
Return the result strictly as a valid JSON array of objects. Each object must have: platform (string), price (number), originalPrice (number or null), url (string), deliveryText (string), stockStatus (string: "in_stock" or "out_of_stock"). Wrap the array in a \`\`\`json block. Do not include any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const jsonText = response.text ? extractJson(response.text) : "";
    if (jsonText) {
      const deals = JSON.parse(jsonText).map((d: any) => ({
        ...d,
        isLowest: false,
        stockStatus: d.stockStatus || "in_stock",
        deliveryText: d.deliveryText || "Standard Delivery"
      }));
      return deals;
    }
    return [];
  } catch (error) {
    console.warn("[Gemini] Deals search failed:", error);
    return [];
  }
}

// ─── Smarter Alternatives ───────────────────────────────────────────

export async function retrieveSmarterAlternatives(
  productName: string,
  price: number,
  platform: string
): Promise<SmartAlternative[]> {
  const cacheKey = `alt:${productName.toLowerCase()}:${price}`;
  const cached = getCached<SmartAlternative[]>(cacheKey);
  if (cached) return cached;

  try {
    const ai = getGemini();

    const prompt = `Based on the product "${productName}" priced at ₹${price} on ${platform}, suggest 2-3 smarter alternative products.

For each alternative, provide:
1. The exact product name
2. Its price in INR
3. Where to buy it (platform name)
4. A clear reason why it's a better value (specific features, better specs, proven reliability, or significant savings)
5. A product URL if available
6. How much savings (as a percentage)

Focus on:
- Products with better price-to-performance ratio
- Similar or better specs at a lower price
- Higher-rated alternatives from reputable brands
- Certified refurbished options from official stores

CRITICAL: Only suggest products that actually exist and are currently available in India. Do NOT fabricate data.
Return the result strictly as a valid JSON array of objects. Each object must have: title (string), price (number), platform (string), reason (string), url (string), savings (number). Wrap the array in a \`\`\`json block. Do not include any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      },
    });

    const jsonText = response.text ? extractJson(response.text) : "";
    if (jsonText) {
      const alts = JSON.parse(jsonText);
      if (Array.isArray(alts) && alts.length > 0) {
        setCache(cacheKey, alts);
        return alts;
      }
    }
    return [];
  } catch (error) {
    console.warn("[Gemini] Alternatives failed:", error);
    return [];
  }
}

// ─── AI Review Summary ──────────────────────────────────────────────

export async function summarizeAiReviews(productName: string, platform: string): Promise<AIReviewSummary> {
  const cacheKey = `review:${productName.toLowerCase()}:${platform.toLowerCase()}`;
  const cached = getCached<AIReviewSummary>(cacheKey);
  if (cached) return cached;

  try {
    const ai = getGemini();

    const prompt = `Synthesize customer feedback and reviews for "${productName}" from ${platform} and other sources.

Generate:
1. A concise summary of overall customer sentiment (2-3 sentences)
2. 3-4 specific pros (things customers consistently praise)
3. 2-3 specific cons (common complaints or issues)
4. A clear buy/skip verdict with reasoning

Base this on actual customer reviews and expert opinions available online. Be specific — mention actual features, not generic praise.
Return the result strictly as a valid JSON object. It must have: summary (string), pros (array of strings), cons (array of strings), verdict (string). Wrap the object in a \`\`\`json block. Do not include any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      },
    });

    const jsonText = response.text ? extractJson(response.text) : "";
    if (jsonText) {
      const summary = JSON.parse(jsonText);
      setCache(cacheKey, summary);
      return summary;
    }
    throw new Error("No review summary returned");
  } catch (error) {
    console.warn("[Gemini] Reviews failed:", error);
    return {
      summary: `Unable to generate review synthesis for ${productName} at this time. Please try again shortly.`,
      pros: ["Data temporarily unavailable"],
      cons: ["Review analysis service is busy"],
      verdict: "Try again in a moment for an AI-generated review summary.",
    };
  }
}

// ─── AI Product Comparison ──────────────────────────────────────────

export async function compareProducts(
  productA: { title: string; price: number; platform: string; rating: number; reviewsCount: number; specs?: Record<string, string> },
  productB: { title: string; price: number; platform: string; rating: number; reviewsCount: number; specs?: Record<string, string> }
) {
  try {
    const ai = getGemini();

    const prompt = `Compare these two products for an Indian consumer:

Product A: "${productA.title}" at ₹${productA.price} on ${productA.platform} (${productA.rating}★, ${productA.reviewsCount} reviews)
Product B: "${productB.title}" at ₹${productB.price} on ${productB.platform} (${productB.rating}★, ${productB.reviewsCount} reviews)

Provide:
1. An overall verdict stating which product offers better value and why
2. The winner (A, B, or Tie)
3. A short summary of Product A's strengths
4. A short summary of Product B's strengths  
5. 3-5 comparison metrics (value, quality, features, etc.) with values for each and which one wins per metric
6. 2-3 pros for each product
7. 1-2 cons for each product

Return the result strictly as a valid JSON object. It must have: verdict (string), winner (string: A, B, or Tie), productASummary (string), productBSummary (string), metrics (array of objects with name, valA, valB, winner), prosA (array of strings), prosB (array of strings), consA (array of strings), consB (array of strings). Wrap the object in a \`\`\`json block. Do not include any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      },
    });

    const jsonText = response.text ? extractJson(response.text) : "";
    if (jsonText) {
      const result = JSON.parse(jsonText);
      return {
        verdict: result.verdict,
        winner: result.winner,
        productASummary: result.productASummary,
        productBSummary: result.productBSummary,
        metrics: result.metrics || [],
        pros: { a: result.prosA || [], b: result.prosB || [] },
        cons: { a: result.consA || [], b: result.consB || [] },
      };
    }
    throw new Error("No comparison text returned");
  } catch (error) {
    console.warn("[Gemini] Comparison failed:", error);
    // Return a minimal honest comparison using available data
    const aIsCheaper = productA.price < productB.price;
    const aIsBetterRated = productA.rating > productB.rating;
    return {
      verdict: `Unable to generate AI comparison at this time. Based on price alone: ${aIsCheaper ? productA.title : productB.title} is more affordable.`,
      winner: aIsCheaper && aIsBetterRated ? "A" : !aIsCheaper && !aIsBetterRated ? "B" : "Tie",
      productASummary: `₹${productA.price.toLocaleString("en-IN")} on ${productA.platform}. Rated ${productA.rating}/5.`,
      productBSummary: `₹${productB.price.toLocaleString("en-IN")} on ${productB.platform}. Rated ${productB.rating}/5.`,
      metrics: [
        { name: "Price (INR)", valA: `₹${productA.price.toLocaleString("en-IN")}`, valB: `₹${productB.price.toLocaleString("en-IN")}`, winner: aIsCheaper ? "A" : "B" },
        { name: "Rating", valA: `${productA.rating}/5`, valB: `${productB.rating}/5`, winner: aIsBetterRated ? "A" : "B" },
      ],
      pros: { a: ["Competitive pricing"], b: ["Strong market presence"] },
      cons: { a: ["AI comparison unavailable"], b: ["AI comparison unavailable"] },
    };
  }
}

// ─── AI Chat ────────────────────────────────────────────────────────

export async function handleChatMessage(
  message: string,
  context?: { watchlist?: string[]; recentSearches?: string[] }
): Promise<{ reply: string; products?: any[] }> {
  try {
    const ai = getGemini();

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const reply = response.text?.trim() || "I couldn't process your request. Please try again.";
    return { reply };
  } catch (error) {
    console.warn("[Gemini] Chat failed:", error);
    return {
      reply: "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
    };
  }
}
