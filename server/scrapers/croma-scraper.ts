/**
 * Croma Scraper
 * Fetches real product data from croma.com search results.
 * Uses direct HTTP requests + cheerio for HTML parsing.
 */
import * as cheerio from "cheerio";
import { ProductSearchResult } from "../types";
import { simpleHash, getPlaceholderImage } from "../utils/price-utils";

// ─── Constants ──────────────────────────────────────────────────────

const CROMA_BASE = "https://www.croma.com";
const SEARCH_URL = `${CROMA_BASE}/searchB`;
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

// ─── Price Parser ───────────────────────────────────────────────────

function parseCromaPrice(text: string): number | null {
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

export interface CromaScraperResult {
  results: ProductSearchResult[];
  scrapedAt: string;
  source: "croma_scraper";
  responseTimeMs: number;
}

export async function scrapeCromaSearch(query: string): Promise<CromaScraperResult> {
  const startTime = Date.now();
  const results: ProductSearchResult[] = [];

  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&text=${encodeURIComponent(query)}`;
    console.log(`[CromaScraper] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[CromaScraper] HTTP ${response.status} for query: "${query}"`);
      return { results: [], scrapedAt: new Date().toISOString(), source: "croma_scraper", responseTimeMs: Date.now() - startTime };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Croma product cards: look for product listing elements
    // Croma uses various selectors — try common patterns
    const productCards = $('li[data-testid*="product"], div.product-item, div[class*="product-card"], ul.product-list > li').toArray();
    
    // Also try finding links to product pages
    const productLinks = $('a[href*="/p/"]').toArray();
    const seenUrls = new Set<string>();

    console.log(`[CromaScraper] Found ${productCards.length} cards, ${productLinks.length} product links`);

    // Process product cards first
    for (const card of productCards) {
      if (results.length >= MAX_RESULTS) break;
      const $card = $(card);

      const titleEl = $card.find('h3, h2, [class*="product-title"], [class*="product-name"]').first();
      const title = titleEl.text().trim();
      if (!isValidTitle(title)) continue;

      // Price
      const priceTexts = $card.text().match(/₹[\s]*[\d,]+/g);
      if (!priceTexts || priceTexts.length === 0) continue;

      const prices = priceTexts
        .map(p => parseCromaPrice(p))
        .filter((p): p is number => p !== null && p >= 100);
      
      if (prices.length === 0) continue;
      prices.sort((a, b) => a - b);
      
      const price = prices[0];
      let originalPrice = prices.length > 1 ? prices[prices.length - 1] : undefined;
      originalPrice = sanitizeOriginalPrice(price, originalPrice);

      // URL
      const linkEl = $card.find("a[href*='/p/']").first();
      let productUrl = linkEl.attr("href") || "";
      if (productUrl && !productUrl.startsWith("http")) {
        productUrl = `${CROMA_BASE}${productUrl}`;
      }
      if (!productUrl || seenUrls.has(productUrl)) continue;
      seenUrls.add(productUrl);

      // Image
      let imageUrl = $card.find("img").first().attr("src") || $card.find("img").first().attr("data-src") || "";
      if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

      // Rating
      let rating = 4.0;
      const ratingText = $card.find('[class*="rating"]').first().text();
      const ratingMatch = ratingText.match(/([\d.]+)/);
      if (ratingMatch) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 1 && parsed <= 5) rating = parsed;
      }

      // Reviews
      let reviewsCount = 0;
      const reviewMatch = $card.text().match(/(\d[\d,]*)\s*(reviews?|ratings?)/i);
      if (reviewMatch) reviewsCount = parseInt(reviewMatch[1].replace(/,/g, ""), 10) || 0;

      results.push({
        id: simpleHash(`croma_${productUrl}_${results.length}`),
        title,
        price,
        originalPrice,
        platform: "Croma Store",
        url: productUrl,
        imageUrl,
        rating,
        reviewsCount,
        specs: {},
      });
    }

    // Fallback: if no cards found, try product links
    if (results.length === 0) {
      for (const link of productLinks) {
        if (results.length >= MAX_RESULTS) break;
        const $link = $(link);
        const href = $link.attr("href") || "";
        const fullUrl = href.startsWith("http") ? href : `${CROMA_BASE}${href}`;
        
        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);

        const $parent = $link.parent().parent().parent();
        const title = $link.attr("title") || $link.find("h3, h2, span").first().text().trim();
        if (!isValidTitle(title)) continue;

        const priceTexts = $parent.text().match(/₹[\s]*[\d,]+/g);
        if (!priceTexts) continue;
        
        const prices = priceTexts
          .map(p => parseCromaPrice(p))
          .filter((p): p is number => p !== null && p >= 100);
        if (prices.length === 0) continue;
        prices.sort((a, b) => a - b);

        const price = prices[0];
        let originalPrice = prices.length > 1 ? prices[prices.length - 1] : undefined;
        originalPrice = sanitizeOriginalPrice(price, originalPrice);

        let imageUrl = $parent.find("img").first().attr("src") || getPlaceholderImage(query);
        if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(query);

        results.push({
          id: simpleHash(`croma_${fullUrl}_${results.length}`),
          title,
          price,
          originalPrice,
          platform: "Croma Store",
          url: fullUrl,
          imageUrl,
          rating: 4.0,
          reviewsCount: 0,
          specs: {},
        });
      }
    }

    console.log(`[CromaScraper] Extracted ${results.length} valid products in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[CromaScraper] Scrape failed:`, error.message);
  }

  return {
    results,
    scrapedAt: new Date().toISOString(),
    source: "croma_scraper",
    responseTimeMs: Date.now() - startTime,
  };
}
