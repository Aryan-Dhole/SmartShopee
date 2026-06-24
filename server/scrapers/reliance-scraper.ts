/**
 * Reliance Digital Scraper
 * Fetches real product data from reliancedigital.in search results.
 * Uses direct HTTP requests + cheerio for HTML parsing.
 */
import * as cheerio from "cheerio";
import { ProductSearchResult } from "../types";
import { simpleHash, getPlaceholderImage } from "../utils/price-utils";

// ─── Constants ──────────────────────────────────────────────────────

const RD_BASE = "https://www.reliancedigital.in";
const SEARCH_URL = `${RD_BASE}/search`;
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
  const cleaned = text.replace(/[₹,\s]/g, "").trim();
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
  if (!title || title.length < 8 || title.length > 500) return false;
  const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 4) return false;
  if (/^(add to|buy now|view|compare|filter|sort|sponsored)/i.test(title)) return false;
  return true;
}

// ─── Search Scraper ─────────────────────────────────────────────────

export interface RelianceScraperResult {
  results: ProductSearchResult[];
  scrapedAt: string;
  source: "reliance_scraper";
  responseTimeMs: number;
}

export async function scrapeRelianceSearch(query: string): Promise<RelianceScraperResult> {
  const startTime = Date.now();
  const results: ProductSearchResult[] = [];

  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
    console.log(`[RelianceScraper] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[RelianceScraper] HTTP ${response.status} for query: "${query}"`);
      return { results: [], scrapedAt: new Date().toISOString(), source: "reliance_scraper", responseTimeMs: Date.now() - startTime };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to find product data in JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
    for (const script of jsonLdScripts) {
      try {
        const jsonText = $(script).text().trim();
        if (!jsonText) continue;
        const data = JSON.parse(jsonText);
        
        // Handle ItemList
        if (data["@type"] === "ItemList" && Array.isArray(data.itemListElement)) {
          for (const item of data.itemListElement) {
            if (results.length >= MAX_RESULTS) break;
            const product = item.item || item;
            if (!product.name || !isValidTitle(product.name)) continue;
            
            const price = parsePrice(String(product.offers?.price || product.price || ""));
            if (!price) continue;

            let productUrl = product.url || product["@id"] || "#";
            if (productUrl && !productUrl.startsWith("http")) {
              productUrl = `${RD_BASE}${productUrl}`;
            }

            let imageUrl = product.image || "";
            if (typeof imageUrl === "object") imageUrl = imageUrl.url || imageUrl[0] || "";
            if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

            results.push({
              id: simpleHash(`reliance_${productUrl}_${results.length}`),
              title: product.name.trim(),
              price,
              originalPrice: undefined,
              platform: "Reliance Digital",
              url: productUrl,
              imageUrl,
              rating: Number(product.aggregateRating?.ratingValue) || 4.0,
              reviewsCount: Number(product.aggregateRating?.reviewCount) || 0,
              specs: {},
            });
          }
        }

        // Handle single Product
        if (data["@type"] === "Product" && data.name) {
          if (results.length < MAX_RESULTS && isValidTitle(data.name)) {
            const price = parsePrice(String(data.offers?.price || ""));
            if (price) {
              let productUrl = data.url || "#";
              if (!productUrl.startsWith("http")) productUrl = `${RD_BASE}${productUrl}`;
              let imageUrl = data.image || "";
              if (typeof imageUrl === "object") imageUrl = imageUrl.url || imageUrl[0] || "";
              if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

              results.push({
                id: simpleHash(`reliance_${productUrl}_${results.length}`),
                title: data.name.trim(),
                price,
                originalPrice: undefined,
                platform: "Reliance Digital",
                url: productUrl,
                imageUrl,
                rating: Number(data.aggregateRating?.ratingValue) || 4.0,
                reviewsCount: Number(data.aggregateRating?.reviewCount) || 0,
                specs: {},
              });
            }
          }
        }
      } catch { /* JSON parse error — skip this script tag */ }
    }

    // Fallback: Parse HTML product cards
    if (results.length === 0) {
      const seenUrls = new Set<string>();
      const productLinks = $('a[href*="/p/"]').toArray();

      for (const link of productLinks) {
        if (results.length >= MAX_RESULTS) break;
        const $link = $(link);
        const href = $link.attr("href") || "";
        const fullUrl = href.startsWith("http") ? href : `${RD_BASE}${href}`;

        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);

        const $card = $link.closest('[class*="product"], [class*="card"], li').length
          ? $link.closest('[class*="product"], [class*="card"], li')
          : $link.parent().parent().parent();

        const title = (
          $link.attr("title") ||
          $card.find("h3, h2, p[class*='name'], p[class*='title'], span[class*='name']").first().text().trim() ||
          $link.text().trim()
        );
        if (!isValidTitle(title)) continue;

        const priceTexts = $card.text().match(/₹[\s]*[\d,]+/g);
        if (!priceTexts) continue;

        const prices = priceTexts
          .map(p => parsePrice(p))
          .filter((p): p is number => p !== null && p >= 100);
        if (prices.length === 0) continue;
        prices.sort((a, b) => a - b);

        const price = prices[0];
        let originalPrice = prices.length > 1 ? prices[prices.length - 1] : undefined;
        originalPrice = sanitizeOriginalPrice(price, originalPrice);

        let imageUrl = $card.find("img").first().attr("src") || $card.find("img").first().attr("data-src") || "";
        if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

        results.push({
          id: simpleHash(`reliance_${fullUrl}_${results.length}`),
          title,
          price,
          originalPrice,
          platform: "Reliance Digital",
          url: fullUrl,
          imageUrl,
          rating: 4.0,
          reviewsCount: 0,
          specs: {},
        });
      }
    }

    console.log(`[RelianceScraper] Extracted ${results.length} valid products in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[RelianceScraper] Scrape failed:`, error.message);
  }

  return {
    results,
    scrapedAt: new Date().toISOString(),
    source: "reliance_scraper",
    responseTimeMs: Date.now() - startTime,
  };
}
