# PDFSun.in — Phase 11A: Executive Security & Architecture Audit Report

**Date of Audit:** October 30, 2026  
**Auditor Roles:** Principal Application Security Engineer, Senior PDF Processing Security Architect, Privacy Engineer, Payment Security Auditor, and DevSecOps Lead  
**Scope:** Full repository codebase, client-side processing pipelines, server endpoints, Firestore security rules, Razorpay payment processing, and deployment posture  
**Production Status:** `https://www.pdfsun.in/` — **STRICTLY FROZEN AND UNTOUCHED**  
**Execution Boundary:** Read-Only Audit & Non-Mutating Verification. Zero application source modifications or unauthorized deployments executed.

---

## 1. Executive Summary

PDFSun.in operates primarily on a **Zero-Server-Load / Browser Computing Paradigm**, leveraging WebAssembly (`pdf-lib`, `pdfjs-dist`, `docx`, `exceljs`, `tesseract.js`) to process documents entirely inside client browsers without transmitting user document bytes over the wire. This privacy architecture significantly minimizes the attack surface associated with server-side document storage and transmission.

However, an in-depth security and architectural audit across the application, API boundaries, Firestore database rules, and billing workflows revealed **four critical/high-severity security findings** and **several medium/low architectural risks** that require remediation before further public expansion:

1. **Client-Side Firestore Rule Bypass (CRITICAL / HIGH)**:  
   In `firestore.rules`, sensitive financial collections (`/payments/`, `/transactions/`, `/user_subscriptions/`, `/user_credits/`, `/payment_reconciliations/`) specify `allow create, update: if true;` under the assumption that this enables server-side writes. In Firebase Firestore, server-side Admin SDKs bypass security rules automatically; `allow create, update: if true;` directly exposes these collections to untrusted client-side web SDK writes, allowing malicious users to arbitrarily create or manipulate payment and entitlement records.
2. **Unauthenticated Server-Side Gemini API Endpoints (HIGH)**:  
   In `server.ts`, `/api/ai/*` endpoints (`/api/ai/chat`, `/api/ai/summarize`, etc.) accept arbitrary POST payloads and consume paid Gemini API quota without validating user authentication tokens or verifying active subscription entitlements (violating AGENTS_md plan boundary rules).
3. **Hardcoded Fallback Secret in JWT Verification (HIGH / MEDIUM)**:  
   In `src/server/middleware/adminAuth.ts`, `JWT_SECRET` defaults to `"PDFSun_Super_Admin_Secret_JWT_Key_2026"` if neither `JWT_SECRET` nor `ADMIN_SECRET_KEY` is present in the environment. While `isValidAdminSecret` enforces timing-safe strict length checks, a missing `JWT_SECRET` would allow an attacker knowing this default string to sign arbitrary owner tokens.
4. **Formula Injection / CSV Injection Risk in Spreadsheet Compilers (HIGH / MEDIUM)**:  
   In `src/core/udir/xlsxCompiler.ts`, raw cell text strings from untrusted input PDFs that start with `=`, `+`, `-`, or `@` are assigned directly to Excel cell values without single-quote escaping (`'`), creating potential DDE/Formula Injection vulnerabilities when opened in Microsoft Excel.

### Verified Test Baseline Summary
- **TypeScript Typecheck (`tsc --noEmit`)**: 0 compilation errors.
- **Automated Regression Suite (`scripts/run-tests.ts`)**: 217 passed, 0 failed.
- **Phase 10D.10 Verification Suite (`scripts/verify-phase10d10.ts`)**: 37 passed, 0 failed.
- **Phase 10D.9 Acceptance Suite (`scripts/verify-phase10d9.ts`)**: 29 passed, 0 failed.
- **Phase 2 Document Security Suite (`scripts/verify-phase2-security.ts`)**: 20 passed, 0 failed.
- **Phase 4 Production Suite (`scripts/verify-phase4-production.ts`)**: 44 passed, 0 failed.
- **Combined Automated Verification**: **347 passed, 0 failed**.
- **Development Health Endpoint**: `http://localhost:3000/api/health` -> HTTP 200 OK.

---

## 2. Security Assessment Matrix

| Domain | Rating | Confirmed Strengths | Identified Vulnerabilities / Gaps |
| :--- | :--- | :--- | :--- |
| **Application Security** | Moderate | Timing-safe admin comparisons, artifact stealth guard, no-sniff/HSTS headers | Wildcard CORS with credentials, unauthenticated AI endpoints |
| **PDF & Document Engine** | Strong | Genuine stream redaction & AES-256 encryption, XXE & Zip-Slip defense | Excel formula injection on unescaped input cells |
| **Privacy Architecture** | Exceptional | 100% client-side WASM processing, zero remote document uploads | Object URL leak on unmounted components, potential Base64 logging in GET download endpoint |
| **Payment & Billing** | Strong | Strict HMAC-SHA256 signature verification, timing-safe checks, idempotency ledger | Firestore client rules allow unauthenticated write to transactions/subscriptions; client-side localStorage entitlement bypass |
| **Infrastructure & DevOps**| Moderate | Multi-stage Dockerfile, non-root user (`pdfsun:1001`), container health check | Staging service GFE 404 due to unmapped revision; sandbox container lacks Cloud Run control-plane IAM |

---

## 3. Prioritized Remediation Summary

1. **Remediation 1 (P0 - Critical)**: Lock down `firestore.rules` client-side writes on `/payments/`, `/transactions/`, `/user_subscriptions/`, and `/user_credits/` by changing `allow create, update: if true;` to `allow create, update, delete: if false;`.
2. **Remediation 2 (P1 - High)**: Add user JWT authentication and entitlement verification middleware (`verifyUserEntitlement`) to all server-side `/api/ai/*` endpoints.
3. **Remediation 3 (P1 - High)**: Escape unvetted user text starting with `=`, `+`, `-`, or `@` in `src/core/udir/xlsxCompiler.ts` to prevent formula injection.
4. **Remediation 4 (P1 - High)**: Eliminate static fallback string for `JWT_SECRET` in `src/server/middleware/adminAuth.ts` and fail closed if unconfigured.
5. **Remediation 5 (P2 - Medium)**: Disallow GET method on `/api/download/file` (enforce POST only) and validate `mimeType` against an allowlist of document MIME types.
6. **Remediation 6 (P2 - Medium)**: Align CORS headers in `server.ts` by removing wildcard `*` when credentials are permitted.
7. **Remediation 7 (P3 - Low)**: Enforce component unmount cleanup for all `URL.createObjectURL` instances via `useEffect` cleanup handlers.

---

## 4. Certification of Production Preservation

The audit team certifies that:
1. No mutation commands were executed against the production service `https://www.pdfsun.in/`.
2. No code patches were applied to source files (`.ts`, `.tsx`, `.js`).
3. No Cloud Run traffic rules or Firestore production security rules were altered.
4. All findings are documented in accompanying deliverables for owner review and explicit authorization.
