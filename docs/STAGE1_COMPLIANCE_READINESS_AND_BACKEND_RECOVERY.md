# PDFSun.in — Stage 1: Backend API Recovery, Privacy Truthfulness & Compliance Readiness Architecture

**Document Version:** 1.0 (Stage 1 Deliverable)  
**Scope:** Live Backend `/api/*` Recovery, Dual-Mode Privacy Architecture, ISO/IEC 27001, SOC 2, HIPAA, GDPR Readiness & Verified Processing Telemetry Architecture  
**Canonical Domain:** `https://www.pdfsun.in`  
**Owner Policy:** Sole Owner (`mukeshinland79@gmail.com`); `mukeshkalonia241@gmail.com` remains a customer account.  
**Certification Notice:** This document establishes engineering controls and audit readiness frameworks. External certification claims (ISO 27001, SOC 2 Type I/II, HIPAA Compliance) MUST NOT be claimed publicly until formally audited, legally assessed, and certified by accredited independent bodies.

---

## 1. Live `/api/*` HTTP 404 Root Cause Analysis & Production Recovery Runbook

### 1.1 Verified Root Cause on `https://www.pdfsun.in/`
During Stage 1 live inspection:
- `GET https://www.pdfsun.in/` returned `HTTP 200` served via Cloudflare + Vercel CDN (`x-vercel-cache: HIT`).
- `GET https://www.pdfsun.in/api/health` returned `HTTP 404` (`79 bytes`, `404: NOT_FOUND`).

**Exact Technical Causes Identified:**
1. **Missing Vercel Serverless Entry Point:** `vercel.json` previously routed `^/api/(.*)$ -> /api/$1`, while the repository had **no `/api` directory or Vercel serverless handler**. The full Express backend lived exclusively in `server.ts` (bundled into `dist/server.cjs` for Node/Docker).
2. **Invalid Mixed Vercel Configuration:** `vercel.json` previously combined modern `"headers"` with legacy `"routes"` (deprecated/conflicting under Vercel v2 schema).
3. **Production Dev-Dependency Import Risk:** `server.ts` imported `createServer as createViteServer` statically from `"vite"` at line 8, risking cold-start crashes in production environments where `devDependencies` are omitted.
4. **Express Rate-Limiter Path Coverage Gap:** `server.ts` mounted the `authEndpoints` sliding rate limiter only on `/api/auth`, leaving `/api/v1/auth` and `/api/admin/auth` without sliding-window rate-limiting despite mounting `authRouter` on all three prefixes. Similarly, `/api/translate` lacked the `aiEndpoints` sliding-window rate limiter.

### 1.2 Stage 1 Code-Level Remediation Completed
- Created `/api/index.ts` as the Vercel Serverless Function adapter mounting the canonical Express `app` exported from `server.ts` without binding a TCP port (`if (!process.env.VERCEL && process.env.PDFSUN_DISABLE_AUTO_LISTEN !== "1")`).
- Replaced conflicting legacy `routes` in `/vercel.json` with valid Vercel v2 `headers` + `functions` (`maxDuration: 60` for `api/index.ts`) + `rewrites` (`/api/(.*) -> /api`, SPA fallback excluding `/api/*`, `/assets/*`, and files with extensions).
- Converted `vite` import in `server.ts` to lazy dynamic `await import("vite")` strictly inside `NODE_ENV !== "production"`.
- Mounted `authSlidingLimiter` across `/api/auth`, `/api/v1/auth`, and `/api/admin/auth`, and `aiSlidingLimiter` across `/api/ai` and `/api/translate`.
- Enriched `/api/health` with non-sensitive boolean readiness flags (`services.aiConfigured`, `services.paymentGatewayConfigured`, `services.authGoogleEnabled`) and removed the dead duplicate `/api/health` definition.

### 1.3 Production Deployment Architecture Options (Requires Separate Owner Approval Before Deployment)
- **Option A — Vercel Full-Stack (Static CDN + `/api/index.ts` Serverless):** Uses the updated `vercel.json` and `/api/index.ts`. Best for zero-ops CDN + API routing. Note: serverless functions are stateless; persistent data MUST remain in Firebase Firestore (not local ephemeral JSON files).
- **Option B — Google Cloud Run / Container (`Dockerfile` + `node dist/server.cjs`) Behind Cloudflare/Nginx:** Recommended for WebSocket (`/ws/analytics`), long-running SSE telemetry (`/api/analytics/live`), and sustained 20,000+ daily global visitors with autoscaling containers.

### 1.4 Required Production Environment Variables Checklist (Configure in Hosting Secret Manager — Never Commit Values)
| Variable | Purpose | Required For |
| --- | --- | --- |
| `NODE_ENV=production` | Enforces production security guards & static serving | All deployments |
| `APP_URL=https://www.pdfsun.in` | Canonical origin & WebAuthn RP derivation | Auth, SEO, Emails |
| `GEMINI_API_KEY` | Google Gemini API server-side proxy key | AI Chat, Summary, OCR, Translate, Resume |
| `JWT_SECRET` | 64+ char cryptographically random HMAC secret | User & session JWTs |
| `ADMIN_SECRET_KEY` | 32+ char cryptographically random admin key | Owner/Admin session & audit APIs |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Live Razorpay checkout & HMAC webhook verification | Billing & Subscriptions |
| `RAZORPAY_*_PLAN_ID` | Plan IDs matching pricing tiers | Subscriptions |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Transactional OTP, security alerts, feedback mail | MFA / Password recovery |
| `FIREBASE_*` / Service Account (if Cloud Run) | Persistent Firestore database access | Accounts, Payments, Audit logs |

---

## 2. Dual-Mode Privacy Architecture (Local WASM vs. Optional Cloud AI)

PDFSun operates two strictly separated processing paths that MUST always be communicated transparently across all public copy, UI badges, dropzones, FAQs, and structured data:

| Processing Mode | Tools Covered | Data Flow | Storage & Retention |
| --- | --- | --- | --- |
| **Local Browser (WASM)** | Core PDF tools (Merge, Split, Compress, Rotate, Protect, Unlock, Watermark, Reorder, Page Numbers, Edit, Sign, Barcode/QR, Converters) | Executes 100% inside the user's browser memory/sandbox via WebAssembly & Web Workers. **Zero file upload to PDFSun servers.** | Works offline after load; file bytes never leave the device. |
| **Optional Cloud AI (Google Gemini API)** | AI Chat with PDF, AI Summary, AI Translate, AI Notes, AI Flashcards, AI Explain, AI OCR PRO, AI Resume Builder | Browser extracts text/selected page image and sends only the active payload over **encrypted TLS HTTPS** to PDFSun's server-side proxy -> Google Gemini API. | Transient in-memory processing only; no persistent user document storage on PDFSun servers; user must explicitly select an AI tool (single-file Hero drop no longer auto-routes to AI). |

---

## 3. ISO/IEC 27001:2022 ISMS Readiness Checklist

**Current Public Wording:** `ISO 27001 Readiness • GDPR Controls` / `ISO 27001 Readiness Framework`  
**Cannot Claim "ISO 27001 Certified" Until:** Stage 1 & Stage 2 external audits are completed by an accredited certification body (e.g., BSI, TÜV, SGS, DNV).

| ISO 27001 Clause / Annex A Control | Current Engineering Baseline | Remaining Readiness & Audit Requirement |
| --- | --- | --- |
| **Clauses 4–5: Context & Leadership** | Sole-owner governance (`mukeshinland79@gmail.com`) | Formally sign & version-control an Information Security Policy (ISP) and define ISMS Scope Statement. |
| **Clause 6: Risk Assessment & Treatment** | Threat model covers auth, billing, AI proxy, and client WASM | Maintain a formal Risk Register with likelihood/impact scoring, Risk Treatment Plan (RTP), and Statement of Applicability (SoA). |
| **Annex A.5.9–5.12: Asset Inventory** | GitHub repo, Vercel/Cloud Run, Firebase Firestore, Razorpay, Gemini API | Maintain a living Asset & Data Classification Inventory with assigned owners. |
| **Annex A.5.15–5.18 / A.8.2–8.5: Access Control & IAM** | Role-based auth, sole-owner boundary, HttpOnly signed sessions, fail-closed admin middleware | Enforce MFA on all cloud/hosting/GitHub/Firebase/Razorpay accounts; perform quarterly access reviews with dated evidence logs. |
| **Annex A.8.9–8.12 / A.8.24: Cryptography & Configuration** | HTTPS/TLS, HSTS, AES-256 PDF encryption, bcrypt/scrypt password hashing, HMAC webhook verification | Document key rotation schedule (90/180 days) and automated secret scanning in CI. |
| **Annex A.8.15–8.16: Logging & Monitoring** | Immutable owner payment audit logs, admin system error logs, sliding-window rate limiters | Export tamper-evident centralized logs (e.g., Cloud Logging/SIEM) with >= 365-day retention and automated anomaly alerts. |
| **Annex A.5.24–5.28: Incident Response** | Security guards and emergency purge routines exist | Publish written Incident Response Plan (IRP), severity SLA matrix, and run annual tabletop drill with post-mortem records. |
| **Annex A.5.29–5.30: Business Continuity & DR** | Firestore managed persistence + Docker/Vercel reproducible builds | Schedule automated Firestore exports, document RPO/RTO targets, and execute semi-annual restore tests with evidence. |
| **Annex A.5.19–5.22: Supplier / Vendor Risk** | Google Cloud/Firebase, Gemini API, Razorpay, Vercel, Cloudflare | Collect annual SOC 2 / ISO 27001 reports and DPAs from each critical subprocessor. |
| **Clauses 9–10: Internal Audit & Management Review** | Automated QA/security test suite (`scripts/run-tests.ts`) | Conduct formal Internal ISMS Audit and Management Review meeting minutes prior to external Stage 1/2 certification audit. |

---

## 4. SOC 2 Trust Services Criteria (TSC) Readiness Matrix

**Current Public Wording:** `SOC 2 Readiness • GDPR Controls`  
**Cannot Claim "SOC 2 Certified / Type II Compliant" Until:** An independent licensed CPA firm completes an AICPA SOC 2 Type I (point-in-time) and Type II (3–12 month observation window) examination.

| Trust Services Criterion | Control Objectives & Technical Evidence | Gap to Close Before Type I / Type II Audit |
| --- | --- | --- |
| **CC1–CC5: Security (Common Criteria)** | Express security headers, rate limiters across all auth/AI routes, fail-closed admin auth, Firestore rules | Formalized change-management workflow (PR reviews + CI gates + deployment approvals), vulnerability scanning (`npm audit` / SAST / Dependabot), and annual third-party penetration test. |
| **A1: Availability** | `/api/health` readiness probe, CDN static delivery, client-side WASM resilience | External uptime monitoring (e.g., UptimeRobot / Cloud Monitoring), incident status page, documented SLA targets backed by measured uptime history. |
| **PI1: Processing Integrity** | Deterministic client PDF engines, idempotency middleware (`idempotencyMiddleware.ts`), Razorpay HMAC signature verification | Automated regression suites running in CI on every release with archived test-run artifacts. |
| **C1: Confidentiality** | Local WASM zero-upload processing; ephemeral TLS-only Gemini AI inference; no user file persistence in localStorage or disk | Formal Data Classification & Disposal Policy + automated secret rotation & environment separation (dev/staging/prod). |
| **P1–P8: Privacy** | Explicit Local vs. Cloud AI UI distinction (`PrivacyBadge.tsx`, Hero tool chooser), Privacy Policy, Cookie Policy | Self-service account export & deletion workflow (DSAR), consent audit logging, and formal Privacy Impact Assessment (PIA). |

---

## 5. HIPAA Security & Privacy Readiness Assessment

**Current Public Wording:** `HIPAA Security Controls Assessment`  
**Cannot Claim "HIPAA Compliant" or "HIPAA Certified" Until:** Legal counsel completes a Covered Entity / Business Associate scope assessment AND Business Associate Agreements (BAAs) are executed with every infrastructure/AI vendor that could ever process Protected Health Information (PHI).

### Assessment Summary
1. **Local WASM Tools:** Core browser-only tools process files strictly in local device memory without transmitting data to PDFSun servers. While local processing minimizes exposure, **software alone cannot be "HIPAA Certified"** — HIPAA compliance is a legal and organizational obligation of the healthcare entity and its Business Associates.
2. **Cloud AI Tools (Critical Boundary):** Users MUST NOT submit Protected Health Information (PHI) into Cloud AI endpoints unless PDFSun operates under an active **Google Cloud Vertex AI / Gemini BAA**, Firebase/GCP BAA, hosting BAA, and an executed PDFSun BAA with the customer.
3. **Required Technical & Administrative Safeguards Roadmap:**
   - Administrative: HIPAA Security Officer designation, workforce training, risk analysis, sanction policy, BAA register.
   - Technical: Unique user IDs, automatic session timeout, immutable PHI access audit trails, TLS 1.2+/1.3 in transit, AES-256 at rest, and an Enterprise "Strict Local-Only Mode" toggle that disables Cloud AI routes for healthcare tenants.
   - Physical: Inherited from BAA-covered cloud data centers (GCP/AWS/Vercel Enterprise).

---

## 6. GDPR & India DPDP Data Protection Controls Checklist

**Current Public Wording:** `GDPR Privacy Controls`

| Requirement | Implementation Status | Next Operational Step |
| --- | --- | --- |
| **Data Minimization (Art. 5)** | Core PDF tools run locally in browser; AI workspaces clear in-memory text on unmount (`purgeLegacyAiStorage`). | Periodically audit telemetry payloads to confirm zero PII/file-content leakage. |
| **Lawful Basis & Consent (Art. 6–7)** | Privacy Policy & Cookie Policy published; Hero dropzone requires explicit tool selection before any Cloud AI call. | Add granular cookie consent manager (CMP) for EU/EEA visitors before loading AdSense/GA4 scripts. |
| **Data Subject Rights / DSAR (Art. 15–22)** | Contact/grievance channel published in `PolicyModals.tsx`. | Add self-service "Download My Account Data" and "Delete My Account" endpoints with 30-day SLA tracking. |
| **Subprocessors & Transfers (Art. 28, 44–49)** | Google Cloud / Firebase, Google Gemini API, Razorpay, Cloudflare, Vercel. | Publish a public `/subprocessors` list and execute Standard Contractual Clauses (SCCs) / DPAs with each vendor. |
| **Breach Notification (Art. 33–34)** | Security error logging active in Express backend. | Document 72-hour supervisory authority notification runbook and customer breach notice template. |

---

## 7. Verified Processing Telemetry (`500K+` Milestone) & Measured Performance Architecture

To ensure every future public volume or speed badge (such as `500K+ Files Processed` or latency numbers) is backed by **real, auditable data** rather than static marketing copy:

### 7.1 Verified File-Processing Counter Specification
- **Event Schema (Firestore `verified_processing_events` / aggregated `telemetry_counters`):**
  - `jobId` (UUIDv4, idempotency key — prevents double-counting retries/refreshes)
  - `toolId` (one of the 68 canonical slugs)
  - `processingMode` (`local_wasm` | `cloud_ai`)
  - `status` (`completed` only — failed/aborted jobs excluded)
  - `durationMs` (client `performance.now()` or server response duration, bounded `1ms..300000ms`)
  - `isBot` (filtered out via `globalTrafficHygieneMiddleware` crawler/bot detection)
  - `timestamp` (UTC ISO-8601)
- **Public Milestone Rule:** Public badges (e.g., `10K+`, `100K+`, `500K+ Files Processed`) may ONLY display thresholds strictly `<= verifiedCompletedJobsTotal` returned from `/api/analytics/stats`. Until then, UI displays truthful live counts or `"Private WASM Processing Active"`.

### 7.2 Measured Latency Telemetry Specification
- `LiveActivityStatsWidget.tsx` now initializes `avgSpeedMs` to `null` (removing the fabricated `120ms` / `0.12s` fallback).
- Real speed metrics are only rendered when the backend telemetry stream emits a verified non-null `serverLoadMs` computed from actual completed jobs.
- Future Stage 6 scalability instrumentation will track `p50`, `p95`, and `p99` latency separately for Local WASM jobs vs. Cloud AI API calls, plus Core Web Vitals (`LCP`, `INP`, `CLS`).

---

## 8. Official Support Email Confirmation Required (Owner Action Item)
- `index.html` line 250 (`Organization` JSON-LD) currently lists `"email": "mukeshinland79@gmail.com"`.
- `Footer.tsx` references `support@pdfsun.in`, while `PolicyModals.tsx` lists `mukeshinland79@gmail.com` and `mukeshkalonia241@gmail.com`.
- Per Stage 1 instructions, `mukeshinland79@gmail.com` was **NOT removed** from `index.html` pending owner confirmation that an official domain mailbox (e.g., `support@pdfsun.in` or `privacy@pdfsun.in`) is actively provisioned and monitored. Once confirmed, update `index.html:250` and `PolicyModals.tsx` in a single atomic change.
