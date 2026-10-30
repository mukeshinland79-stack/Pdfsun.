# PDFSun.in — Phase 11D: CORS Security Hardening Audit & Implementation

**Document Reference:** `PHASE-11D-CORS-SECURITY.md`  
**Security Classification:** Highly Confidential / DevSecOps Hardening  
**Target File:** `/server.ts` (Lines 164–215)  
**Status:** **REMEDIATED & VERIFIED**  
**Severity:** P1 (Remediated)

---

## 1. Vulnerability Background (Phase 11C Baseline)

In Phase 11C, an architectural finding was identified where `server.ts` dynamically reflected the incoming `req.headers.origin` header alongside `Access-Control-Allow-Credentials: true`. Although PDFSun.in utilizes Bearer authorization tokens for API authentication, dynamic reflection of arbitrary untrusted origins violated strict zero-trust boundary requirements and posed cross-origin risks if third-party web clients attempted unauthorized requests.

---

## 2. Hardening Requirements (Rule 3)

1. Separate production, staging, and development origins explicitly.
2. Reject any untrusted or unexpected origin.
3. Preflight `OPTIONS` requests from untrusted origins must be rejected with HTTP 403 Forbidden.
4. Preflight `OPTIONS` requests from verified origins must return HTTP 204 with full CORS headers.
5. `Vary: Origin` must always be emitted on all incoming requests to ensure reverse proxies and CDNs do not cache responses across origins.
6. Subdomain wildcarding (e.g. `*.pdfsun.in`) is strictly prohibited to prevent subdomain takeover bypasses.
7. Support runtime extension via `process.env.ALLOWED_ORIGINS` for operational flexibility without hardcoding external endpoints.

---

## 3. Implementation Details

In `/server.ts`:

```typescript
// Verified Origin Allowlist per Phase 11D Rule 3 (Strict Environment Separation)
export const VERIFIED_CORS_ORIGINS = new Set<string>([
  "https://www.pdfsun.in",                                                // Production Canonical
  "https://pdfsun.in",                                                    // Production Apex
  "https://ais-pre-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app", // Staging Candidate
  "https://ais-dev-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app", // Development Candidate
  "http://localhost:3000",                                               // Local Node Dev Port
  "http://127.0.0.1:3000",                                               // Local Loopback Dev Port
  "http://localhost:5173",                                               // Vite Bundler Port
  "http://127.0.0.1:5173",                                               // Vite Loopback Port
]);

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((o) => VERIFIED_CORS_ORIGINS.add(o));
}

// Global CORS Middleware with Strict Verified Allowlist
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader("Vary", "Origin");

  if (origin) {
    if (VERIFIED_CORS_ORIGINS.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email, x-owner-email, x-admin-token, x-user-token, x-idempotency-key"
      );
      res.setHeader("Access-Control-Max-Age", "86400");
    } else {
      // Untrusted Origin: Reject preflight immediately; for non-preflight omit Access-Control-Allow-Origin
      if (req.method === "OPTIONS") {
        return res.status(403).json({
          error: "Forbidden",
          message: "CORS origin rejected by security policy.",
        });
      }
    }
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});
```

---

## 4. Verification Evidence & Test Matrix

| Test Case | Origin Tested | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|
| **CORS-POS-01** | `https://www.pdfsun.in` | `Access-Control-Allow-Origin: https://www.pdfsun.in`<br>`Access-Control-Allow-Credentials: true` | Allowed with credentials | **PASS** |
| **CORS-POS-02** | `https://pdfsun.in` | Allowed with credentials | Allowed with credentials | **PASS** |
| **CORS-POS-03** | `https://ais-pre-nc2omqrcrewclthjpyezu6...` | Allowed with credentials | Allowed with credentials | **PASS** |
| **CORS-POS-04** | `http://localhost:3000` | Allowed with credentials | Allowed with credentials | **PASS** |
| **CORS-NEG-01** | `https://evil-attacker.com` | No `Access-Control-Allow-Origin` header emitted | Header omitted | **PASS** |
| **CORS-NEG-02** | `https://subdomain.pdfsun.in.attacker.com` | Header omitted | Header omitted | **PASS** |
| **CORS-NEG-03** | `null` | Header omitted | Header omitted | **PASS** |
| **CORS-NEG-04** | Preflight `OPTIONS` with untrusted origin | HTTP 403 Forbidden with `{ error: "Forbidden" }` | HTTP 403 Forbidden | **PASS** |
| **CORS-HDR-01** | Header Validation | `Vary: Origin` emitted on all requests | Emitted | **PASS** |

---

## 5. Security Conclusion

Dynamic origin reflection has been completely removed. Untrusted third-party websites can no longer initiate authenticated or preflighted cross-origin AJAX queries against PDFSun.in endpoints.
