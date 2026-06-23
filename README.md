# 🔍 PriceWise — Real-time Product Search, Price Comparison & AI Shopping Companion

PriceWise is a premium, real-time product search, price tracking, and comparison web application. It combines high-speed, multi-platform web scraping with state-of-the-art **Gemini 2.5 Flash Search Grounding** fallbacks to deliver instant pricing, review analysis, and product comparisons across major Indian e-commerce platforms.

---

## ✨ Features

- 🔍 **Real-Time Cross-Platform Search**: Instantly searches across Indian retail giants including **Amazon India**, **Flipkart**, **Reliance Digital**, **Croma**, **Vijay Sales**, **Tata CLiQ**, **Meesho**, **JioMart**, and **Myntra**.
- 🤖 **Hybrid Scraping Engine**: Orchestrates parallel requests using **Cheerio** HTML parsers. Automatically detects dynamic selectors or platform blocks (such as 403 errors) and fails over to **Gemini 2.5 Flash with Google Search Grounding** to query active live pricing and verified merchant deals.
- 📈 **Interactive Price History Charts**: Tracks and visualizes historical price fluctuations using modern, responsive charts powered by **Recharts**.
- 🔔 **Target Price Alerts**: Watchlist products and set custom price triggers. A background tracker runs periodically to alert users when a product drops below their target.
- 💬 **AI Shopping Chat Companion**: Interactive sidebar assistant to discuss product specifications, compare options, and ask for shopping advice based on live search results.
- ⚖️ **Side-by-Side Product Comparison**: Compare two products with detailed specs, pricing differences, pros/cons, and a custom **AI Deal Score** (Good/Fair/Bad deal gauge).
- 🧠 **Smarter Alternatives Finder**: Identifies cheaper, refurbished, or higher-rated alternative recommendations on the fly.
- 🔓 **Firebase Authentication & Cloud Datastore**: Complete sign-in/sign-up authentication and persistent watchlist tracking sync using Google Firebase and Cloud Firestore.

---

## 🛠️ Technology Stack

### Frontend (Client SPA)
* **Core**: React 19, TypeScript
* **Routing**: React Router v7
* **Styling**: Tailwind CSS v4, Motion (Framer Motion) for premium micro-animations and transitions
* **Charts**: Recharts
* **Icons**: Lucide React
* **Database Sync**: Firebase Auth, Firestore SDK

### Backend (Server)
* **Core**: Node.js, Express, tsx
* **Scraping**: Cheerio
* **Security & Performance**: Helmet, Compression, Cors, and Custom Rate Limiter (Token Bucket algorithm)
* **Bundler/Compiler**: Esbuild

### Artificial Intelligence
* **SDK**: `@google/genai`
* **Model**: `gemini-2.5-flash`
* **Features Used**: Search Grounding (`googleSearch` tool), Structured JSON outputs, Chat Sessions, and System Instructions.

---

## 📁 Repository Structure

```
pricewise/
├── assets/                          # Static assets and media files
├── server/                          # Backend server source code
│   ├── scrapers/                    # Platform scraping logic
│   │   ├── amazon-scraper.ts        # Cheerio scraper for Amazon.in
│   │   ├── flipkart-scraper.ts      # Cheerio scraper for Flipkart.com
│   │   └── multi-platform-scraper.ts# Orchestrator & fallback runner
│   ├── utils/                       # Server-side parser utilities
│   │   ├── price-utils.ts           # Hash helpers, image fallbacks
│   │   └── url-parser.ts            # E-commerce URL normalizer
│   ├── gemini-service.ts            # Gemini 2.5 Flash SDK integrations
│   ├── price-tracker.ts             # Background price monitoring cron loop
│   └── types.ts                     # Common TypeScript interfaces
├── src/                             # React Frontend source code
│   ├── components/                  # Premium reusable components (charts, chat, modals, etc.)
│   ├── contexts/                    # Global state providers (Auth, Watchlist)
│   ├── hooks/                       # Custom React hooks (useAuth, etc.)
│   ├── pages/                       # Page-level route views (Landing, Search, Dashboard, etc.)
│   ├── services/                    # API connection services
│   ├── utils/                       # Frontend helper utilities
│   ├── firebase.ts                  # Firebase SDK instance initialization
│   ├── firebase-service.ts          # Firestore read/write helper operations
│   ├── router.tsx                   # React Router v7 configuration mapping
│   ├── main.tsx                     # React application root mount entrypoint
│   └── index.css                    # Tailwind CSS v4 entrypoint
├── firebase-applet-config.json      # Client-side Firebase credentials
├── package.json                     # Node script definitions and packages
├── tsconfig.json                    # TS compiler configurations
├── server.ts                        # Main server entrypoint (Express + Vite HMR)
├── vite.config.ts                   # Vite bundler configurations
└── .env                             # Environment secrets (ignored by Git)
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)
* A Google AI Studio API Key (for Gemini APIs)
* A Firebase Project (for Auth & Firestore)

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Gemini API Key (server-side operations)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Exposed key for client-side Gemini requests (if applicable)
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Deployment app URL
APP_URL="http://localhost:3000"
```

### 3. Configure Firebase
Update the `firebase-applet-config.json` in the root folder with your Firebase app configuration values:
```json
{
  "projectId": "YOUR_FIREBASE_PROJECT_ID",
  "appId": "YOUR_FIREBASE_APP_ID",
  "apiKey": "YOUR_FIREBASE_API_KEY",
  "authDomain": "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "YOUR_FIREBASE_PROJECT_ID.firebasestorage.app",
  "messagingSenderId": "YOUR_SENDER_ID",
  "measurementId": ""
}
```

### 4. Database Setup
Create a Cloud Firestore database in your Firebase Console and make sure to create the following collection structure:
* `trackedProducts`: Watchlist document registry.
* `userPreferences`: Custom user dashboard preferences.
* `searchHistory`: Subcollection to track search histories per user.

Make sure Firestore Rules allow reads and writes for authenticated users on documents belonging to their `userId`.

---

## 💻 Running the App

### Development Mode (with Vite HMR)
To start the developer environment with frontend hot module replacement and active express backend server simultaneously:
```bash
npm run dev
```
The application will boot up at **`http://localhost:3000`**.

### Production Build & Launch
To compile and build production assets:
```bash
# Build Vite frontend static files and compile server.ts via esbuild
npm run build

# Start the compiled server
npm run start
```

---

## 🧠 Architectural Highlights

### 1. Hybrid Search Scraper Flowchart
```
                 [Search Query/URL Input]
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [Amazon/Flipkart Scraper]   [Gemini Search Grounding]
   (Parallel Cheerio Scraping)   (Croma, Reliance, Vijay, etc.)
             │                           │
             └─────────────┬─────────────┘
                           ▼
               [Deduplicate & Validate]
              (Filters bad URLs & prices)
                           ▼
                  [Results Rendered]
```
If Cheerio hits a rate limit or anti-scraping blocks, the system relies on the **Gemini 2.5 Flash Search Grounding** model which queries live search engines to return authentic product details and verified merchant prices.

### 2. Price History and Background Tracker
* Product watchlists are monitored on a daily basis (configurable in `server.ts`).
* The background cron loop reads Firestore documents, issues real-time scraping checks for lowest prices, appends the results to the product's `priceHistory` array, and logs an alert if the value falls below the target price.

### 3. Security Hardening
* Extensively uses `helmet` for HTTP response header security checks.
* Uses standard `compression` middleware to optimize payloads.
* Built-in token-bucket rate limiting (`30 max tokens`, refills 10 tokens/min) to prevent abuse of the backend and Gemini APIs.
* Full sanitization of search keywords and inputs to safeguard against CSS injection and query manipulation.
