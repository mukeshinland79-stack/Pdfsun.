# PDFSun.in — Phase 11A: Remediation Roadmap & Implementation Strategy

This document outlines the proposed remediation strategy for all security and architectural findings identified during Phase 11A. 

**Execution Policy:** All proposed changes are staged for review. In accordance with Phase 11A rules, **no source code modifications will be executed until the project owner grants explicit authorization.**

---

## 1. Prioritized Action Matrix

| Priority | Finding ID | Category | Target File(s) | Estimated Effort |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Immediate)** | **SEC-11A-001** | Database Security Rules | `/firestore.rules` | 15 mins |
| **P1 (High)** | **SEC-11A-002** | Server Authorization | `/server.ts` | 45 mins |
| **P1 (High)** | **SEC-11A-003** | Auth Secret Hardening | `/src/server/middleware/adminAuth.ts` | 15 mins |
| **P1 (High)** | **SEC-11A-004** | Document Security | `/src/core/udir/xlsxCompiler.ts` | 20 mins |
| **P2 (Medium)** | **SEC-11A-005** | API Endpoint Hardening | `/server.ts` | 20 mins |
| **P2 (Medium)** | **SEC-11A-006** | CORS Header Alignment | `/server.ts` | 15 mins |
| **P2 (Medium)** | **SEC-11A-007** | Client Entitlement Sync | `/src/hooks/useUsageTracker.ts` | 30 mins |
| **P3 (Low)** | **SEC-11A-008** | Client Memory Cleanup | `/src/components/*.tsx` | 30 mins |
| **P2 (Infra)** | **SEC-11A-009** | Cloud Run Staging 404 | GCP Console / AI Studio UI | Owner Action |

---

## 2. Detailed Technical Remediation Plans

### P0 — Fix SEC-11A-001: Restrict Client Writes on Billing Collections
- **Target File**: `/firestore.rules`
- **Action**:  
  Replace `allow create, update: if true;` with `allow create, update, delete: if false;` on `/payments/{paymentId}`, `/transactions/{paymentId}`, `/user_subscriptions/{userId}`, `/user_credits/{userEmail}`, and `/payment_reconciliations/{reconciliationId}`.
- **Verification Plan**:  
  Run `npx tsx scripts/run-tests.ts`. Ensure security suite tests continue to pass and assert that zero occurrences of `allow create, update: if true;` exist on billing collections.

---

### P1 — Fix SEC-11A-002: Enforce Authentication & Entitlements on AI Endpoints
- **Target File**: `/server.ts`
- **Action**:  
  Create middleware `verifyUserEntitlement(req, res, next)`:
  1. Validates `Authorization: Bearer <token>` or session cookie.
  2. Resolves user email and checks Firestore `/user_subscriptions` or `/user_credits`.
  3. Rejects requests from non-authenticated or expired-quota accounts.
  4. Attach middleware to `/api/ai/chat`, `/api/ai/summarize`, `/api/ai/ocr`, etc.
- **Verification Plan**:  
  Execute synthetic curl requests with and without valid Bearer tokens. Confirm unauthenticated requests receive HTTP 401.

---

### P1 — Fix SEC-11A-003: Remove Static JWT Fallback Secret
- **Target File**: `/src/server/middleware/adminAuth.ts`
- **Action**:  
  Change line 7 to fail closed:
  ```typescript
  const configuredSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY;
  if (!configuredSecret || configuredSecret === "PDFSun_Super_Admin_Secret_JWT_Key_2026" || configuredSecret.length < 16) {
    throw new Error("[Security Guard] FATAL: Secure JWT_SECRET must be configured in environment.");
  }
  const JWT_SECRET = configuredSecret;
  ```
- **Verification Plan**:  
  Test that `verifyAdminJwtToken` fails closed when secret is absent or weak.

---

### P1 — Fix SEC-11A-004: Sanitize CSV / Excel Formula Injection
- **Target File**: `/src/core/udir/xlsxCompiler.ts`
- **Action**:  
  Add formula character sanitization:
  ```typescript
  function escapeExcelText(text: string): string {
    if (!text || typeof text !== "string") return "";
    // If text begins with formula triggers and is not a deliberate formula, prefix with single-quote
    if (/^[=+\-@\t\r]/.test(text)) {
      return `'${text}`;
    }
    return text;
  }
  ```
  Apply `escapeExcelText(cellData.text)` before setting `excelCell.value`.
- **Verification Plan**:  
  Add test case in `scripts/verify-phase10d10.ts` with cell text `=cmd|' /C calc'!A0` and verify it is exported as `'=cmd|' /C calc'!A0` without triggering Excel execution.

---

### P2 — Fix SEC-11A-005 & SEC-11A-006: Hardened Download Endpoint & CORS Policy
- **Target File**: `/server.ts`
- **Action**:  
  1. Change `app.all(["/api/download/file", ...])` to `app.post`. Disallow GET query string parameter `fileBase64`.
  2. Restrict `mimeType` to allowed document types (`application/pdf`, `application/vnd.openxmlformats-officedocument.*`, `image/*`, `text/plain`).
  3. Replace wildcard CORS `res.setHeader("Access-Control-Allow-Origin", "*")` with requesting origin reflection for approved domains (`pdfsun.in`, `www.pdfsun.in`, localhost).
- **Verification Plan**:  
  Assert GET to `/api/download/file` returns HTTP 405. Assert preflight OPTIONS returns correct origin.

---

### P3 — Fix SEC-11A-008: Automated Blob URL Revocation
- **Target Files**: `src/components/ActiveToolWorkspace.tsx`, `src/components/AservusPdfCompressor.tsx`
- **Action**:  
  Wrap all `URL.createObjectURL(blob)` calls in `registerGuardedBlobUrl` or invoke `URL.revokeObjectURL(url)` in `useEffect` cleanup return functions.
- **Verification Plan**:  
  Inspect `window.performance.memory` before and after file processing in browser E2E test.

---

## 3. Owner Authorization Gate

Upon receiving owner approval to proceed to **Phase 11B (Remediation Implementation)**, the patches will be applied sequentially, followed by a full re-run of the 347-test automated verification suite.
