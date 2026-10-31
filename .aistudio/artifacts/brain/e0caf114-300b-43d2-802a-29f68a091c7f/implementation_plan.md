# PDFSun.in — Phase 11 Ultimate Master Execution Plan
## Universal Tool Reliability, File Processing & Conversion Excellence

**System Role:** Unified Elite Engineering Team (Principal Architect, AppSec Lead, Cloud Run DevOps, PDF Specialist, Independent QA Lead)  
**Canonical Domain:** `https://www.pdfsun.in/`  
**Production Status:** **STRICTLY FROZEN — ABSOLUTELY ZERO MODIFICATIONS**  
**Execution Context:** Authorized Local Development Workspace (`port: 3000`)

---

## 1. Executive Summary & Non-Negotiable Production Boundary

The canonical production system `https://www.pdfsun.in/` is **strictly frozen**. All operations, code modifications, and testing must execute solely inside the authorized local development environment.
- **Zero Production Operations:** No deployments, traffic shifts, DNS modifications, database writes, rule deployments, or secret access.
- **Zero Server-Upload Paradigm:** PDFSun's 100% browser-side computing architecture (via WASM, Web Workers, `pdf-lib`, `pdfjs-dist`, `xlsx`, `docx`, `pptxgenjs`, `tesseract.js`) is strictly preserved across all 66 registered tools. No mandatory cloud file uploads or paid APIs will be introduced.

---

## 2. Infrastructure Identity & Environment Baseline (Stage 2)

| Environment / Component | Actual Identifier & Location | Verified Status |
|---|---|---|
| **Production Cloud Run Service** | Project `tangential-stratum-43bk6`, Region `asia-southeast1`, Service `pdfsun` | **STRICTLY FROZEN** — Untouched |
| **Production Canonical URL** | `https://www.pdfsun.in/` | **STRICTLY FROZEN** — Untouched |
| **Firebase / Firestore Project** | Project `pdfsun-app`, Database ID `ai-studio-pdfsun-e0caf114-300b-43d2-802a-29f68a091c7f` | **FROZEN** — No rule deploys or writes |
| **Local Development Workspace** | Node.js v22.23.4, Express, Port 3000 | **Authorized Isolated Scope** |

---

## 3. Pre-Implementation Safety & Rollback Protection

Before modifying any source code:
1. Create a scoped recovery snapshot for only the Phase 11 files (`server.ts`, `src/lib/fetchInterceptor.ts`, `src/lib/pdfEngine.ts`, `src/components/ActiveToolWorkspace.tsx`, `src/components/DownloadQrCodeGenerator.tsx`) at `patches/phase11-pre-remediation-baseline.patch`.
2. Existing uncommitted user changes and prior phase fixes (Phase 10D, 11B, 11D) are preserved.
3. Baseline test verification confirmed: TypeScript compiler diagnostics and prior regression scripts are recorded.

---

## 4. Controlled Implementation Scope (Stage 3)

### A. `server.ts` — API Reliability, Proxy Security & Rate Limiting
1. **Proxy & IP Trust (`app.set("trust proxy", 1)`)**:
   - On Google Cloud Run, Google Frontend (GFE) acts as the single reverse proxy. `server.ts` trusts only 1 upstream hop (`trust proxy: 1`), and `getClientIp(req)` strictly utilizes `req.ip` validated by Express, preventing IP spoofing via crafted client `X-Forwarded-For` headers.
2. **`POST /api/analytics/record-conversion`**:
   - Strict payload validation: `{ latencyMs: number, success: boolean }`.
   - Bounds: `1 <= latencyMs <= 300000`, boolean `success`. Rejects unknown keys, strings, or PII with `400 Bad Request`.
   - Privacy: Zero storage or logging of filenames, document contents, or user data.
   - Sliding Rate Limit: 120 req/min per IP.
   - Response: `200 OK` `{ success: true, timestamp: ISO }`.
3. **`GET /api/analytics/stats`**:
   - Metrics Integrity: `activeUsers` sources directly from `activeWebSocketClients.size`. If 0 WebSockets, it **reports 0** (zero artificial floors or fake numbers).
   - `processingSpeed`: Exponential moving average (EMA) of valid conversion latencies.
   - `successRate`: Exact calculated ratio `(successfulConversions / Math.max(1, totalConversions)) * 100`.
   - Response: `200 OK` `{ success: true, data: { activeUsers, processingSpeed, successRate, totalConversionsToday, timestamp } }`.
4. **`POST /api/history/engagement`**:
   - Minimized Schema: `{ eventId: string, type: 'view'|'read'|'like'|'unlike'|'share'|'copy'|'download'|'quiz_attempt', dateKey?: string }`.
   - Validation: Rejects malformed IDs, unknown types, or extra keys (`400 Bad Request`).
   - Sliding Window Deduplication: Cache key `clientIp:eventId:type` with 60-second TTL to prevent duplicate counting.
   - Rate Limit: 60 req/min per IP.
   - Response: `200 OK` `{ success: true }`.
5. **`POST /api/r2/presigned-url`**:
   - Fails closed with `503 Service Unavailable` and structured error code `R2_STORAGE_NOT_CONFIGURED` when R2 credentials are absent. Zero dummy URLs.

### B. `src/lib/fetchInterceptor.ts` — Precise Error Classification
- Classify `/api/analytics/*`, `/api/history/engagement`, and `/api/telemetry/*` as non-blocking background telemetry.
- Suppress error toasts for non-blocking background telemetry failures only, ensuring background network hiccups never display an error over a successful document operation.
- **Do NOT** classify `/api/r2/*` as non-blocking background telemetry: user-initiated storage actions must retain genuine error notifications.
- Preserve all user-facing error toasts for document downloads (`/api/download/file`), payments (`/api/razorpay/*`), authentication (`/api/auth/*`), and AI transformations (`/api/ai/*`).

### C. `src/lib/pdfEngine.ts` — Filename Normalization & CSV Extension Security
- In `ensureValidFilename()`:
  - Check `mimeType.includes("csv")` **before** generic `text` MIME types, ensuring `.csv` extension is assigned for `text/csv`.
  - Sanitize against directory traversal (`..`, `/`, `\`), control characters, null bytes, and CRLF injection.
  - Preserve valid extensions for `.xlsx`, `.docx`, `.pptx`, `.pdf`, `.zip`, `.txt`, `.rtf`, `.png`, and `.jpg`.

### D. `ActiveToolWorkspace.tsx` & `DownloadQrCodeGenerator.tsx` — Native Sharing & Honest Mobile UX
- Remove misleading `#download=` URL.
- QR code points to `${getPublicSiteUrl()}/${tool.slug}` with explicit copy: *"Scan to open this tool on your phone"*.
- Verified Native File Sharing:
  ```typescript
  if (typeof navigator.share === "function" && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ title: fileName, files: [file] });
  }
  ```
  Falls back gracefully to direct same-device download and clipboard tool link copying on desktop or unsupported devices.
- Clear privacy copy: *"Your document was processed locally in your browser and was never uploaded to our servers."* Zero silent cloud uploads.

---

## 5. Automated Verification & Regression Testing Matrix (Stage 4)

We will execute the complete test suite via `scripts/verify-phase11-universal-reliability.ts`:

| Test Group | Test Target | Verification Criteria | Status |
|---|---|---|---|
| **API Validation** | `POST /api/analytics/record-conversion` | Valid `{ latencyMs: 145, success: true }` returns 200; malformed/extra keys return 400 | Pending Approval |
| **Metrics Integrity** | `GET /api/analytics/stats` | Sourced from real metrics; activeUsers is 0 when 0 WebSockets; zero fake figures | Pending Approval |
| **Engagement API** | `POST /api/history/engagement` | Minimized schema accepted; invalid enum returns 400; 60s duplicate deduplicated | Pending Approval |
| **R2 Storage Safety** | `POST /api/r2/presigned-url` | Fails closed with 503 `R2_STORAGE_NOT_CONFIGURED`; zero fake URLs | Pending Approval |
| **Fetch Interceptor** | `src/lib/fetchInterceptor.ts` | Background telemetry does not trigger toasts; `/api/download/file` & `/api/r2/*` failures do | Pending Approval |
| **Filename & CSV** | `src/lib/pdfEngine.ts` | CSV produces `.csv`; directory traversal (`../../etc/passwd`) sanitized to `etc_passwd.pdf` | Pending Approval |
| **Formula Injection** | XLSX / CSV Export | `=,+,-,@,TAB` sanitized; legitimate negative numbers preserved | Pending Approval |
| **Proxy / IP Spoofing** | Cloud Run Proxy | `getClientIp` relies on `trust proxy: 1` `req.ip`; spoofed `X-Forwarded-For` rejected | Pending Approval |
| **66 Tools Audit** | `src/data/toolsData.ts` | All 66 tools map to active handlers/workspaces with 0 dangling routes | Pending Approval |
| **Prior Regressions** | Phase 10D, 11B, 11D | 100% passing across Razorpay, Firestore RBAC, rate limiter, and JWT engines | Pending Approval |
| **Compilation Gate** | TypeScript & Build | `npx tsc --noEmit` returns 0 errors; `compile_applet` succeeds cleanly | Pending Approval |

---

## 6. Release Governance (Stage 5)

Implementation completion does **not** authorize production release:
- Status will be set to: `IMPLEMENTATION VERIFIED — READY FOR OWNER REVIEW`.
- **NO DEPLOYMENT. NO TRAFFIC PROMOTION. PRODUCTION REMAINS STRICTLY FROZEN.**

---

**READY FOR CONTROLLED LOCAL IMPLEMENTATION.**
