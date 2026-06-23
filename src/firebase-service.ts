import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { TrackedProduct, PricePoint, UserPreferences, SearchHistoryEntry } from "./types";


const COLLECTION_NAME = "trackedProducts";

/**
 * Add a new product to the user's price alerts tracking database
 */
export async function trackProduct(
  productName: string,
  url: string,
  imageUrl: string,
  platform: string,
  currentPrice: number,
  targetPrice: number,
  favorite: boolean = false
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to track products.");
  }

  const trackId = `${user.uid}_${Date.now()}`;
  const realHistory = [{ price: currentPrice, timestamp: new Date().toISOString() }];

  const payload = {
    id: trackId,
    userId: user.uid,
    productName,
    url,
    imageUrl,
    platform,
    currentPrice,
    targetPrice,
    initialPrice: currentPrice,
    priceHistory: realHistory,
    favorite,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, trackId);
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${trackId}`);
  }
}

/**
 * Delete and stop tracking a product
 */
export async function untrackProduct(trackId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, trackId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${trackId}`);
  }
}

/**
 * Update the targeted price trigger for an existing track
 */
export async function updateTrackedPriceThreshold(trackId: string, newTargetPrice: number): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, trackId);
    await updateDoc(docRef, {
      targetPrice: newTargetPrice,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${trackId}`);
  }
}

/**
 * Toggle the favorite / bucketlist trigger for an alert track
 */
export async function toggleTrackedFavorite(trackId: string, currentFavoriteState: boolean): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, trackId);
    await updateDoc(docRef, {
      favorite: !currentFavoriteState,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${trackId}`);
  }
}

/**
 * Subscribe in real-time to the current authenticated user's tracked watchlist
 */
export function subscribeToUserWatchlist(
  userId: string,
  onUpdate: (tracks: TrackedProduct[]) => void,
  onError: (err: any) => void
) {
  const path = COLLECTION_NAME;
  const q = query(collection(db, path), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const tracks: TrackedProduct[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tracks.push({
          id: data.id,
          userId: data.userId,
          productName: data.productName,
          url: data.url,
          imageUrl: data.imageUrl,
          platform: data.platform,
          currentPrice: data.currentPrice,
          targetPrice: data.targetPrice,
          initialPrice: data.initialPrice,
          priceHistory: data.priceHistory || [],
          favorite: data.favorite || false,
          // Safeguard against null timestamps before the server commits
          createdAt: data.createdAt ? data.createdAt.toDate?.() || data.createdAt : new Date(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate?.() || data.updatedAt : new Date()
        });
      });
      // Sort newest trackers first
      tracks.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(tracks);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ─── User Preferences ───────────────────────────────────────────────

/**
 * Save user preferences to Firestore
 */
export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to save preferences.");

  const docRef = doc(db, "userPreferences", user.uid);
  const payload: Record<string, any> = {
    ...prefs,
    userId: user.uid,
    updatedAt: serverTimestamp(),
  };

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      await updateDoc(docRef, payload);
    } else {
      payload.createdAt = serverTimestamp();
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `userPreferences/${user.uid}`);
  }
}

/**
 * Get user preferences from Firestore
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, "userPreferences", user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.warn("Failed to load user preferences:", error);
    return null;
  }
}

// ─── Search History ─────────────────────────────────────────────────

/**
 * Save a search query to the user's search history in Firestore
 */
export async function saveSearchHistory(queryStr: string, resultsCount: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // Silently skip for non-logged-in users

  try {
    const entriesRef = collection(db, "searchHistory", user.uid, "entries");
    await addDoc(entriesRef, {
      userId: user.uid,
      query: queryStr,
      resultsCount,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Non-critical — don't throw, just log
    console.warn("Failed to save search history:", error);
  }
}

/**
 * Get the user's recent search history (last N entries)
 */
export async function getSearchHistory(maxEntries: number = 10): Promise<SearchHistoryEntry[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const entriesRef = collection(db, "searchHistory", user.uid, "entries");
    const q = query(entriesRef, orderBy("timestamp", "desc"), limit(maxEntries));
    const snap = await getDocs(q);
    const results: SearchHistoryEntry[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        userId: data.userId,
        query: data.query,
        resultsCount: data.resultsCount || 0,
        timestamp: data.timestamp?.toDate?.() || new Date(),
      });
    });
    return results;
  } catch (error) {
    console.warn("Failed to load search history:", error);
    return [];
  }
}

// ─── Export ─────────────────────────────────────────────────────────

/**
 * Export the user's watchlist as a CSV string (can be downloaded client-side)
 */
export function exportWatchlistCSV(watchlist: TrackedProduct[]): string {
  const headers = ["Product Name", "Platform", "Current Price (INR)", "Target Price (INR)", "Initial Price (INR)", "URL", "Date Added"];
  const rows = watchlist.map((w) => [
    `"${w.productName.replace(/"/g, '""')}"`,
    w.platform,
    w.currentPrice,
    w.targetPrice,
    w.initialPrice,
    w.url,
    w.createdAt instanceof Date ? w.createdAt.toLocaleDateString("en-IN") : String(w.createdAt),
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

