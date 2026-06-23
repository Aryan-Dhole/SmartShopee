import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../src/firebase";
import { fetchRealMerchantDeals } from "./gemini-service";

const COLLECTION_NAME = "trackedProducts";

export function startPriceTracker(intervalMs: number = 1000 * 60 * 60) {
  console.log(`[PriceTracker] Initialized. Running every ${Math.round(intervalMs / 60000)} minutes.`);

  const runScan = async () => {
    console.log(`[PriceTracker] Starting background scan...`);
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (snapshot.empty) {
        console.log(`[PriceTracker] No products currently tracked.`);
        return;
      }

      console.log(`[PriceTracker] Found ${snapshot.size} tracked products. Updating prices...`);

      for (const productDoc of snapshot.docs) {
        const data = productDoc.data();
        const productName = data.productName;
        const currentPrice = data.currentPrice;
        const targetPrice = data.targetPrice;

        console.log(`[PriceTracker] Checking: ${productName} (current: ₹${currentPrice}, target: ₹${targetPrice})`);
        
        try {
          // fetchRealMerchantDeals now uses real scrapers + Gemini
          const deals = await fetchRealMerchantDeals(productName, currentPrice);
          
          if (deals && deals.length > 0) {
            // Sort by price to get the lowest
            const lowestDeal = [...deals].sort((a, b) => a.price - b.price)[0];
            const newPrice = lowestDeal.price;
            
            const timestamp = new Date().toISOString();
            
            console.log(`[PriceTracker] Lowest price for ${productName}: ₹${newPrice} on ${lowestDeal.platform}`);

            // Append to history and update current price
            await updateDoc(doc(db, COLLECTION_NAME, productDoc.id), {
              currentPrice: newPrice,
              priceHistory: arrayUnion({ price: newPrice, timestamp }),
              updatedAt: new Date()
            });

            // Check if price dropped below target
            if (targetPrice && newPrice <= targetPrice) {
              console.log(`[PriceTracker] 🔔 ALERT: ${productName} dropped to ₹${newPrice} (target: ₹${targetPrice}) on ${lowestDeal.platform}`);
              // Price alert triggered — in a production app, this would send a push notification or email
            }

            console.log(`[PriceTracker] Updated ${productName} successfully.`);
          } else {
            console.log(`[PriceTracker] No active deals found for ${productName}. Skipping update.`);
          }
        } catch (err) {
          console.error(`[PriceTracker] Failed to update ${productName}:`, err);
        }

        // Add a small delay between products to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log(`[PriceTracker] Background scan complete.`);
    } catch (error) {
      console.error(`[PriceTracker] Error fetching tracked products:`, error);
    }
  };

  // Run first scan after a 30s delay (let server warm up)
  setTimeout(runScan, 30000);

  // Then run on interval
  setInterval(runScan, intervalMs);
}
