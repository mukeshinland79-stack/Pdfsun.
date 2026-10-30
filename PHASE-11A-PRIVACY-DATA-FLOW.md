# PDFSun.in — Phase 11A: Privacy & Data Flow Analysis

This document provides a privacy architecture audit of PDFSun.in, analyzing data flows, data retention, third-party network egress, and client-side lifecycle management.

---

## 1. Document Data Processing Boundary

```
[ User Browser / Client Machine ]
  |
  +--- Standard PDF Tools (Merge, Split, Rotate, Redact, Compress, PDF2Word, PDF2Excel, etc.)
  |      |
  |      +--> [ WebAssembly Engine / Web Workers in Browser Memory ]
  |      |      - pdf-lib, pdfjs-dist, docx, exceljs, tesseract.js
  |      |      - Execution is 100% LOCAL & AIR-GAPPED
  |      |      - Zero Document Bytes Sent Over Wire
  |      |      - Output created as Blob / ArrayBuffer in local heap
  |      v
  |    [ Instant Local File Download ]
  |
  +--- AI Features (AI Chat, AI Summarize, AI OCR, AI Resume Builder)
         |
         +--> [ User Opt-In / Explicit Action ]
         |
         v
   (HTTPS Encrypted Request to Server Proxy)
         |
         v
  [ PDFSun Express Server: /api/ai/* ]
         |
         +--> [ Google Gemini API via @google/genai ]
         |      - Truncated text context or image frame
         |      - Strict Ephemeral Processing (No training retention)
         |      - Returns structured JSON / Markdown text
         v
  [ Rendered Directly to User Client ]
```

---

## 2. In-Depth Privacy Domain Analysis

### A. Local vs. External Processing
- **Standard Document Utilities (39 Tools)**:
  - **Verdict: 100% Client-Side Private.**
  - Tools such as `merge-pdf`, `split-pdf`, `compress-pdf`, `redact-pdf`, `pdf-to-word`, `pdf-to-excel`, and `protect-pdf` run completely inside the user's browser sandbox using WebAssembly and Web Workers.
  - Documents are never transmitted to PDFSun servers, cloud buckets, or third-party storage.
- **AI Intelligence Tools (9 Tools)**:
  - **Verdict: Server Proxy with External API Transmission.**
  - When a user explicitly uses `ai-chat-pdf`, `ai-pdf-summary`, or `ai-ocr`, extracted text or image snippets are sent via HTTPS to `server.ts` proxy endpoints, which forward the prompt to Google Gemini API (`@google/genai`).
  - *Finding*: While privacy disclosures exist in UI tool descriptions, the user must be informed with a clear modal prompt that AI features transmit document text to the Gemini API for analysis.

### B. Optical Character Recognition (OCR) Processing
- **Offline / Local Mode**: `image-to-excel`, `image-to-word`, and `image-to-notepad` utilize client-side `tesseract.js` WebAssembly workers. Language trained data (`eng.traineddata`) is loaded from local CDN/cache and runs offline in browser memory.
- **Cloud Vision Mode**: `ai-ocr` (Gemini Vision) transmits base64 images through `server.ts` to `gemini-3.8-flash`.

### C. Analytics, Telemetry & Tracking
- **Google Analytics 4 (GA4)**: `VITE_GA_MEASUREMENT_ID="G-VKEKHR7SK8"`. Only basic pageview routes, tool selection slugs, and anonymous conversion error codes are logged. **No file contents, document names, or personal PII are included in analytics events.**
- **Google AdSense**: Script tags are gated behind cookie consent and strict CSP headers.
- **Traffic Protection Middleware**: `trafficProtection.ts` monitors request rate and user-agent category in an in-memory sliding store. Stale IP records are automatically purged every 10 minutes.

### D. Server Error Logging & File Retention
- **Server File Retention**: The Express backend does **not** store uploaded PDF files on disk. The Dockerfile creates `/tmp/pdfsun_uploads` and `/tmp/pdfsun_processed` with non-root permissions, but standard conversion routes run memory-to-memory.
- **Auto-Purge Cron**: `system_config.json` specifies `TEMP_STORAGE_RETENTION_MINUTES: 60`. If any temporary stream buffers are written, an automated disk sweep purges files exceeding retention limits.
- **Error Logs**: `console.error` calls log error messages and HTTP status codes, but avoid printing raw user base64 file payloads or document text.

### E. Client-Side Browser Storage (`localStorage` & `sessionStorage`)
- **Stored Attributes**:
  - `pdfsun_theme` ("dark" | "light" | "eye-protection")
  - `pdfsun_lang` (ISO language code)
  - `pdfsun_auth_token` (Session JWT)
  - `pdfsun_favorites` (Array of tool IDs)
  - `pdfsun_recent_history` (Client-side metadata: tool name, timestamp, page count — **no file blobs stored**)
- **Sensitive Document Retention**: Document binaries are **never** persisted to `localStorage` or `IndexedDB` without explicit user save action.

### F. Object URL Lifecycle & Memory Guard
- `src/workers/workerManager.ts` and `src/utils/pdfWorkerPool.ts` implement `registerGuardedBlobUrl` and `purgeAllGuardedBlobUrls` to track and release allocated memory pointers.
- *Audit Finding (SEC-11A-008)*: In non-worker modal components (e.g. `SharePdfSunModal.tsx`, `AservusPdfCompressor.tsx`), some transient `URL.createObjectURL(blob)` calls lack explicit `URL.revokeObjectURL(url)` calls in `useEffect` unmount cleanups. While this does not leak data to external parties, it can cause memory bloat on low-RAM mobile devices.

---

## 3. Compliance Assessment

| Regulation / Standard | Compliance Posture | Architecture Evidence |
| :--- | :--- | :--- |
| **EU General Data Protection Regulation (GDPR)** | Compliant by Design | Zero-server storage of document contents; client-side cryptographic erasure upon tab closure. |
| **Indian Digital Personal Data Protection Act (DPDP 2023)** | Compliant by Design | Absolute data minimization; zero cross-border transmission of standard PDF documents. |
| **California Consumer Privacy Act (CCPA/CPRA)** | Compliant | No sale or sharing of user document data; opt-out analytics support. |
| **ISO/IEC 27001 Security Best Practices** | Implemented | Strict TLS/HSTS headers, non-root Docker execution, zero-trust RBAC. |
