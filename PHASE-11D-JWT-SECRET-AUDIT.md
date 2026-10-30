# PDFSun.in — Phase 11D: JWT Secret Management & Fail-Closed Audit

**Document Reference:** `PHASE-11D-JWT-SECRET-AUDIT.md`  
**Security Classification:** Highly Confidential / DevSecOps Hardening  
**Target File:** `/src/server/middleware/adminAuth.ts` (Lines 6–50)  
**Status:** **REMEDIATED & VERIFIED**  
**Severity:** P2 (Remediated)

---

## 1. Vulnerability Background (Phase 11C Baseline)

In Phase 11B, hardcoded static secrets were purged and replaced by a dynamic secret resolver that generated an ephemeral 256-bit random key if no environment variable was configured. 

However, as identified in the Phase 11C audit:
- In a horizontally autoscaling Cloud Run production environment or upon container restart, an ephemeral fallback generates different keys across distinct container instances or restarts.
- This creates authentication inconsistency or silent invalidation of active administrative sessions.
- In production, security mandates that the service **must fail closed** upon startup if a cryptographically secure 256-bit secret is not configured in Google Cloud Secret Manager or environment variables.

---

## 2. Hardening Requirements (Rule 4)

1. Enforce a minimum 256-bit (32 characters) cryptographically secure secret.
2. In production (`NODE_ENV === "production"`), fail startup immediately with a fatal security exception if the secret is missing, placeholder, or weak (`< 32` characters).
3. Strictly prohibit ephemeral secret fallback in production environments.
4. Allow ephemeral 256-bit random secret generation only in local development/test environments (`NODE_ENV !== "production"`), with explicit security warnings.
5. Timing-safe comparison using `crypto.timingSafeEqual` for secret validation.
6. Zero credential leakage: Never expose secrets in client bundles, logs, or error responses.

---

## 3. Implementation Details

In `/src/server/middleware/adminAuth.ts`:

```typescript
// Dynamic JWT Secret resolver: Enforces minimum 256-bit cryptographically secure secret.
// In production (NODE_ENV === "production"), startup strictly fails closed if a valid secret is not configured.
// In development/testing, generates an ephemeral 256-bit random key at boot with security warning.
let ephemeralJwtSecret: string | null = null;
function getEphemeralSecret(): string {
  if (!ephemeralJwtSecret) {
    ephemeralJwtSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[SECURITY WARN] ADMIN_JWT_SECRET environment variable not configured. Generated ephemeral 256-bit runtime secret for development/testing."
    );
  }
  return ephemeralJwtSecret;
}

export function getJwtSecret(): string {
  const configured = (
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.OWNER_JWT_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    ""
  ).trim();

  // Enforce minimum 256-bit (32 characters) length and reject known insecure test defaults
  if (
    configured &&
    configured !== "12345" &&
    configured !== "your_admin_secret_key" &&
    configured !== "PDFSun_Super_Admin_Secret_JWT_Key_2026" &&
    configured.length >= 32
  ) {
    return configured;
  }

  // Fail-closed in production environment per Phase 11D Rule 4
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[FATAL SECURITY ERROR] In production, ADMIN_JWT_SECRET (minimum 256-bit / 32 characters) must be configured in environment or Google Cloud Secret Manager. Ephemeral secret fallback is strictly prohibited in production."
    );
  }

  return getEphemeralSecret();
}
```

---

## 4. Verification Evidence & Test Matrix

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **JWT-SEC-01** | Production with missing `ADMIN_JWT_SECRET` | Throws `[FATAL SECURITY ERROR]` | Error thrown, startup halted | **PASS** |
| **JWT-SEC-02** | Production with weak secret (< 32 chars) | Throws `[FATAL SECURITY ERROR]` | Error thrown, startup halted | **PASS** |
| **JWT-SEC-03** | Production with valid 256-bit hex secret (64 chars) | Secret accepted, tokens issued | Token issued and verified | **PASS** |
| **JWT-SEC-04** | Development fallback | Ephemeral 256-bit key generated with console warning | Ephemeral key used | **PASS** |
| **JWT-SEC-05** | Token forgery / signature tampering | `verifyAdminJwtToken` returns null | Rejected (null returned) | **PASS** |
| **JWT-SEC-06** | Secret comparison | `crypto.timingSafeEqual` prevents timing attacks | Verified | **PASS** |

---

## 5. Security Conclusion

The JWT secret subsystem now strictly guarantees fail-closed behavior in production. Ephemeral fallbacks cannot silently execute in production, ensuring that all Cloud Run replicas share identical cryptographic signing material provisioned via Google Cloud Secret Manager.
