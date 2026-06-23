# Security Specification for PriceWise Firestore Rules

## 1. Data Invariants
- A tracking entry must always be owned by a authenticated user (`userId == auth.uid`).
- No user can access or query another user's tracked product lists (zero-trust privacy isolation).
- Historic price observations must be finite (`priceHistory.size() <= 100`).
- Core fields such as `createdAt`, `userId`, `id` are immutable once created.
- Scraped timestamps must reflect precise server-time registers.

## 2. The "Dirty Dozen" Threat Payloads
Here are 12 payload templates designed to attempt unauthorized, destructive, or invalid DB mutations:
1. **Unauthenticated Read Attack**: Attempting to grab list of trackers without being signed in.
2. **Account Spoofing Creation**: Authenticated as user `Alice` but attempting to write a record with `userId: Bob` to track Bob's activities.
3. **Ghost-Field Injection**: Attempting to insert unverified administrative flags like `isAuditor: true` into a tracking document.
4. **ID Poisoning Attack**: Passing a 20KB garbage ID instead of a valid UUID string to exhaust resources.
5. **Denial-of-Wallet Array Flooding**: Attempting to push a priceHistory list size of 10,000 items to exhaust reading buffers.
6. **Cross-User Leak Listing**: Trying to issue a list query without filtering on the user's specific sub-clause `where("userId", "==", auth.uid)`.
7. **Timestamp Spoofing**: Setting `createdAt` to a historical date 5 years in the past to trigger fake alerts.
8. **Negative Valuation Poisoning**: Setting product prices or target thresholds to negative values (e.g. `currentPrice: -999.00`).
9. **Mutation Shortcut Update**: Bypassing allowed targetPrice or currentPrice updates to override product name with malicious code.
10. **Immutability Breach**: An owner updating their `createdAt` field on a tracked entry.
11. **Other User Deletion Attack**: Bob trying to send a delete query against Alice's tracked product ID.
12. **Junk Platform Parameter**: Injecting 1MB platform metadata fields into the platform config.

## 3. Firestore Rules Validation Spec
We write secure Firestore Rules that explicitly reject all 12 vectors through zero-trust matching, strict schema validation, and attribute key comparison.
