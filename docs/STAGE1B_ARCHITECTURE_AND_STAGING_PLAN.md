# PDFSun.in — CTO Architecture Evaluation, Payload Safety Architecture & Isolated Staging Provisioning Plan

**Document Status**: Stage 1B–1D Engineering Deliverable (Read-Only Evaluation & Planning — No Deployment Authorized)  
**Canonical Product**: PDFSun.in (68 registered PDF & AI utilities: 59 Free, 9 Pro)  
**Primary Owner Policy**: Sole Owner (`mukeshinland79@gmail.com`); Customer (`mukeshkalonia241@gmail.com`)

---

## 1. Phase A — Production Hosting Architecture Evaluation

### 1.1 Architectural Context of PDFSun.in
PDFSun.in is a hybrid web application:
- **Client-side WebAssembly core (59 tools)**: Merge, Split, Compress, Convert, Organize, Edit, Sign, Protect, Unlock, Watermark, Barcode/QR, and Image processing execute inside the user's browser with zero server file uploads.
- **Stateful / Server-assisted Express backend (`server.ts`, ~5,900 LOC)**:
  - Auth & RBAC (`/api/v1/auth/*`, Google ID token verification, HttpOnly JWT sessions, MFA/OTP, CSRF double-submit tokens).
  - Gemini AI document endpoints (`/api/ai/chat`, `/api/ai/summarize`, `/api/ai/translate`, `/api/ai/ocr`, `/api/ai/extract-table`, `/api/ai/resume-*`).
  - Razorpay payment order creation, server-side signature verification, HMAC-verified webhooks (`/api/webhooks/razorpay`), and Firestore billing reconciliation.
  - Real-time analytics streams via WebSocket (`/ws/analytics`) and Server-Sent Events (`/api/analytics/live`).
  - Download proxy & export routes (`/api/download`, `/api/export-file`) plus Owner Admin Suite endpoints (`/api/admin/*`).

### 1.2 Three-Option Comparative Matrix

| Dimension | Option 1: Vercel Serverless + Shared Persistent State (Upstash Redis + Firestore) | Option 2: Vercel Frontend (Static SPA CDN) + Cloud Run Persistent Backend + Shared Redis **(RECOMMENDED)** | Option 3: Cloud Run Full-Stack Hosting (Static + Express Container) |
| :--- | :--- | :--- | :--- |
| **Security & Artifact Isolation** | Static assets in `dist/` cleanly separated from `api/index.ts` (after Stage 1B `dist-server/` fix). Secrets in Vercel Env Vars. However, serverless functions share multi-tenant cold execution environments and require external Redis for every rate-limit/revocation check. | **Strongest boundary**: Vercel serves only static `dist/` (HTML/JS/CSS/WASM) with zero server code or secrets anywhere in the CDN deployment. Cloud Run runs `dist-server/server.cjs` in an isolated IAM-scoped container with GCP Secret Manager, strict CORS/CSRF, and VPC-ready networking. | Good container isolation inside Cloud Run with GCP Secret Manager. Serving static SPA bundles directly from Express increases container CPU/egress load unless fronted by Cloud CDN + Global Load Balancer. |
| **Persistent Sessions & Distributed State** | Stateless per-invocation functions — every session revocation check and rate-limit increment requires an external Redis/Firestore network hop; no warm in-memory L1 cache survives cold starts. | **Optimal**: Shared Upstash Redis / Cloud Memorystore provides authoritative cross-replica rate limits & token revocation, while long-lived warm Cloud Run instances maintain low-latency connection pools and local L1 revocation caching. | Identical backend session & Redis characteristics to Option 2, with single-origin cookie simplicity (no cross-domain cookie configuration). |
| **PDF Workload & File Size Compatibility** | **Hard 4.5 MB request/response body cap** (non-configurable) — base64 OCR images >3.3 MB fail at the Vercel edge with 413. Function timeout caps (10s Hobby / 60s Pro). | **High (Native)**: Supports up to 32 MB HTTP/1.1 or streaming payloads on Cloud Run (configurable up to 60 min timeout) + direct-to-GCS V4 Signed URLs for 100 MB+ OCR/AI jobs. 59 WASM tools remain 100% browser-local. | **High (Native)**: Same Cloud Run container payload & timeout flexibility as Option 2. |
| **WebSockets & SSE** | **Incompatible**: Vercel Serverless Functions do not support persistent WebSocket upgrades (`/ws/analytics`) and terminate long-lived SSE (`/api/analytics/live`). | **Full Native Support**: Cloud Run natively supports HTTP/1.1 & HTTP/2 WebSockets (`/ws/analytics`) and long-lived SSE (`/api/analytics/live`) up to 3600s request timeouts. | **Full Native Support**: Native WebSockets & SSE inside the same container. |
| **Cold Starts & Performance** | Fastest global static TTFB via Vercel Edge CDN. Heavy serverless cold starts (300ms–1.8s) on bundled Express (`server.ts` + Firebase + `@google/genai`). | **Best overall**: Global sub-50ms static asset delivery via Vercel Edge CDN + warm Cloud Run instances (`min-instances=1` in prod eliminates cold starts) colocated in `asia-south1` (Mumbai) near Firestore & Razorpay. | Good API latency with `min-instances=1`, but static assets (JS/WASM/fonts) suffer higher global latency outside `asia-south1` unless Cloud CDN + External HTTPS Load Balancer is provisioned. |
| **Observability** | Vercel Function logs (short retention on lower tiers; fragmented across ephemeral invocations; limited structured APM). | **Enterprise-grade**: Cloud Logging (structured JSON), Cloud Monitoring (CPU/RAM/latency/429 alerts), Cloud Trace, and Cloud Run Error Reporting + Vercel Web Analytics for frontend edge delivery. | Unified Cloud Logging, Cloud Monitoring, and Cloud Trace across static + API in a single GCP project. |
| **Operational Complexity** | Low deployment count (1 platform), but **high debugging friction** for 4.5 MB 413 errors, serverless timeout drops on large OCR PDFs, and broken WebSockets/SSE. Requires external Upstash Redis regardless. | **Moderate & Clean**: Two well-defined surfaces (Vercel Git preview for static SPA; Cloud Run container via Cloud Build/Artifact Registry for API). Clear blast-radius separation: frontend UI changes never restart backend sessions or WebSocket streams. | **Lowest platform count** (1 GCP project, 1 Dockerfile), moderate if adding Cloud CDN + Load Balancer + custom SSL/Cloudflare edge caching. |
| **Scalability** | Auto-scales per request, but hits concurrent connection & payload walls on heavy AI OCR and long-running document jobs; every instance needs Redis round-trips. | **Excellent**: Vercel CDN absorbs arbitrary static traffic spikes globally; Cloud Run auto-scales horizontally by concurrency (e.g., 80 concurrent requests/instance, max 20+ instances) with shared Redis (Upstash or Memorystore) for consistent multi-replica rate limits and token revocation. | Very good horizontal auto-scaling on Cloud Run; static traffic consumes container concurrency unless offloaded to Cloudflare/Cloud CDN. |
| **Estimated Monthly Cost (Staging + Prod Baseline)** | Vercel Pro ($20/seat/mo) + Upstash Redis ($0–$10/mo) + Firestore ($0–$15/mo) = **~$20–$45/mo** (risk of bandwidth/function duration overages). | Vercel Hobby/Pro ($0–$20/mo) + Cloud Run (`min-instances=0` staging ~$2/mo; `min-instances=1`, 1 vCPU / 512 MiB prod ~$18–$28/mo) + Upstash Redis ($0–$10/mo) + Firestore ($0–$15/mo) = **~$25–$70/mo** predictable. | Cloud Run (`min-instances=1` prod + staging ~$20–$32/mo) + Upstash Redis ($0–$10/mo) + Firestore ($0–$15/mo) + optional Cloud Load Balancer + CDN (+$20–$35/mo) = **~$35–$90/mo**. |

### 1.3 CTO Architecture Recommendation

**RECOMMENDATION: Option 2 — Vercel Edge CDN (Static Frontend SPA) + Google Cloud Run (Persistent Express Backend) + Shared Persistent Redis (Upstash Redis REST / Memorystore) + Firebase Firestore.**

#### Documented Technical Rationale
1. **Eliminates Vercel Serverless Incompatibilities**: PDFSun's Express backend already uses WebSockets (`/ws/analytics`), SSE (`/api/analytics/live`), multi-chunk Gemini AI translation/OCR pipelines, and file export proxies. Option 1 breaks WebSockets/SSE and enforces a hard 4.5 MB payload cap.
2. **Maximum Security Boundary**: Vercel deploys ONLY static frontend assets (`dist/`), verified by `scripts/verify-build-output.ts`. Backend bundles (`dist-server/server.cjs`), Firebase Admin credentials, Razorpay webhook secrets, JWT/Admin keys, and Gemini API keys reside exclusively inside Cloud Run + GCP Secret Manager.
3. **Regional Colocation & Speed**: Running Cloud Run in `asia-south1` (Mumbai) colocates Express directly alongside the Firestore database and Indian payment gateways (Razorpay), while Vercel Edge CDN delivers WebAssembly PDF binaries globally.
4. **Migration Safety**: Zero immediate migration is performed in Stage 1B. Meanwhile, the repository remains 100% compatible with BOTH Option 2 (`Dockerfile` -> `dist-server/server.cjs`) AND Option 1 (`api/index.ts` with runtime-enforced 4 MB Vercel payload guard) so no existing workflows break.

*(Fallback Note: If single-vendor simplicity under GCP is later prioritized over Vercel Preview URLs, Option 3 behind Cloudflare CDN is a clean secondary alternative using the exact same `Dockerfile`.)*

---

## 2. Vercel 4.5 MB Payload Constraint & Safe Large-File Upload Architecture

### 2.1 The Platform Constraint
Vercel Serverless Functions enforce a **hard 4.5 MB HTTP request and response body limit** (non-configurable). In addition, Base64 encoding of binary files adds **~33% overhead** — meaning a raw 3.5 MB scanned PDF or high-DPI PNG becomes ~4.67 MB when serialized as JSON `imageBase64`, triggering an ungraceful platform-level `413 FUNCTION_PAYLOAD_TOO_LARGE` failure before Express can even respond.

### 2.2 Immediate Stage 1B Safeguard (Implemented in `server.ts`)
- `server.ts` dynamically selects `RUNTIME_BODY_LIMIT = process.env.VERCEL === "1" ? "4mb" : "50mb"` and exposes `services.payloadLimitMb` in `/api/health`.
- An Express error middleware intercepts `entity.too.large` / HTTP `413` errors and returns a structured JSON response (`code: "PAYLOAD_TOO_LARGE"`, `maxPayloadLimit`, and actionable user guidance) instead of an HTML crash page.

### 2.3 Target Safe Large-File Architecture (For Staging / Production)
| Workload Category | Tools Affected | Safe Architecture | Max Supported File Size |
| :--- | :--- | :--- | :--- |
| **Client-Side WASM PDF Tools** | 59 of 68 tools (Merge, Split, Compress, Protect, Unlock, Edit, Sign, Barcode, QR, Conversions) | **100% Local Browser Processing** — files never cross the network or hit Vercel/Cloud Run. | Limited only by browser RAM (up to plan cap: 15 MB Free / 2 GB Pro). |
| **AI Text Tools** | AI Chat, Summarize, Translate, Flashcards, Notes, Grammar, Explain, Resume | **Client-Side Text Extraction + Chunked JSON** — extract text locally via `pdfjs-dist`, slice into ≤25,000-char UTF-8 chunks (~25–50 KB JSON), never upload the raw PDF binary. | Unlimited PDF size (text chunks always <200 KB). |
| **AI Vision / Scanned OCR & Table Extraction** | AI OCR (`/api/ai/ocr`), Image-to-Excel (`/api/ai/extract-table`) | **Phase 1 (Immediate)**: Client-side canvas downscaling/WebP/JPEG compression per page (keeps per-page image <1.5 MB) and sequential page batching.<br>**Phase 2 (Cloud Run + Signed GCS Uploads)**: Direct-to-object-storage V4 Signed Upload URLs with strict server-side validation, malware scanning, async job orchestration, and guaranteed short-TTL deletion. | Up to 100 MB+ scanned documents with zero Vercel 4.5 MB bottleneck and zero persistent storage retention. |

### 2.4 Direct-to-Object-Storage Security Controls (Future Staging/Prod Target — Not Implemented in Stage 1B)
1. **Signed Upload URLs**: Cloud Run issues single-use V4 Signed PUT URLs (`TTL <= 300s`) bound to exact `Content-Type`, exact `Content-Length` ceiling, and a random UUID object key (`tmp-uploads/{userId}/{jobId}`) — never user-supplied paths.
2. **File Type Verification**: Double validation — client MIME pre-check PLUS server/worker magic-byte inspection (`%PDF-`, PNG `\x89PNG`, JPEG `\xFF\xD8\xFF`, WebP `RIFF....WEBP`) rejecting polyglot/script/executable disguised uploads before processing.
3. **File Size Enforcement**: Signed URL `x-goog-content-length-range` enforces exact plan caps at the GCS edge (15 MB Free, up to plan cap for Pro/Enterprise) so oversized payloads are dropped before reaching Cloud Run compute.
4. **Malware Scanning Integration Point**: GCS `google.cloud.storage.object.v1.finalized` Eventarc trigger routes uploaded objects to an isolated ClamAV Cloud Run scanner service (or GCP Cloud DLP/VirusTotal enterprise hook). Unscanned or `INFECTED` objects are quarantined/deleted immediately and never forwarded to OCR/AI workers.
5. **Processing Job Orchestration**: Cloud Tasks / Pub/Sub dispatches verified `CLEAN` job references to stateless Cloud Run worker revisions with idempotency keys, per-user concurrency caps, and bounded retries (no silent truncation).
6. **Secure Temporary File Cleanup**: Dual-layer deletion — (a) worker explicitly deletes the GCS object in a `finally` block immediately after streaming output, and (b) GCS Bucket Lifecycle Rule automatically hard-deletes any orphaned object older than **15 minutes** (with Object Versioning disabled).

---

## 3. Distributed Rate Limiting & Token Revocation Design

### 3.1 Architecture Implemented in Stage 1B (`src/server/distributedStateStore.ts`)
- Defined clean interfaces: `SharedRateLimitStore` (`consumeWindow`) and `SharedTokenRevocationStore` (`revokeToken`, `isTokenRevoked`).
- Implemented `UpstashRedisRestStore` using native `fetch` (zero additional npm dependencies) with atomic `INCR` + `PTTL`/`PEXPIRE` pipelines for fixed-window rate limits and `SET EX` / `GET` for SHA-256 token revocation checks.
- Implemented fail-safe production behavior: when `NODE_ENV === "production"` and Redis is configured, `isTokenRevoked` fails **closed** (`returns true`) if the Redis lookup fails/times out so potentially revoked owner/user tokens cannot be replayed during a store outage.
- Implemented explicit fail-honest diagnostics (`getDistributedStateDiagnostics()`), surfaced in `/api/health`:
  - When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present: `mode: "upstash-redis-rest"`, `distributedReliable: true`.
  - When unconfigured (local dev / current container): `mode: "process-local-memory"`, `distributedReliable: false`, with explicit `statusNote` advising Redis configuration prior to multi-instance/serverless rollout.
- Integrated into:
  - `src/server/trafficProtection.ts` (emits `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on all rate-limited API requests and routes counters through shared Redis when configured).
  - `src/server/middleware/adminAuth.ts`, `src/server/authRoutes.ts`, and `server.ts` (`verifyDualOwnerAccess`, `handleVerifySession`, `handleRefreshSession`, and `adminAuth` replicate revocations and check `isRevokedAdminOrSessionTokenAsync`).

### 3.2 Honest Runtime Status
- **Code & Adapter Readiness**: `PASS` (unit-tested and strictly typed).
- **Multi-Instance Runtime Consistency**: `BLOCKED` until an external staging Upstash Redis (or GCP Memorystore) instance is provisioned and configured via environment variables. Process-local Maps are NEVER claimed to be globally consistent across serverless instances or multiple Cloud Run replicas.

---

## 4. Phase C — Isolated Staging Environment Provisioning Plan

**STRICT RULE**: Do NOT execute any step below until explicit CTO/Owner staging provisioning authorization is granted. Zero production credentials, databases, webhooks, or user records may ever be reused in staging.

### 4.1 Environment Isolation Matrix

| Component | Production (DO NOT TOUCH) | Isolated Staging Target | Isolation Safeguard |
| :--- | :--- | :--- | :--- |
| **Frontend Preview Host** | `https://pdfsun.in` / `https://www.pdfsun.in` | Dedicated Vercel Preview/Staging Project (`staging.pdfsun.in` or `pdfsun-staging.vercel.app`) with Vercel Deployment Protection / Basic Auth + `X-Robots-Tag: noindex, nofollow` | Separate Vercel project; robots blocked so search engines never index staging. |
| **Backend Runtime** | Production API | Dedicated Cloud Run Service `pdfsun-api-staging` in `asia-south1` (`min-instances=0`, `max-instances=3`, `NODE_ENV=production`) | Separate GCP service account (`pdfsun-staging-sa`) with IAM access restricted ONLY to staging resources. |
| **Firebase Project & Firestore DB** | Production Firestore (`ai-studio-pdfsun-e0caf114-300b-43d2-802a-29f68a091c7f`) | **Brand-new Firebase Project** `pdfsun-staging` with its own Firestore database and deployed `firestore.rules` | Zero cross-project IAM permissions; zero production user/payment data copied. |
| **Shared Persistent State (Redis)** | Production Redis (future) | Dedicated Upstash Redis staging DB (`pdfsun-staging-redis`, free tier, `ap-south-1`) | Separate `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` stored in GCP Secret Manager. |
| **Google OAuth Client** | Production OAuth Client | Separate OAuth 2.0 Web Client (`PDFSun Staging OAuth`) with authorized JS origins & redirect URIs restricted exclusively to the staging domain | Prevents staging tokens from authenticating against production or vice versa. |
| **JWT & Admin Secrets** | Production secrets | Fresh CSPRNG 256-bit `JWT_SECRET` + distinct CSPRNG 256-bit `ADMIN_SECRET_KEY` + distinct `MFA_ENCRYPTION_KEY` | Generated via `openssl rand -hex 32`; stored exclusively in GCP Secret Manager (staging). |
| **Razorpay Payments** | Live Mode (`rzp_live_*`) | **Razorpay Test Mode ONLY** (`rzp_test_*` key ID, test key secret, dedicated staging test webhook URL & webhook secret) | Backend asserts `RAZORPAY_KEY_ID.startsWith("rzp_test_")` when `APP_ENV=staging`. |
| **Email / SMTP** | Production SMTP | **Disabled OR Sandbox Trap** (Mailtrap / Ethereal / `SMTP_ENABLED=false`) | Zero real customer emails can ever be dispatched from staging. |
| **Gemini API Key** | Production key | Dedicated restricted staging Gemini API key with low daily spend cap | Billing alarm at $5/month. |
| **Test Identities (Synthetic Only)** | Real Owner (`mukeshinland79@gmail.com`) & Customer (`mukeshkalonia241@gmail.com`) | Synthetic Staging Owner (`staging-owner@pdfsun.test` configured via staging `OWNER_EMAILS` env var or isolated staging Google test account) + Synthetic Free/Pro Customers (`staging-free@pdfsun.test`, `staging-pro@pdfsun.test`) | Never touch or reset production owner/customer accounts. |

### 4.2 Staging Verification Gate (Post-Provisioning)
Once staging provisioning & deployment are authorized, the staging verification run will validate:
1. `GET /api/health` returns `distributedState.distributedReliable === true` (`mode: "upstash-redis-rest"`).
2. Live HTTPS cookie verification (`Secure`, `HttpOnly`, `SameSite=Lax` for user / `SameSite=Strict` for admin).
3. Cross-origin CSRF rejection (`403`) from an external origin + valid double-submit CSRF pass from staging origin.
4. Cross-instance rate limiting & token revocation verified across ≥2 Cloud Run revisions/instances via shared Redis.
5. Razorpay Test Mode checkout + HMAC webhook verification + Firestore staging ledger sync (exact INR amount, zero duplication).
6. Headless Playwright E2E suite (desktop + mobile viewports) across auth, RBAC, Free vs Pro entitlements, all 68 tool routes, dark/light themes, and SEO metadata.
7. k6/autocannon baseline load test (P50/P95 latency, 429 rate-limit thresholds, memory stability).
