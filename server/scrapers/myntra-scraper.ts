/**
 * Myntra Scraper (Best-Effort)
 * Myntra is heavily JS-rendered and blocks scraping aggressively.
 * This scraper attempts to parse server-rendered HTML, __PRELOADED_STATE__,
 * and JSON-LD data. Expected to frequently return 0 results.
 * Gemini Search Grounding serves as the reliable fallback for Myntra.
 */
import * as cheerio from "cheerio";
import { ProductSearchResult } from "../types";
import { simpleHash, getPlaceholderImage } from "../utils/price-utils";

// ─── Constants ──────────────────────────────────────────────────────

const MYNTRA_BASE = "https://www.myntra.com";
const MAX_RESULTS = 50; // No practical cap — return all results found

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getHeaders(): Record<string, string> {
  return {
    "User-Agent": getRandomUserAgent(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[₹,\s]/g, "").replace(/Rs\.?/gi, "").trim();
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (price > 0 && price < 50_000_000) return Math.round(price);
  }
  return null;
}

function sanitizeOriginalPrice(price: number, originalPrice: number | undefined): number | undefined {
  if (!originalPrice || originalPrice <= price) return undefined;
  if (originalPrice > price * 3) return undefined;
  return originalPrice;
}

function isValidTitle(title: string): boolean {
  if (!title || title.length < 5 || title.length > 500) return false;
  const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 3) return false;
  if (/^(add to|buy now|view|compare|filter|sort|sponsored)/i.test(title)) return false;
  return true;
}

// ─── Search Scraper ─────────────────────────────────────────────────

export interface MyntraScraperResult {
  results: ProductSearchResult[];
  scrapedAt: string;
  source: "myntra_scraper";
  responseTimeMs: number;
}

export async function scrapeMyntraSearch(query: string): Promise<MyntraScraperResult> {
  const startTime = Date.now();
  const results: ProductSearchResult[] = [];

  try {
    // Myntra search URL format
    const searchSlug = query.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const url = `${MYNTRA_BASE}/${searchSlug}`;
    console.log(`[MyntraScraper] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[MyntraScraper] HTTP ${response.status} for query: "${query}"`);
      return { results: [], scrapedAt: new Date().toISOString(), source: "myntra_scraper", responseTimeMs: Date.now() - startTime };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Strategy 1: Try to extract __PRELOADED_STATE__ from script tag
    const scripts = $("script").toArray();
    for (const script of scripts) {
      const text = $(script).text();
      
      // Look for window.__myx pattern (Myntra's state injection)
      const stateMatch = text.match(/window\.__myx\s*=\s*({[\s\S]*?});?\s*(?:window\.|<\/script>|$)/);
      if (stateMatch) {
        try {
          const state = JSON.parse(stateMatch[1]);
          const products = state?.searchData?.results?.products || 
                          state?.search?.results?.products ||
                          [];
          
          for (const product of products) {
            const brand = (product.brand || "").trim();
            const name = (product.product || product.productName || "").trim();
            // Avoid duplicate: if name already starts with brand, don't prepend it
            let title = "";
            if (brand && !name.toLowerCase().startsWith(brand.toLowerCase())) {
              title = `${brand} ${name}`.trim();
            } else {
              title = name || brand;
            }
            if (!isValidTitle(title)) continue;

            const price = product.price || product.mrp;
            if (!price || price <= 0) continue;

            let originalPrice = product.mrp && product.mrp > price ? product.mrp : undefined;
            originalPrice = sanitizeOriginalPrice(price, originalPrice);

            const productId = product.productId || product.styleId || "";
            const productUrl = productId ? `${MYNTRA_BASE}/${searchSlug}/${productId}/buy` : "#";

            let imageUrl = "";
            if (product.searchImage) {
              imageUrl = product.searchImage.startsWith("http") 
                ? product.searchImage 
                : `https://assets.myntassets.com/${product.searchImage}`;
            } else if (product.images && product.images.length > 0) {
              const img = product.images[0];
              imageUrl = typeof img === "string" ? img : img.src || img.url || "";
            }
            if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

            results.push({
              id: simpleHash(`myntra_${productId}_${results.length}`),
              title,
              price,
              originalPrice,
              platform: "Myntra",
              url: productUrl,
              imageUrl,
              rating: Number(product.rating) || 4.0,
              reviewsCount: Number(product.ratingCount || product.reviewCount) || 0,
              specs: { brand },
            });
          }
        } catch { /* State parse error — continue */ }
      }
    }

    // Strategy 2: Try JSON-LD structured data
    if (results.length === 0) {
      const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse($(script).text().trim());
          if (data["@type"] === "ItemList" && Array.isArray(data.itemListElement)) {
            for (const item of data.itemListElement) {
              if (results.length >= MAX_RESULTS) break;
              const product = item.item || item;
              if (!product.name || !isValidTitle(product.name)) continue;

              const price = parsePrice(String(product.offers?.price || ""));
              if (!price) continue;

              let productUrl = product.url || "#";
              if (!productUrl.startsWith("http")) productUrl = `${MYNTRA_BASE}${productUrl}`;

              let imageUrl = product.image || "";
              if (typeof imageUrl === "object") imageUrl = imageUrl.url || "";
              if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

              results.push({
                id: simpleHash(`myntra_${productUrl}_${results.length}`),
                title: product.name.trim(),
                price,
                originalPrice: undefined,
                platform: "Myntra",
                url: productUrl,
                imageUrl,
                rating: 4.0,
                reviewsCount: 0,
                specs: {},
              });
            }
          }
        } catch { /* JSON parse error */ }
      }
    }

    // Strategy 3: Try HTML product cards as last resort
    if (results.length === 0) {
      const productCards = $('[class*="product-base"], [class*="product-card"], li[class*="product"]').toArray();
      const seenTitles = new Set<string>();

      for (const card of productCards) {
        if (results.length >= MAX_RESULTS) break;
        const $card = $(card);

        const brand = $card.find('[class*="product-brand"]').first().text().trim();
        const name = $card.find('[class*="product-product"]').first().text().trim();
        const title = `${brand} ${name}`.trim() || $card.find("h3, h4").first().text().trim();
        if (!isValidTitle(title) || seenTitles.has(title.toLowerCase())) continue;
        seenTitles.add(title.toLowerCase());

        const priceText = $card.find('[class*="product-discountedPrice"], [class*="product-price"]').first().text();
        const price = parsePrice(priceText);
        if (!price) continue;

        const mrpText = $card.find('[class*="product-strike"]').first().text();
        let originalPrice = parsePrice(mrpText) || undefined;
        originalPrice = sanitizeOriginalPrice(price, originalPrice);

        const linkEl = $card.find("a").first();
        let productUrl = linkEl.attr("href") || "#";
        if (!productUrl.startsWith("http")) productUrl = `${MYNTRA_BASE}${productUrl}`;

        let imageUrl = $card.find("img").first().attr("src") || $card.find("img").first().attr("data-src") || "";
        if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

        results.push({
          id: simpleHash(`myntra_${productUrl}_${results.length}`),
          title,
          price,
          originalPrice,
          platform: "Myntra",
          url: productUrl,
          imageUrl,
          rating: 4.0,
          reviewsCount: 0,
          specs: { brand },
        });
      }
    }

    console.log(`[MyntraScraper] Extracted ${results.length} products in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[MyntraScraper] Scrape failed:`, error.message);
  }

  return {
    results,
    scrapedAt: new Date().toISOString(),
    source: "myntra_scraper",
    responseTimeMs: Date.now() - startTime,
  };
}
