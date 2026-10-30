# PDFSun.in — Phase 11A: Billing & Payment Security Audit

This document provides a comprehensive security assessment of the billing, subscription, webhook verification, and entitlement ledger architecture of PDFSun.in.

---

## 1. Pricing Tier & Plan Structure Verification

PDFSun.in enforces 6 strict subscription plans aligned with the core AGENTS_md policy:

| Plan Tier | Price (INR) | Billing Cycle | File Limit | Daily Quota | Feature Rights |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Forever** | ₹0 | Perpetual | 15 MB | 3 ops/day | Basic client utilities, standard compression |
| **Flex Pass** | ₹99 | 7 Days (One-Time) | 100 MB | Unlimited | Full tool access, no auto-debit, priority processing |
| **Pro Sun Monthly** | ₹199 | Monthly (Auto-Renew) | 250 MB | Unlimited | Full feature access, AI Suite, OCR, batch mode |
| **Pro Sun Annual** | ₹1,499 | Yearly (Auto-Renew) | 500 MB | Unlimited | Full access, high-volume processing |
| **Enterprise Plan** | ₹3,999 | Yearly (Auto-Renew) | 1 GB | Unlimited | 5 Seats, dedicated concurrency, SLA support |
| **Enterprise SSO** | ₹9,999 | Yearly (Auto-Renew) | 2 GB | Unlimited | 20 Seats, Enterprise SAML/SSO, custom pipeline |

---

## 2. Payment Cryptography & Signature Verification

### A. HMAC-SHA256 Signature Verification
- **Implementation**: Located in `src/server/razorpayService.ts`.
- **Subscription Signature Formula**:
  $$\text{HMAC\_SHA256}(\text{razorpay\_payment\_id} + "|" + \text{razorpay\_subscription\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
- **Order Signature Formula**:
  $$\text{HMAC\_SHA256}(\text{razorpay\_order\_id} + "|" + \text{razorpay\_payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
- **Webhook Signature Formula**:
  $$\text{HMAC\_SHA256}(\text{rawBody}, \text{RAZORPAY\_WEBHOOK\_SECRET})$$
- **Cryptographic Safety**:
  - Uses `crypto.timingSafeEqual(sigBuffer, expectedBuffer)` to prevent timing attacks.
  - Length check performed before `timingSafeEqual` to avoid buffer length mismatch exceptions.
  - **Fail-Closed Guard**: Rejects verification immediately if secrets are undefined or match placeholder patterns (`"placeholder"`, `"your_live_key_secret"`, `"change_me"`, `"xxxxxxxx"`).

### B. Environment Isolation & Non-Production Live-Key Guard
- `validatePaymentEnvironmentGuard` in `src/server/razorpayService.ts` checks the execution environment.
- If a live key (`rzp_live_*`) is detected in a `development` or `staging` environment, all payment operations are **strictly blocked before reaching the Razorpay API** (`category: "NON_PROD_LIVE_KEY_BLOCKED"`).

---

## 3. Webhook Authentication & Transaction Idempotency

### A. Webhook Handler (`src/pages/api/webhooks/razorpay.ts`)
- **Raw Body Verification**: Uses `req.rawBody` captured during body parsing (`express.json({ verify: ... })`) to ensure signature matches original transmitted bytes before JSON normalization.
- **Idempotency Defense**:
  - Checks the Firestore `transactions` collection for the unique payment ID (`cleanPaymentId`).
  - If existing record has status `COMPLETED` or `CAPTURED`, the webhook returns HTTP 200 with `alreadyProcessed: true` without granting duplicate entitlements or double-crediting accounts.
- **Transaction Cross-Referencing**:
  - `verifyRazorpayTransactionDetails` validates Order ID, amount in paise, currency, and user email against existing Firestore orders before granting entitlements.

---

## 4. Owner Payment Audit Ledger (Admin Panel)

Per AGENTS_md specifications:
- **Immutable Log Storage**: Every verified payment logs to `/owner_payment_audit_logs/{logId}`.
- **Fields Captured**: User ID, Email, Payment Gateway Reference ID, Date & Time, Exact Plan Purchased, and Actual Amount Received (in INR).
- **Client-Side Tamper Proofing**:
  - `firestore.rules` enforces:
    ```firestore
    match /owner_payment_audit_logs/{logId} {
      allow read: if isSignedIn() && request.auth.token.email == "mukeshinland79@gmail.com";
      allow create, update: if false;
      allow delete: if false;
    }
    ```
  - Direct writes via client SDKs are completely blocked. Only server-side Admin SDK operations can create audit records.

---

## 5. Security Vulnerabilities & Deficiencies Identified

### 1. Client-Side Firestore Security Rule Weakness (SEC-11A-001 - Critical)
- `firestore.rules` permits `allow create, update: if true;` on `/payments/`, `/transactions/`, `/user_subscriptions/`, and `/user_credits/`.
- While intended for server webhook writes, server-side Admin SDKs already bypass rules; this rule exposes these collections to untrusted browser writes.
- *Remediation*: Change to `allow write: if false;` on client SDKs.

### 2. Lack of Server-Side Entitlement Checks on AI Routes (SEC-11A-002 - High)
- Gemini proxy endpoints (`/api/ai/*`) do not verify active subscriptions or decrement credits before executing requests.
- *Remediation*: Add server-side JWT entitlement validation middleware.

### 3. Client-Side LocalStorage Plan Flag Manipulation (SEC-11A-007 - Medium)
- Setting `localStorage.setItem("pdfsun_user_is_pro", "true")` bypasses client-side feature gating.
- *Remediation*: Require cryptographically signed server tokens for Pro/Enterprise capabilities.
