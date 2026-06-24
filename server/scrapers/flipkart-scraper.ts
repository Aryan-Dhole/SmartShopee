/**
 * Flipkart Scraper
 * Fetches real product data from Flipkart search results.
 * Uses direct HTTP requests + cheerio for HTML parsing.
 */
import * as cheerio from "cheerio";
import { ProductSearchResult } from "../types";
import { simpleHash, getPlaceholderImage } from "../utils/price-utils";

// ─── Constants ──────────────────────────────────────────────────────

const FLIPKART_BASE = "https://www.flipkart.com";
const SEARCH_URL = `${FLIPKART_BASE}/search`;
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

// ─── Title Validation ───────────────────────────────────────────────

const GARBAGE_TITLE_PATTERNS = [
  /^add to (compare|cart|wishlist|bag)/i,
  /^(buy now|shop now|view (details|all|more)|see (all|more)|sponsored)/i,
  /^(best seller|limited deal|lightning deal|great indian|sale|offer)/i,
  /^(compare|select|choose|filter|sort|results?|showing)/i,
  /^(free delivery|emi available|no cost emi|bank offer)/i,
  /^(fulfilled by|sold by|shipped by|delivered by)/i,
  /^\d+\s*(ratings?|reviews?|stars?|%\s*off)/i,
  /^₹/,
  /^(assured|super ?coin|plus ?member)/i,
];

function isValidTitle(title: string): boolean {
  if (!title || title.length < 8) return false;
  if (title.length > 500) return false;

  const lower = title.toLowerCase().trim();

  // Check against garbage patterns
  for (const pattern of GARBAGE_TITLE_PATTERNS) {
    if (pattern.test(lower)) return false;
  }

  // Reject titles that are mostly numbers/symbols
  const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 4) return false;

  return true;
}

// ─── Price Parser ───────────────────────────────────────────────────

function parseFlipkartPrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[₹,\s]/g, "").trim();
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (price > 0 && price < 50_000_000) return Math.round(price);
  }
  return null;
}

/**
 * Cap original price to a sane multiple of the current price.
 * Prevents inflated MSRP (e.g., ₹50,00,000 MRP on a ₹15,000 item).
 */
function sanitizeOriginalPrice(price: number, originalPrice: number | undefined): number | undefined {
  if (!originalPrice || originalPrice <= price) return undefined;
  // Cap at 3× the current price — anything beyond is clearly wrong
  if (originalPrice > price * 3) return undefined;
  return originalPrice;
}

// ─── Search Scraper ─────────────────────────────────────────────────

export interface FlipkartScraperResult {
  results: ProductSearchResult[];
  scrapedAt: string;
  source: "flipkart_scraper";
  responseTimeMs: number;
}

export async function scrapeFlipkartSearch(query: string): Promise<FlipkartScraperResult> {
  const startTime = Date.now();
  const results: ProductSearchResult[] = [];

  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
    console.log(`[FlipkartScraper] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[FlipkartScraper] HTTP ${response.status} for query: "${query}"`);
      return { results: [], scrapedAt: new Date().toISOString(), source: "flipkart_scraper", responseTimeMs: Date.now() - startTime };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Flipkart uses dynamic class names. We need multiple strategies to find product cards.
    // Strategy 1: Look for product cards via common structural patterns
    // Flipkart wraps each product in an anchor tag with data-id or within div[data-id]
    
    // Find product links — Flipkart product pages follow /product-name/p/itemId pattern
    const productLinks = $('a[href*="/p/itm"]').toArray();
    const seenUrls = new Set<string>();

    console.log(`[FlipkartScraper] Found ${productLinks.length} product links`);

    for (const link of productLinks) {
      if (results.length >= MAX_RESULTS) break;

      const $link = $(link);
      const href = $link.attr("href") || "";
      
      // Deduplicate by URL
      const fullUrl = href.startsWith("http") ? href : `${FLIPKART_BASE}${href}`;
      const cleanUrl = fullUrl.split("?")[0]; // Remove query params for dedup
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);

      // Navigate up to find the product card container
      const $card = $link.closest('[data-id]').length ? $link.closest('[data-id]') : $link.parent().parent().parent();

      // ── Title: Try multiple selectors with validation
      let title = "";
      const titleCandidates = [
        $card.find('a[title]').first().attr("title"),
        $card.find('div[class*="col"] a > div:first-child').first().text(),
        $link.find('div').first().text(),
        $link.attr("title"),
      ];
      for (const candidate of titleCandidates) {
        const cleaned = candidate?.trim() || "";
        if (cleaned.length > 5 && isValidTitle(cleaned)) {
          title = cleaned;
          break;
        }
      }
      if (!title) continue;

      // ── Price: Look for ₹ symbol in the card, but use targeted selectors first
      let price: number | null = null;
      let originalPrice: number | undefined;

      // Try targeted price selectors first (more reliable than scanning all text)
      const priceSelectors = [
        $card.find('div[class*="Nx9bqj"]').first().text(),  // Common Flipkart price class pattern
        $card.find('div[class*="hl05eU"] > div:first-child').first().text(),
      ];
      
      for (const pText of priceSelectors) {
        if (pText && pText.includes("₹")) {
          price = parseFlipkartPrice(pText);
          if (price) break;
        }
      }

      // Fallback: Scan text nodes for price patterns, but be careful
      if (!price) {
        // Only look at text that starts with ₹ to avoid picking up rating counts
        const allText = $card.text();
        const priceMatches = allText.match(/₹[\s]*[\d,]+/g);
        if (priceMatches && priceMatches.length > 0) {
          // Filter out prices that look like rating counts (small numbers)
          const validPrices = priceMatches
            .map(p => parseFlipkartPrice(p))
            .filter((p): p is number => p !== null && p >= 50); // Minimum ₹50 threshold
          
          if (validPrices.length > 0) {
            // Sort ascending — current price is usually the lowest
            validPrices.sort((a, b) => a - b);
            price = validPrices[0];
            if (validPrices.length > 1 && validPrices[validPrices.length - 1] > price) {
              originalPrice = validPrices[validPrices.length - 1];
            }
          }
        }
      }

      if (!price) continue;

      // Sanitize MSRP
      originalPrice = sanitizeOriginalPrice(price, originalPrice);

      // ── Image
      let imageUrl = $card.find("img").first().attr("src") || $card.find("img").first().attr("data-src") || "";
      if (!imageUrl.startsWith("http")) {
        imageUrl = getPlaceholderImage(query);
      }
      // Flipkart serves low-res thumbnails (128x128), upgrade to higher res
      if (imageUrl.includes("rukminim")) {
        imageUrl = imageUrl.replace(/\d+\/\d+/g, "416/416");
      }

      // ── Rating
      let rating = 4.0;
      const ratingEl = $card.find('div[class*="rating"], span[id*="rating"]');
      const ratingText = ratingEl.first().text();
      const ratingMatch = ratingText.match(/([\d.]+)/);
      if (ratingMatch) {
        const parsed = parseFloat(ratingMatch[1]);
        if (parsed >= 1 && parsed <= 5) rating = parsed;
      }

      // ── Review Count
      let reviewsCount = 0;
      const reviewTexts = $card.text().match(/(\d[\d,]*)\s*(?:Ratings?|Reviews?)/i);
      if (reviewTexts) {
        reviewsCount = parseInt(reviewTexts[1].replace(/,/g, ""), 10) || 0;
      }

      // ── Product ID from URL
      const pidMatch = href.match(/\/p\/(itm[a-zA-Z0-9]+)/);
      const pid = pidMatch?.[1] || "";

      results.push({
        id: simpleHash(`flipkart_${pid}_${results.length}`),
        title,
        price,
        originalPrice,
        platform: "Flipkart",
        url: fullUrl,
        imageUrl,
        rating,
        reviewsCount,
        specs: { pid },
      });
    }

    console.log(`[FlipkartScraper] Extracted ${results.length} valid products in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[FlipkartScraper] Scrape failed:`, error.message);
  }

  return {
    results,
    scrapedAt: new Date().toISOString(),
    source: "flipkart_scraper",
    responseTimeMs: Date.now() - startTime,
  };
}

// ─── Single Product Scraper (by URL) ────────────────────────────────

export async function scrapeFlipkartProduct(productUrl: string): Promise<ProductSearchResult | null> {
  try {
    console.log(`[FlipkartScraper] Fetching product: ${productUrl}`);

    const response = await fetch(productUrl, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Title — Flipkart uses <h1> or specific spans for product title
    const title = (
      $("h1 span").first().text().trim() ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() || ""
    );
    if (!title || !isValidTitle(title)) return null;

    // Price — use targeted selectors first
    let price: number | null = null;
    let originalPrice: number | undefined;

    // Try meta tag price first
    const metaPrice = $('meta[property="product:price:amount"]').attr("content");
    if (metaPrice) {
      price = parseFlipkartPrice(metaPrice);
    }

    // Fallback to text scanning
    if (!price) {
      const allText = $("body").text();
      const priceMatches = allText.match(/₹[\s]*[\d,]+/g);
      if (priceMatches) {
        const validPrices = priceMatches
          .map(p => parseFlipkartPrice(p))
          .filter((p): p is number => p !== null && p >= 50);
        
        if (validPrices.length > 0) {
          validPrices.sort((a, b) => a - b);
          price = validPrices[0];
          if (validPrices.length > 1 && validPrices[validPrices.length - 1] > price) {
            originalPrice = validPrices[validPrices.length - 1];
          }
        }
      }
    }
    if (!price) return null;

    // Sanitize MSRP
    originalPrice = sanitizeOriginalPrice(price, originalPrice);

    // Image
    let imageUrl = $('meta[property="og:image"]').attr("content") || 
                   $("img[loading]").first().attr("src") || "";
    if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(title);

    // Rating
    let rating = 4.0;
    const ratingText = $('div[class*="rating"]').first().text();
    const ratingMatch = ratingText.match(/([\d.]+)/);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);

    // Product ID
    const pidMatch = productUrl.match(/\/p\/(itm[a-zA-Z0-9]+)/);
    const pid = pidMatch?.[1] || "";

    return {
      id: simpleHash(`flipkart_product_${pid || title}`),
      title,
      price,
      originalPrice,
      platform: "Flipkart",
      url: productUrl,
      imageUrl,
      rating,
      reviewsCount: 0,
      specs: { pid },
    };
  } catch (error: any) {
    console.error(`[FlipkartScraper] Product scrape failed:`, error.message);
    return null;
  }
}
