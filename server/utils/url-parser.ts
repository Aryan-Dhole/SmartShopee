/**
 * Advanced URL parser for Indian e-commerce product links.
 * Extracts product identifiers and keywords from Amazon, Flipkart, and other platforms.
 */

export interface ParsedProductURL {
  platform: string;
  productId: string | null;
  keywords: string;
  originalUrl: string;
  isValid: boolean;
}

/**
 * Detect if a string is a URL
 */
export function isProductUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

/**
 * Parse an e-commerce product URL and extract useful metadata
 */
export function parseProductUrl(url: string): ParsedProductURL {
  const result: ParsedProductURL = {
    platform: 'Unknown',
    productId: null,
    keywords: '',
    originalUrl: url,
    isValid: false,
  };

  try {
    const decoded = decodeURIComponent(url);
    const lower = decoded.toLowerCase();

    // ── Amazon India / Amazon.com ──
    if (lower.includes('amazon.in') || lower.includes('amazon.com')) {
      result.platform = 'Amazon';

      // Standard product page: /product-name/dp/ASIN
      const dpMatch = decoded.match(/\/([^\/]+)\/dp\/([A-Z0-9]{10})/i);
      if (dpMatch) {
        result.productId = dpMatch[2];
        result.keywords = dpMatch[1].replace(/[-_+]+/g, ' ').trim();
        result.isValid = true;
        return result;
      }

      // /gp/product/ASIN format
      const gpMatch = decoded.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (gpMatch) {
        result.productId = gpMatch[1];
        result.keywords = 'Amazon Product';
        result.isValid = true;
        return result;
      }

      // /dp/ASIN (short format)
      const shortDp = decoded.match(/\/dp\/([A-Z0-9]{10})/i);
      if (shortDp) {
        result.productId = shortDp[1];
        result.keywords = 'Amazon Product';
        result.isValid = true;
        return result;
      }

      // Affiliate/shortened links with /product/ path
      const productMatch = decoded.match(/\/product\/([A-Z0-9]{10})/i);
      if (productMatch) {
        result.productId = productMatch[1];
        result.keywords = 'Amazon Product';
        result.isValid = true;
        return result;
      }

      result.keywords = 'Amazon Product';
      result.isValid = true;
      return result;
    }

    // ── Flipkart ──
    if (lower.includes('flipkart.com')) {
      result.platform = 'Flipkart';

      // Standard: /product-name/p/itm...
      const fkMatch = decoded.match(/\/([^\/]+)\/p\/([a-zA-Z0-9]+)/i);
      if (fkMatch) {
        result.productId = fkMatch[2];
        result.keywords = fkMatch[1].replace(/[-_+]+/g, ' ').trim();
        result.isValid = true;
        return result;
      }

      // dl.flipkart.com shortened links
      const dlMatch = decoded.match(/pid=([a-zA-Z0-9]+)/i);
      if (dlMatch) {
        result.productId = dlMatch[1];
        result.keywords = 'Flipkart Product';
        result.isValid = true;
        return result;
      }

      result.keywords = 'Flipkart Product';
      result.isValid = true;
      return result;
    }

    // ── Myntra ──
    if (lower.includes('myntra.com')) {
      result.platform = 'Myntra';
      const myntraMatch = decoded.match(/\/([^\/]+)\/(\d+)\/buy/i) || decoded.match(/\/(\d+)$/);
      if (myntraMatch) {
        result.productId = myntraMatch[2] || myntraMatch[1];
        result.keywords = myntraMatch[1]?.replace(/[-_+]+/g, ' ') || 'Myntra Product';
        result.isValid = true;
        return result;
      }
      result.isValid = true;
      return result;
    }

    // ── Croma ──
    if (lower.includes('croma.com')) {
      result.platform = 'Croma';
      const cromaMatch = decoded.match(/\/([^\/]+)\/p\/(\d+)/i);
      if (cromaMatch) {
        result.productId = cromaMatch[2];
        result.keywords = cromaMatch[1].replace(/[-_+]+/g, ' ').trim();
        result.isValid = true;
        return result;
      }
      result.isValid = true;
      return result;
    }

    // ── Snapdeal ──
    if (lower.includes('snapdeal.com')) {
      result.platform = 'Snapdeal';
      const snapMatch = decoded.match(/\/product\/([^\/]+)\/(\d+)/i);
      if (snapMatch) {
        result.productId = snapMatch[2];
        result.keywords = snapMatch[1].replace(/[-_+]+/g, ' ').trim();
        result.isValid = true;
        return result;
      }
      result.isValid = true;
      return result;
    }

    // ── Generic URL ──
    // Try to extract meaningful path segments as keywords
    try {
      const urlObj = new URL(decoded);
      result.platform = urlObj.hostname.replace('www.', '').split('.')[0];
      result.platform = result.platform.charAt(0).toUpperCase() + result.platform.slice(1);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        result.keywords = pathParts[0].replace(/[-_+]+/g, ' ').trim();
      }
      result.isValid = true;
    } catch {
      // Not a valid URL
    }

    return result;
  } catch (err) {
    console.error('[URL Parser] Failed to parse URL:', err);
    return result;
  }
}
