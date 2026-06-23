/**
 * Amazon India Scraper
 * Fetches real product data from Amazon.in search results and product pages.
 * Uses direct HTTP requests + cheerio for HTML parsing.
 */
import * as cheerio from "cheerio";
import { ProductSearchResult } from "../types";
import { simpleHash, getPlaceholderImage } from "../utils/price-utils";

// ─── Constants ──────────────────────────────────────────────────────

const AMAZON_BASE = "https://www.amazon.in";
const SEARCH_URL = `${AMAZON_BASE}/s`;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
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
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };
}

// ─── Price Parser ───────────────────────────────────────────────────

function parseAmazonPrice(text: string): number | null {
  if (!text) return null;
  // Remove currency symbol, commas, spaces
  const cleaned = text.replace(/[₹,\s]/g, "").trim();
  // Extract the first valid number (whole part)
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (price > 0 && price < 50_000_000) return Math.round(price);
  }
  return null;
}

// ─── Search Scraper ─────────────────────────────────────────────────

export interface AmazonScraperResult {
  results: ProductSearchResult[];
  scrapedAt: string;
  source: "amazon_scraper";
  responseTimeMs: number;
}

export async function scrapeAmazonSearch(query: string): Promise<AmazonScraperResult> {
  const startTime = Date.now();
  const results: ProductSearchResult[] = [];

  try {
    const url = `${SEARCH_URL}?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;
    console.log(`[AmazonScraper] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[AmazonScraper] HTTP ${response.status} for query: "${query}"`);
      return { results: [], scrapedAt: new Date().toISOString(), source: "amazon_scraper", responseTimeMs: Date.now() - startTime };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Amazon search results are in div[data-component-type="s-search-result"]
    const searchResults = $('div[data-component-type="s-search-result"]');
    console.log(`[AmazonScraper] Found ${searchResults.length} raw result cards`);

    searchResults.each((index, element) => {
      if (results.length >= 6) return false; // Limit to 6 results

      const $el = $(element);
      const asin = $el.attr("data-asin");
      if (!asin) return;

      // ── Title
      const titleEl = $el.find("h2 a span, h2 span.a-text-normal").first();
      const title = titleEl.text().trim();
      if (!title || title.length < 3) return;

      // ── Price (current)
      const priceWhole = $el.find(".a-price:not(.a-text-price) .a-price-whole").first().text();
      const priceFraction = $el.find(".a-price:not(.a-text-price) .a-price-fraction").first().text();
      let price = parseAmazonPrice(priceWhole);
      if (!price) {
        // Try alternate price selectors
        const altPrice = $el.find(".a-price .a-offscreen").first().text();
        price = parseAmazonPrice(altPrice);
      }
      if (!price) return;

      // ── Original Price (strikethrough MRP)
      let originalPrice: number | undefined;
      const mrpText = $el.find(".a-price.a-text-price .a-offscreen").first().text();
      const mrpParsed = parseAmazonPrice(mrpText);
      if (mrpParsed && mrpParsed > price) {
        originalPrice = mrpParsed;
      }

      // ── Product URL
      const linkEl = $el.find("h2 a, a.a-link-normal.s-no-outline").first();
      let productUrl = linkEl.attr("href") || "";
      if (productUrl && !productUrl.startsWith("http")) {
        productUrl = `${AMAZON_BASE}${productUrl}`;
      }
      // Clean tracking params
      if (productUrl.includes("/dp/")) {
        const dpMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/i);
        if (dpMatch) {
          productUrl = `${AMAZON_BASE}/dp/${dpMatch[1]}`;
        }
      }

      // ── Image
      let imageUrl = $el.find("img.s-image").first().attr("src") || "";
      if (!imageUrl.startsWith("http")) {
        imageUrl = getPlaceholderImage(query);
      }

      // ── Rating
      let rating = 4.0;
      const ratingText = $el.find(".a-icon-star-small .a-icon-alt, i.a-icon-star-small").first().text();
      const ratingMatch = ratingText.match(/([\d.]+)\s*out/);
      if (ratingMatch) {
        rating = Math.min(5, Math.max(0, parseFloat(ratingMatch[1])));
      }

      // ── Review Count
      let reviewsCount = 0;
      const reviewLink = $el.find('a[href*="#customerReviews"], span.a-size-base.s-underline-text').first().text();
      const reviewMatch = reviewLink.replace(/,/g, "").match(/(\d+)/);
      if (reviewMatch) {
        reviewsCount = parseInt(reviewMatch[1], 10);
      }

      results.push({
        id: simpleHash(`amazon_${asin}_${index}`),
        title,
        price,
        originalPrice,
        platform: "Amazon India",
        url: productUrl || `${AMAZON_BASE}/dp/${asin}`,
        imageUrl,
        rating,
        reviewsCount,
        specs: { asin },
      });
    });

    console.log(`[AmazonScraper] Extracted ${results.length} valid products in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[AmazonScraper] Scrape failed:`, error.message);
  }

  return {
    results,
    scrapedAt: new Date().toISOString(),
    source: "amazon_scraper",
    responseTimeMs: Date.now() - startTime,
  };
}

// ─── Single Product Scraper (by URL) ────────────────────────────────

export async function scrapeAmazonProduct(productUrl: string): Promise<ProductSearchResult | null> {
  try {
    console.log(`[AmazonScraper] Fetching product: ${productUrl}`);

    const response = await fetch(productUrl, {
      headers: getHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Title
    const title = (
      $("#productTitle").text().trim() ||
      $("h1#title span").text().trim() ||
      $("h1 span.product-title-word-break").text().trim()
    );
    if (!title) return null;

    // Price
    const priceText = (
      $(".a-price .a-offscreen").first().text() ||
      $("#priceblock_dealprice").text() ||
      $("#priceblock_ourprice").text() ||
      $(".a-price-whole").first().text()
    );
    const price = parseAmazonPrice(priceText);
    if (!price) return null;

    // Original Price
    let originalPrice: number | undefined;
    const mrpText = (
      $(".a-price.a-text-price .a-offscreen").first().text() ||
      $(".basisPrice .a-offscreen").first().text() ||
      $(".priceBlockStrikePriceString").text()
    );
    const mrpParsed = parseAmazonPrice(mrpText);
    if (mrpParsed && mrpParsed > price) originalPrice = mrpParsed;

    // Image
    let imageUrl = (
      $("#imgTagWrapperId img, #landingImage, #imgBlkFront").first().attr("src") || ""
    );
    if (!imageUrl.startsWith("http")) {
      // Try data-old-hires attribute
      imageUrl = $("#imgTagWrapperId img, #landingImage").first().attr("data-old-hires") || "";
    }
    if (!imageUrl.startsWith("http")) imageUrl = getPlaceholderImage(title);

    // Rating
    let rating = 4.0;
    const ratingText = $(".a-icon-star .a-icon-alt, #acrPopover .a-icon-alt").first().text();
    const ratingMatch = ratingText.match(/([\d.]+)/);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);

    // Review count
    let reviewsCount = 0;
    const reviewText = (
      $("#acrCustomerReviewText").text() ||
      $('[data-hook="total-review-count"]').text()
    );
    const reviewMatch = reviewText.replace(/,/g, "").match(/(\d+)/);
    if (reviewMatch) reviewsCount = parseInt(reviewMatch[1], 10);

    // ASIN
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/i) ||
                       productUrl.match(/\/product\/([A-Z0-9]{10})/i);
    const asin = asinMatch?.[1] || "";

    return {
      id: simpleHash(`amazon_product_${asin || title}`),
      title,
      price,
      originalPrice,
      platform: "Amazon India",
      url: productUrl,
      imageUrl,
      rating,
      reviewsCount,
      specs: { asin },
    };
  } catch (error: any) {
    console.error(`[AmazonScraper] Product scrape failed:`, error.message);
    return null;
  }
}
