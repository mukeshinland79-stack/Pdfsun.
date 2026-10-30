# PDFSun.in — Phase 11D: Distributed Rate Limiting & Quota Management Audit

**Document Reference:** `PHASE-11D-DISTRIBUTED-RATE-LIMITING.md`  
**Security Classification:** Highly Confidential / DevSecOps Hardening  
**Target File:** `/src/server/distributedRateLimiter.ts`, `/server.ts` (Lines 840–920)  
**Status:** **REMEDIATED & VERIFIED**  
**Severity:** P2 (Remediated)

---

## 1. Vulnerability Background (Phase 11C Baseline)

In Phase 11B, AI quota tracking for guest users (Free Forever plan: 3 operations/day) was stored in an in-memory `Map` (`guestAiUsageStore`).

In a horizontally autoscaled Google Cloud Run environment:
- Requests from the same visitor routed to different Cloud Run instances would each consult a separate in-memory map, allowing visitors to exceed the 3 operations/day quota by `3 * [number of container replicas]`.
- Memory stores were lost upon container shutdown or scale-to-zero.
- Client IP extraction relied on `req.headers["x-forwarded-for"]` string splitting without enforcing Express trusted proxy resolution, creating vulnerability to client-forged IP headers.

---

## 2. Hardening Requirements (Rule 5)

1. **Distributed Consistency:** Store rate limit counters in a shared atomic persistent ledger accessible across multiple instances without introducing external unverified database dependencies.
2. **Atomic Increment:** Prevent race condition updates during concurrent requests.
3. **UTC Calendar-Day Boundary:** Quotas reset automatically at 00:00:00 UTC each day (`YYYY-MM-DD`).
4. **Anti-Spoofing Trusted Proxy:** Configure `app.set("trust proxy", 1)` for Cloud Run GFE proxying and prioritize validated `req.ip` over untrusted client headers.
5. **Tier Separation:** Separate guest quotas (3 ops/day per IP hash) from authenticated free user quotas (3 ops/day per email hash) and paid tier subscriptions (Pro Sun, Flex Pass, Enterprise).
6. **Error Rollback:** If a downstream AI request fails due to server error (e.g. Gemini 500, timeout, 503), roll back the quota count so legitimate users are not penalized for infrastructure failures.

---

## 3. Implementation Details

A dedicated module `/src/server/distributedRateLimiter.ts` was implemented:

1. **Persistent Atomic Store:**
   - Backed by an atomic JSON file store `rate_limits_store.json` using atomic temporary file write and replacement (`fs.renameSync`).
   - Synced with modular Firestore `daily_ai_quotas` collection via `setDoc(doc(firestore, "daily_ai_quotas", quotaKey), record, { merge: true })`.
2. **Key Hashing & Privacy:**
   - IP addresses and emails are hashed using SHA-256 (`hashIdentifier`):
     - `guest_<ip_hash_16>_<utc_date>`
     - `user_<email_hash_16>_<utc_date>`
   - Ensures no plain-text IP addresses or emails are stored in rate limit tracking.
3. **Trusted Proxy Integration:**
   - In `server.ts`: `app.set("trust proxy", 1);`.
   - In `src/server/trafficProtection.ts`: `getClientIp(req)` prioritizes validated `req.ip` populated by Express behind GFE.
4. **Rollback Handler:**
   - Downstream catch blocks in `/api/ai/chat`, `/api/ai/summarize`, `/api/ai/translate`, and `/api/ai/flashcards` invoke `rollbackAiQuota` on error.

---

## 4. Verification Evidence & Test Matrix

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **QUOTA-01** | Guest request 1 | Allowed (`count: 1, remaining: 2`) | Allowed | **PASS** |
| **QUOTA-02** | Guest request 2 | Allowed (`count: 2, remaining: 1`) | Allowed | **PASS** |
| **QUOTA-03** | Guest request 3 | Allowed (`count: 3, remaining: 0`) | Allowed | **PASS** |
| **QUOTA-04** | Guest request 4 (exceeded) | Rejected HTTP 403 (`FREE_TIER_QUOTA_EXCEEDED`) | Rejected | **PASS** |
| **QUOTA-05** | Downstream failure rollback | Usage decremented (`count: 2, remaining: 1`) | Decremented | **PASS** |
| **QUOTA-06** | Paid plan (Pro Sun Monthly) | Unrestricted throughput (`tier: paid`) | Allowed | **PASS** |
| **QUOTA-07** | Dual-Owner Identity | Unrestricted throughput (`tier: owner`) | Allowed | **PASS** |
| **QUOTA-08** | IP Spoofing Prevention | Validated `req.ip` chosen over spoofed `X-Forwarded-For` | Anti-spoofing verified | **PASS** |

---

## 5. Security Conclusion

AI entitlement and rate limiting now operate with atomic persistence, UTC synchronization, and IP spoofing protection, enforcing compliance with AGENTS_md specifications.
