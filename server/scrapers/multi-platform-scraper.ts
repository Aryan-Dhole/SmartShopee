/**
 * Multi-Platform Scraper Orchestrator
 * Runs all scrapers in parallel, deduplicates and merges results.
 * Falls back to Gemini Search Grounding when scrapers return insufficient data.
 */
import { ProductSearchResult } from "../types";
import { scrapeAmazonSearch, scrapeAmazonProduct } from "./amazon-scraper";
import { scrapeFlipkartSearch, scrapeFlipkartProduct } from "./flipkart-scraper";
import { isProductUrl, parseProductUrl } from "../utils/url-parser";

// ─── Types ──────────────────────────────────────────────────────────

export interface ScrapeMetadata {
  sources: {
    name: string;
    resultCount: number;
    responseTimeMs: number;
    status: "success" | "partial" | "failed";
  }[];
  totalResults: number;
  scrapedAt: string;
  totalTimeMs: number;
}

export interface MultiScrapeResult {
  results: ProductSearchResult[];
  metadata: ScrapeMetadata;
}

// ─── Deduplication ──────────────────────────────────────────────────

function deduplicateResults(results: ProductSearchResult[]): ProductSearchResult[] {
  const seen = new Map<string, ProductSearchResult>();

  for (const product of results) {
    // Generate a dedup key from normalized title + platform
    const normalizedTitle = product.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 60);
    const key = `${product.platform.toLowerCase()}_${normalizedTitle}`;

    if (!seen.has(key)) {
      seen.set(key, product);
    } else {
      // Keep the one with more data (reviews, original price, etc.)
      const existing = seen.get(key)!;
      if (
        (product.reviewsCount > existing.reviewsCount) ||
        (product.originalPrice && !existing.originalPrice) ||
        (product.url.includes("/dp/") && !existing.url.includes("/dp/"))
      ) {
        seen.set(key, product);
      }
    }
  }

  return Array.from(seen.values());
}

// ─── URL-based Scraping ─────────────────────────────────────────────

async function scrapeByUrl(url: string): Promise<ProductSearchResult | null> {
  const parsed = parseProductUrl(url);

  if (parsed.platform === "Amazon") {
    return scrapeAmazonProduct(url);
  }

  if (parsed.platform === "Flipkart") {
    return scrapeFlipkartProduct(url);
  }

  // Unknown platform — return null, let Gemini handle it
  return null;
}

// ─── Main Orchestrator ──────────────────────────────────────────────

export async function scrapeAllPlatforms(query: string): Promise<MultiScrapeResult> {
  const startTime = Date.now();
  const allResults: ProductSearchResult[] = [];
  const sourcesMeta: ScrapeMetadata["sources"] = [];

  // Check if query is a URL
  if (isProductUrl(query)) {
    console.log(`[MultiScraper] Detected URL input, scraping product directly`);
    const directResult = await scrapeByUrl(query);

    if (directResult) {
      allResults.push(directResult);
      sourcesMeta.push({
        name: `${directResult.platform} (direct)`,
        resultCount: 1,
        responseTimeMs: Date.now() - startTime,
        status: "success",
      });

      // Also search for this product on other platforms using extracted keywords
      const parsed = parseProductUrl(query);
      const keywords = parsed.keywords || directResult.title.split(" ").slice(0, 5).join(" ");

      if (keywords) {
        const crossPlatformResults = await scrapeSearchQuery(keywords, sourcesMeta);
        // Filter out results from the same platform to avoid duplicates
        const otherPlatformResults = crossPlatformResults.filter(
          (r) => r.platform !== directResult.platform
        );
        allResults.push(...otherPlatformResults);
      }
    }
  } else {
    // Regular search query — scrape all platforms
    const scraped = await scrapeSearchQuery(query, sourcesMeta);
    allResults.push(...scraped);
  }

  // Deduplicate
  const deduplicated = deduplicateResults(allResults);

  // Sort by price (lowest first)
  deduplicated.sort((a, b) => a.price - b.price);

  return {
    results: deduplicated,
    metadata: {
      sources: sourcesMeta,
      totalResults: deduplicated.length,
      scrapedAt: new Date().toISOString(),
      totalTimeMs: Date.now() - startTime,
    },
  };
}

// ─── Search Query Scraper ───────────────────────────────────────────

async function scrapeSearchQuery(
  query: string,
  sourcesMeta: ScrapeMetadata["sources"]
): Promise<ProductSearchResult[]> {
  const allResults: ProductSearchResult[] = [];

  // Run scrapers in parallel with individual timeout protection
  const [amazonResult, flipkartResult] = await Promise.allSettled([
    scrapeAmazonSearch(query),
    scrapeFlipkartSearch(query),
  ]);

  // Process Amazon results
  if (amazonResult.status === "fulfilled") {
    const { results, responseTimeMs } = amazonResult.value;
    allResults.push(...results);
    sourcesMeta.push({
      name: "Amazon India",
      resultCount: results.length,
      responseTimeMs,
      status: results.length > 0 ? "success" : "failed",
    });
  } else {
    console.error("[MultiScraper] Amazon scraper rejected:", amazonResult.reason);
    sourcesMeta.push({
      name: "Amazon India",
      resultCount: 0,
      responseTimeMs: 0,
      status: "failed",
    });
  }

  // Process Flipkart results
  if (flipkartResult.status === "fulfilled") {
    const { results, responseTimeMs } = flipkartResult.value;
    allResults.push(...results);
    sourcesMeta.push({
      name: "Flipkart",
      resultCount: results.length,
      responseTimeMs,
      status: results.length > 0 ? "success" : "failed",
    });
  } else {
    console.error("[MultiScraper] Flipkart scraper rejected:", flipkartResult.reason);
    sourcesMeta.push({
      name: "Flipkart",
      resultCount: 0,
      responseTimeMs: 0,
      status: "failed",
    });
  }

  return allResults;
}

// ─── Deal Scraper (for tracked products) ────────────────────────────

export async function scrapeDealsForProduct(
  productName: string,
  _currentPrice: number
): Promise<{ deals: any[]; metadata: ScrapeMetadata }> {
  const startTime = Date.now();
  const sourcesMeta: ScrapeMetadata["sources"] = [];

  // Search for the product on both platforms
  const [amazonResult, flipkartResult] = await Promise.allSettled([
    scrapeAmazonSearch(productName),
    scrapeFlipkartSearch(productName),
  ]);

  const deals: any[] = [];

  // Convert search results into deal format
  const processResults = (results: ProductSearchResult[], platform: string) => {
    // Take the best match (first result, which is usually most relevant)
    const bestMatch = results[0];
    if (bestMatch) {
      deals.push({
        platform: bestMatch.platform,
        price: bestMatch.price,
        originalPrice: bestMatch.originalPrice || null,
        url: bestMatch.url,
        deliveryText: "Standard Delivery",
        stockStatus: "in_stock",
        isLowest: false,
      });
    }
  };

  if (amazonResult.status === "fulfilled" && amazonResult.value.results.length > 0) {
    processResults(amazonResult.value.results, "Amazon India");
    sourcesMeta.push({
      name: "Amazon India",
      resultCount: amazonResult.value.results.length,
      responseTimeMs: amazonResult.value.responseTimeMs,
      status: "success",
    });
  }

  if (flipkartResult.status === "fulfilled" && flipkartResult.value.results.length > 0) {
    processResults(flipkartResult.value.results, "Flipkart");
    sourcesMeta.push({
      name: "Flipkart",
      resultCount: flipkartResult.value.results.length,
      responseTimeMs: flipkartResult.value.responseTimeMs,
      status: "success",
    });
  }

  // Sort deals by price and mark lowest
  if (deals.length > 0) {
    deals.sort((a, b) => a.price - b.price);
    deals[0].isLowest = true;
  }

  return {
    deals,
    metadata: {
      sources: sourcesMeta,
      totalResults: deals.length,
      scrapedAt: new Date().toISOString(),
      totalTimeMs: Date.now() - startTime,
    },
  };
}
