import "dotenv/config";
import express from "express";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import {
  performProductSearch,
  retrieveSmarterAlternatives,
  summarizeAiReviews,
  compareProducts,
  handleChatMessage,
  fetchRealMerchantDeals,
} from "./server/gemini-service";
import { startPriceTracker } from "./server/price-tracker";

// ─── Rate Limiter (Simple Token Bucket) ─────────────────────────────

const rateLimitMap = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT = { maxTokens: 30, refillRate: 10, windowMs: 60_000 };

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let bucket = rateLimitMap.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT.maxTokens, lastRefill: now };
    rateLimitMap.set(ip, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed > RATE_LIMIT.windowMs) {
    bucket.tokens = RATE_LIMIT.maxTokens;
    bucket.lastRefill = now;
  } else {
    const refill = Math.floor((elapsed / RATE_LIMIT.windowMs) * RATE_LIMIT.refillRate);
    bucket.tokens = Math.min(RATE_LIMIT.maxTokens, bucket.tokens + refill);
    if (refill > 0) bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return res.status(429).json({ success: false, error: "Too many requests. Please wait a moment.", timestamp: new Date().toISOString() });
  }

  bucket.tokens--;
  next();
}

// ─── Structured Logger ──────────────────────────────────────────────

function log(level: string, component: string, message: string, meta?: Record<string, any>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...meta,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function requestLogger(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    log("info", "http", `${req.method} ${req.path}`, {
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip || req.socket.remoteAddress,
    });
  });
  next();
}

// ─── Input Sanitization ─────────────────────────────────────────────

function sanitizeString(input: string, maxLength: number = 500): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .trim()
    .substring(0, maxLength);
}

// ─── API Response Helpers ───────────────────────────────────────────

function apiSuccess(res: express.Response, data: any, status: number = 200) {
  return res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

function apiError(res: express.Response, error: string, status: number = 500) {
  return res.status(status).json({
    success: false,
    error,
    timestamp: new Date().toISOString(),
  });
}

// ─── Server Setup ───────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const isProd = process.env.NODE_ENV === "production";

  // ── Security & Performance Middleware ────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: isProd ? undefined : false, // Disable CSP in dev (Vite needs inline scripts)
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: isProd
      ? process.env.APP_URL || true
      : true, // Allow all in development
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86400, // 24h preflight cache
  }));

  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  // Apply rate limiting to API routes only
  app.use("/api", rateLimit);

  // ── API Endpoints ─────────────────────────────────────────────

  // Search products
  app.get("/api/search", async (req, res) => {
    try {
      const query = sanitizeString(String(req.query.q || ""));
      if (!query) {
        return apiError(res, "Missing query parameter 'q'.", 400);
      }
      if (query.length > 500) {
        return apiError(res, "Query too long. Max 500 characters.", 400);
      }
      log("info", "search", `Query: "${query}"`);
      const results = await performProductSearch(query);
      return res.json({ results });
    } catch (err: any) {
      log("error", "search", err.message);
      return apiError(res, err.message || "Failed to search products.");
    }
  });

  // Get smarter alternatives
  app.post("/api/alternatives", async (req, res) => {
    try {
      const { productName, price, platform } = req.body;
      if (!productName || !price || !platform) {
        return apiError(res, "Missing required fields: productName, price, platform.", 400);
      }
      log("info", "alternatives", `Product: "${sanitizeString(productName, 100)}"`);
      const alternatives = await retrieveSmarterAlternatives(
        sanitizeString(productName, 200),
        Number(price),
        sanitizeString(platform, 50)
      );
      return res.json({ alternatives });
    } catch (err: any) {
      log("error", "alternatives", err.message);
      return apiError(res, err.message || "Failed to get alternatives.");
    }
  });

  // Get real merchant deals for a product
  app.post("/api/deals", async (req, res) => {
    try {
      const { productName, currentPrice } = req.body;
      if (!productName || !currentPrice) {
        return apiError(res, "Missing required fields: productName, currentPrice.", 400);
      }
      log("info", "deals", `Finding deals for: "${sanitizeString(productName, 100)}"`);
      const deals = await fetchRealMerchantDeals(
        sanitizeString(productName, 200),
        Number(currentPrice)
      );
      return res.json({ deals });
    } catch (err: any) {
      log("error", "deals", err.message);
      return apiError(res, err.message || "Failed to get real deals.");
    }
  });

  // AI review synthesis
  app.post("/api/reviews", async (req, res) => {
    try {
      const { productName, platform } = req.body;
      if (!productName || !platform) {
        return apiError(res, "Missing required fields: productName, platform.", 400);
      }
      log("info", "reviews", `Product: "${sanitizeString(productName, 100)}" on ${platform}`);
      const summary = await summarizeAiReviews(
        sanitizeString(productName, 200),
        sanitizeString(platform, 50)
      );
      return res.json({ summary });
    } catch (err: any) {
      log("error", "reviews", err.message);
      return apiError(res, err.message || "Failed to summarize reviews.");
    }
  });

  // AI head-to-head comparison
  app.post("/api/compare", async (req, res) => {
    try {
      const { productA, productB } = req.body;
      if (!productA?.title || !productB?.title) {
        return apiError(res, "Missing productA or productB with title field.", 400);
      }
      log("info", "compare", `"${productA.title}" vs "${productB.title}"`);
      const comparison = await compareProducts(productA, productB);
      return res.json({ comparison });
    } catch (err: any) {
      log("error", "compare", err.message);
      return apiError(res, err.message || "Failed to compare products.");
    }
  });

  // AI shopping chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message || typeof message !== "string") {
        return apiError(res, "Missing 'message' string in body.", 400);
      }
      if (message.length > 1000) {
        return apiError(res, "Message too long. Max 1000 characters.", 400);
      }
      log("info", "chat", `Message: "${message.substring(0, 80)}..."`);
      const result = await handleChatMessage(sanitizeString(message, 1000), context);
      return res.json(result);
    } catch (err: any) {
      log("error", "chat", err.message);
      return apiError(res, err.message || "Failed to process chat.");
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      geminiKeySet: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
      version: "2.0.0",
      features: {
        scrapers: ["amazon_india", "flipkart"],
        ai: ["gemini_search_grounding", "review_synthesis", "comparison", "chat"],
      },
    });
  });

  // ── Global Error Handler ──────────────────────────────────────

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    log("error", "global", `Unhandled error: ${err.message}`, { stack: err.stack });
    return apiError(res, "An unexpected error occurred. Please try again.", 500);
  });

  // ── Frontend Serving ──────────────────────────────────────────

  if (!isProd) {
    log("info", "server", "Starting in development mode with Vite HMR...");
    const viteOnServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteOnServer.middlewares);
  } else {
    log("info", "server", "Starting in production mode. Serving static assets.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // SPA fallback — serve index.html for all non-API routes
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  // ── Start ─────────────────────────────────────────────────────

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  ╔═══════════════════════════════════════════╗`);
    console.log(`  ║  PriceWise Server v2.0                    ║`);
    console.log(`  ║  http://localhost:${PORT}                    ║`);
    console.log(`  ║  Gemini API: ${process.env.GEMINI_API_KEY ? "✓ Configured" : "✗ Not Set   "}        ║`);
    console.log(`  ║  Scrapers:  Amazon India, Flipkart         ║`);
    console.log(`  ║  Mode:      ${isProd ? "Production " : "Development"}              ║`);
    console.log(`  ╚═══════════════════════════════════════════╝\n`);

    // Initialize background cron jobs
    startPriceTracker(1000 * 60 * 60 * 24); // Run daily for prototype
  });

  // ── Graceful Shutdown ─────────────────────────────────────────

  const shutdown = (signal: string) => {
    log("info", "server", `Received ${signal}. Graceful shutdown starting...`);
    server.close(() => {
      log("info", "server", "HTTP server closed.");
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => {
      log("error", "server", "Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    log("error", "server", `Uncaught exception: ${err.message}`, { stack: err.stack });
  });
  process.on("unhandledRejection", (reason) => {
    log("error", "server", `Unhandled rejection: ${reason}`);
  });
}

startServer().catch((error) => {
  console.error("[FATAL] Server failed to start:", error);
  process.exit(1);
});
