# PDFSun.in — Phase 11A: Detailed Security Findings

This document catalogs all technical security findings discovered during the Phase 11A comprehensive security and architecture audit.

---

### Finding Index
| Finding ID | Title | Severity | Classification |
| :--- | :--- | :--- | :--- |
| **SEC-11A-001** | Firestore Client Rules Allow Untrusted Client Writes to Financial Collections | Critical | Confirmed Vulnerability |
| **SEC-11A-002** | Unauthenticated Server-Side Gemini AI Endpoints Bypass Plan Entitlements | High | Confirmed Vulnerability |
| **SEC-11A-003** | Hardcoded Fallback Secret in JWT Admin Authentication | High | Confirmed Vulnerability |
| **SEC-11A-004** | Excel Formula Injection (CWE-1236) via Unescaped User Content in PDF-to-Excel | High | Confirmed Vulnerability |
| **SEC-11A-005** | Reflected File Download & Query-Param Base64 Exposure on Download Endpoint | Medium | Confirmed Vulnerability |
| **SEC-11A-006** | Invalid CORS Configuration Combining Wildcard Origin with Credentials | Medium | Confirmed Vulnerability |
| **SEC-11A-007** | Client-Side Entitlement Bypass via Unsigned LocalStorage Manipulation | Medium | Architectural Weakness |
| **SEC-11A-008** | Memory Leak from Unrevoked Blob URLs across Transient UI Modals | Low | Improvement Opportunity |
| **SEC-11A-009** | Cloud Run Staging Revision Missing Active Traffic Allocation (GFE 404) | Medium | Infrastructure Blocker |

---

### SEC-11A-001: Firestore Client Rules Allow Untrusted Client Writes to Financial Collections
- **Severity**: **Critical**
- **Affected Component**: Database Security Rules (Firebase Firestore)
- **File Path**: `/firestore.rules`
- **Location**: Lines 56, 66, 78, 89, 99
- **Technical Explanation**:  
  In Firebase Firestore, security rules govern direct requests coming from web client SDKs (`firebase/firestore`). Trusted server-side operations (using the Firebase Admin SDK) bypass security rules automatically.  
  In `firestore.rules`, the following rules are present:
  ```firestore
  match /payments/{paymentId} {
    allow create, update: if true;
  }
  match /transactions/{paymentId} {
    allow create, update: if true;
  }
  match /user_subscriptions/{userId} {
    allow create, update: if true;
  }
  match /user_credits/{userEmail} {
    allow create, update: if true;
  }
  match /payment_reconciliations/{reconciliationId} {
    allow create, update: if true;
  }
  ```
  While the developer comment states `// Allows server-side writes and webhook integration`, this rule actually allows any anonymous or unauthenticated browser visitor to call `setDoc(doc(db, "user_subscriptions", myUid), { plan: "enterprise", status: "active" })` or forge transactions directly from browser devtools.
- **Reproducible Evidence**:  
  Line 56: `allow create, update: if true;`  
  Line 66: `allow create, update: if true;`  
  Line 78: `allow create, update: if true;`  
  Line 89: `allow create, update: if true;`  
  Line 99: `allow create, update: if true;`  
  Compare with lines 118-119 on `/owner_payment_audit_logs/{logId}` which correctly specify: `allow create, update: if false; allow delete: if false;`.
- **Potential Impact**:  
  Complete compromise of the billing ledger. Attackers could grant themselves free Enterprise subscriptions, delete or forge payment records, and manipulate credit balances directly in Firestore.
- **Recommended Remediation**:  
  Update `firestore.rules` so that all write operations on financial collections are strictly denied to client SDKs:
  ```firestore
  match /payments/{paymentId} {
    allow read: if isSignedIn() && (
      resource.data.userEmail == request.auth.token.email ||
      request.auth.token.email == "mukeshinland79@gmail.com"
    );
    allow write: if false;
  }
  match /transactions/{paymentId} {
    allow read: if isSignedIn() && (
      resource.data.userEmail == request.auth.token.email ||
      request.auth.token.email == "mukeshinland79@gmail.com"
    );
    allow write: if false;
  }
  match /user_subscriptions/{userId} {
    allow read: if isSignedIn() && (
      userId == request.auth.uid ||
      userId == request.auth.token.email ||
      resource.data.userId == request.auth.token.email ||
      request.auth.token.email == "mukeshinland79@gmail.com"
    );
    allow write: if false;
  }
  match /user_credits/{userEmail} {
    allow read: if isSignedIn() && (
      userEmail == request.auth.token.email ||
      userEmail == request.auth.uid ||
      request.auth.token.email == "mukeshinland79@gmail.com"
    );
    allow write: if false;
  }
  ```
- **Regression Test Recommendation**:  
  Add automated unit tests in `scripts/run-tests.ts` verifying that `firestore.rules` contains zero occurrences of `allow create, update: if true;` on sensitive billing collections.

---

### SEC-11A-002: Unauthenticated Server-Side Gemini AI Endpoints Bypass Plan Entitlements
- **Severity**: **High**
- **Affected Component**: Express API Server (`server.ts`)
- **File Path**: `/server.ts`
- **Location**: Lines 642–1520 (specifically lines 642, 686, 826, 869, 897, 925, 953, 1053, 1219, 1341, 1406, 1485)
- **Technical Explanation**:  
  The server exposes multiple AI routes including `/api/ai/chat`, `/api/ai/summarize`, `/api/ai/ocr`, `/api/ai/flashcards`, and `/api/ai/notes`. While sliding rate limiters exist per IP, these routes require **no user session token (`Authorization: Bearer <token>`)** and do not verify whether the requesting user has an active Pro Sun, Flex Pass, or Enterprise subscription.  
  This directly conflicts with the system rule: *"Users MUST NOT receive features or processing quotas higher or lower than what their active plan specifies."*
- **Reproducible Evidence**:  
  In `server.ts` line 642:
  ```typescript
  app.post("/api/ai/chat", async (req, res) => {
    const { message, documentText, history } = req.body || {};
    // No auth token verification or entitlement check
    const ai = getGeminiClient();
    ...
  });
  ```
- **Potential Impact**:  
  1. Denial of Wallet / Quota Exhaustion: Malicious actors can script calls to `/api/ai/chat` or `/api/ai/ocr` to exhaust the project's Gemini API quota or incur substantial API charges.
  2. Free access to paid Pro features without paying the ₹199/month or ₹99/week tier fee.
- **Recommended Remediation**:  
  Implement an entitlement middleware `verifyUserEntitlement("ai")` that:
  1. Extracts and verifies the user's JWT from `Authorization: Bearer <token>`.
  2. Confirms active Pro/Enterprise status or decrements daily free operations in Firestore.
  3. Rejects unauthenticated or out-of-quota requests with HTTP 401/403.
- **Regression Test Recommendation**:  
  Add automated tests sending unauthenticated requests to `/api/ai/chat` asserting HTTP 401 Unauthorized.

---

### SEC-11A-003: Hardcoded Fallback Secret in JWT Admin Authentication
- **Severity**: **High**
- **Affected Component**: Administrative Security & RBAC Middleware
- **File Path**: `/src/server/middleware/adminAuth.ts`
- **Location**: Line 7
- **Technical Explanation**:  
  `adminAuth.ts` defines the secret key used to sign and verify administrative JWTs:
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY || "PDFSun_Super_Admin_Secret_JWT_Key_2026";
  ```
  If an operator deploys the container without setting `JWT_SECRET` and `ADMIN_SECRET_KEY` (or if environment injection fails during startup), the application silently falls back to the static string `"PDFSun_Super_Admin_Secret_JWT_Key_2026"`. Any attacker knowing this string can forge an admin JWT with `role: "owner"` and gain full access to admin APIs.
- **Reproducible Evidence**:  
  Line 7 of `/src/server/middleware/adminAuth.ts`.
- **Potential Impact**:  
  Full administrative compromise and unauthorized access to owner audit logs.
- **Recommended Remediation**:  
  Enforce a fail-closed policy at startup:
  ```typescript
  const configuredSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY;
  if (!configuredSecret || configuredSecret.length < 16 || configuredSecret === "PDFSun_Super_Admin_Secret_JWT_Key_2026") {
    // Generate a secure ephemeral random key on startup if not configured, or throw error
    throw new Error("[Security Guard] FATAL: JWT_SECRET or ADMIN_SECRET_KEY must be configured with >= 16 characters.");
  }
  ```
- **Regression Test Recommendation**:  
  Add a test verifying that `generateAdminJwtToken` and `verifyAdminJwtToken` fail closed when no secure secret is configured in the environment.

---

### SEC-11A-004: Excel Formula Injection (CWE-1236) via Unescaped User Content in PDF-to-Excel
- **Severity**: **High**
- **Affected Component**: Unified Document Intermediate Representation (UDIR) Spreadsheet Compiler
- **File Path**: `/src/core/udir/xlsxCompiler.ts`
- **Location**: Lines 99, 120
- **Technical Explanation**:  
  When compiling extracted PDF tables into Excel workbooks via `exceljs`, text cells are written directly:
  ```typescript
  if (isHeader) {
    excelCell.value = cellData.text;
  } else {
    ...
    excelCell.value = cellData.text;
  }
  ```
  If an input PDF contains an invoice line item or table text starting with formula triggers such as `=`, `+`, `-`, or `@` (e.g. `=cmd|' /C calc'!A0` or `=HYPERLINK("https://phishing.site", "Account Details")`), ExcelJS writes this literal string. When the user opens the exported `.xlsx` file in Microsoft Excel, Excel evaluates the formula, presenting security warnings or executing external commands via DDE.
- **Reproducible Evidence**:  
  In `src/core/udir/xlsxCompiler.ts`:
  Line 99: `excelCell.value = cellData.text;`
  Line 120: `excelCell.value = cellData.text;`
  No sanitization or quote-prefixing is applied to `cellData.text`.
- **Potential Impact**:  
  Client-side exploitation of end users opening converted spreadsheets (CSV/Formula Injection CWE-1236).
- **Recommended Remediation**:  
  Sanitize text cells that are not genuine formulas by prefixing formula trigger characters with a single quote (`'`):
  ```typescript
  function sanitizeExcelText(text: string): string {
    if (!text || typeof text !== "string") return "";
    if (/^[=+\-@\t\r]/.test(text)) {
      return `'${text}`;
    }
    return text;
  }
  ```
- **Regression Test Recommendation**:  
  Add an automated test in `scripts/verify-phase10d10.ts` passing a PDF cell with `=SUM(1+1)` as plain text and asserting that Mammoth/ExcelJS parses the cell text safely as `"=SUM(1+1)"` without formula execution.

---

### SEC-11A-005: Reflected File Download & Query-Param Base64 Exposure on Download Endpoint
- **Severity**: **Medium**
- **Affected Component**: Express Download Streaming Handler (`server.ts`)
- **File Path**: `/server.ts`
- **Location**: Lines 460–486
- **Technical Explanation**:  
  The endpoint `app.all(["/api/download/file", "/api/download/stream"])` allows GET requests where `fileBase64` is accepted in the query string (`req.query?.fileBase64`). Passing large base64 documents in URL query strings leads to:
  1. Sensitive file bytes leaked into web server access logs, reverse proxy logs, and browser history.
  2. Lack of `mimeType` allowlist validation: an attacker could supply `mimeType=application/x-msdownload` or `text/html`.
- **Reproducible Evidence**:  
  Lines 460–465: `app.all(...)`, reading `req.query?.fileBase64` and `req.query?.mimeType`.
- **Potential Impact**:  
  Information disclosure via server logs; potential abuse of the endpoint as an open file reflection proxy.
- **Recommended Remediation**:  
  Change `app.all` to `app.post`. Require payload in POST JSON body only. Strictly validate `mimeType` against an allowlist (`application/pdf`, `application/vnd.openxmlformats-...`, `image/png`, etc.).
- **Regression Test Recommendation**:  
  Test that `GET /api/download/file` returns HTTP 405 Method Not Allowed.

---

### SEC-11A-006: Invalid CORS Configuration Combining Wildcard Origin with Credentials
- **Severity**: **Medium**
- **Affected Component**: Express CORS Middleware (`server.ts`)
- **File Path**: `/server.ts`
- **Location**: Lines 161–168
- **Technical Explanation**:  
  `server.ts` sets:
  ```typescript
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  ```
  Under W3C Fetch / CORS specifications, `Access-Control-Allow-Origin: *` is invalid when combined with `Access-Control-Allow-Credentials: true`. Modern browsers will reject credentialed cross-origin requests. Furthermore, if credentials are used, the server should reflect only verified origins (`pdfsun.in`, `www.pdfsun.in`, AI Studio development origins).
- **Reproducible Evidence**:  
  Lines 161–168 in `server.ts`.
- **Potential Impact**:  
  Cross-origin cookie/credential authentication failures on compliant browsers; ambiguous CORS policy.
- **Recommended Remediation**:  
  Conditionally set `Access-Control-Allow-Origin` to the specific requesting origin if it matches an approved allowlist, or omit `Access-Control-Allow-Credentials` when `*` is returned for purely public asset endpoints.
- **Regression Test Recommendation**:  
  Validate CORS preflight OPTIONS responses in automated test suite.

---

### SEC-11A-007: Client-Side Entitlement Bypass via Unsigned LocalStorage Manipulation
- **Severity**: **Medium**
- **Affected Component**: Client State Hooks (`useUsageTracker.ts`, `App.tsx`)
- **File Path**: `/src/hooks/useUsageTracker.ts`, `/src/App.tsx`
- **Location**: Lines 350-351 in `useUsageTracker.ts`, lines 241-243 in `App.tsx`
- **Technical Explanation**:  
  Client UI checks pro tier status using `localStorage.getItem("pdfsun_user_is_pro") === "true"` without checking a cryptographically signed server JWT on every tool execution. A user can open developer tools and execute `localStorage.setItem("pdfsun_user_is_pro", "true")` to unhide pro UI badges.  
  (Note: Because client-side tools run in the browser anyway, the primary vulnerability is when this flag is assumed to gate access to backend services like Gemini API without backend verification).
- **Potential Impact**:  
  Bypass of client-side feature flags.
- **Recommended Remediation**:  
  Ensure all Pro gating is backed by server-side verification before executing paid API requests.

---

### SEC-11A-008: Memory Leak from Unrevoked Blob URLs across Transient UI Modals
- **Severity**: **Low**
- **Affected Component**: Client Preview and Download UI
- **File Path**: `src/components/ActiveToolWorkspace.tsx`, `src/components/AservusPdfCompressor.tsx`
- **Location**: `URL.createObjectURL(blob)` calls without matching `URL.revokeObjectURL(url)`
- **Technical Explanation**:  
  When users upload and process large PDFs (e.g. 50MB-100MB), `URL.createObjectURL(blob)` generates an in-memory pointer. If not revoked upon unmount or completion, the browser's V8 heap keeps the entire byte buffer pinned in memory, leading to tab crashes on memory-constrained mobile devices (e.g. iOS WebKit 1.5GB tab limit).
- **Potential Impact**:  
  Client browser crashes during heavy batch processing sessions.
- **Recommended Remediation**:  
  Standardize on `registerGuardedBlobUrl` with automatic cleanup in `useEffect` return hooks.

---

### SEC-11A-009: Cloud Run Staging Revision Missing Active Traffic Allocation (GFE 404)
- **Severity**: **Medium**
- **Affected Component**: Cloud Infrastructure & Staging Release Gate
- **Target URL**: `https://ais-pre-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app/`
- **Technical Explanation**:  
  Probing the staging URL returns an HTTP 404 response generated by the Google Frontend (`server: Google Frontend`, `content-length: 272`). This indicates that no ready Cloud Run revision is mapped to 100% traffic on the staging service `ais-pre-nc2omqrcrewclthjpyezu6`. This is an infrastructure routing state, not an application bug in `server.ts`.
- **Potential Impact**:  
  Pre-production staging verification is blocked until the project administrator deploys or routes traffic to an active revision via the AI Studio UI or Google Cloud Console.
- **Recommended Remediation**:  
  Project administrator should trigger "Publish Preview" in AI Studio or route traffic via Google Cloud Console to restore the staging environment.
