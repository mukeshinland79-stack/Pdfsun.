/**
 * PDFSun.in — Phase 11 Universal Reliability & Security Verification Suite
 * 
 * Verifies:
 * 1. Analytics & Conversion Tracking Endpoints (Record Conversion, Stats, Zero Synthetic Users)
 * 2. History Engagement API (Payload Minimization, Strict Enum Validation, 60s Deduplication)
 * 3. R2 Cloud Storage Fail-Closed 503 Behavior
 * 4. PDF Filename & CSV MIME Sanitization (Path Traversal, Control Chars, Double Extensions)
 * 5. Excel & CSV Formula Injection Regression
 * 6. Cloud Run Proxy & IP Trust Architecture
 * 7. Complete 66-Tool Inventory & Routing Verification
 */

import { ensureValidFilename } from "../src/lib/pdfEngine";
import { ALL_TOOLS } from "../src/data/toolsData";
import { sanitizePlainTextForExcel } from "../src/core/udir/xlsxCompiler";
import fs from "fs";
import http from "http";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ✓ ${testName}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ✗ ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function makeLocalRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload).toString() } : {}),
      ...(headers || {}),
    };

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode || 0, data: parsed, headers: res.headers });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPhase11Tests() {
  console.log("=".repeat(80));
  console.log("PDFSun.in — Phase 11: Universal Reliability & Security Verification Suite");
  console.log("=".repeat(80));

  // --- Task 1: Analytics & Conversion Endpoints ---
  console.log("\n--- [1/7] Verifying Analytics & Conversion Endpoints ---");
  try {
    const validRec = await makeLocalRequest("POST", "/api/analytics/record-conversion", {
      latencyMs: 145,
      success: true,
    });
    assert(validRec.status === 200 && validRec.data?.success === true, "POST /api/analytics/record-conversion accepts valid payload");

    const negLatency = await makeLocalRequest("POST", "/api/analytics/record-conversion", {
      latencyMs: -10,
      success: true,
    });
    assert(negLatency.status === 400, "POST /api/analytics/record-conversion rejects negative latencyMs (400)");

    const extraKeys = await makeLocalRequest("POST", "/api/analytics/record-conversion", {
      latencyMs: 150,
      success: true,
      fileName: "confidential_document.pdf",
    });
    assert(extraKeys.status === 400, "POST /api/analytics/record-conversion rejects unexpected keys/PII (400)");

    const nonBoolSuccess = await makeLocalRequest("POST", "/api/analytics/record-conversion", {
      latencyMs: 150,
      success: "yes",
    });
    assert(nonBoolSuccess.status === 400, "POST /api/analytics/record-conversion rejects non-boolean success (400)");

    const statsRes = await makeLocalRequest("GET", "/api/analytics/stats");
    assert(statsRes.status === 200, "GET /api/analytics/stats responds with 200 OK");
    assert(typeof statsRes.data?.data?.activeUsers === "number", "stats.activeUsers is a genuine number");
    assert(statsRes.data?.data?.activeUsers === 0, "stats.activeUsers reports exactly 0 when 0 WebSockets connected (zero synthetic users)");
    assert(typeof statsRes.data?.data?.processingSpeed === "number" && statsRes.data?.data?.processingSpeed > 0, "stats.processingSpeed reports valid latency");
    assert(typeof statsRes.data?.data?.successRate === "number" && statsRes.data?.data?.successRate <= 100, "stats.successRate is a valid percentage");
    assert(typeof statsRes.data?.data?.totalConversionsToday === "number", "stats.totalConversionsToday is a valid count");
  } catch (err: any) {
    assert(false, "Analytics endpoints test execution", err?.message);
  }

  // --- Task 2: History Engagement API ---
  console.log("\n--- [2/7] Verifying History Engagement API ---");
  try {
    const validEngage = await makeLocalRequest("POST", "/api/history/engagement", {
      eventId: "milestone-1947-independence",
      type: "view",
      dateKey: "08-15",
    });
    assert(validEngage.status === 200 && validEngage.data?.success === true, "POST /api/history/engagement accepts valid minimized payload");

    const dedupEngage = await makeLocalRequest("POST", "/api/history/engagement", {
      eventId: "milestone-1947-independence",
      type: "view",
      dateKey: "08-15",
    });
    assert(dedupEngage.status === 200 && dedupEngage.data?.deduplicated === true, "POST /api/history/engagement deduplicates duplicate event within 60s");

    const invalidType = await makeLocalRequest("POST", "/api/history/engagement", {
      eventId: "milestone-1947",
      type: "malicious_exploit",
    });
    assert(invalidType.status === 400, "POST /api/history/engagement rejects invalid event type enum (400)");

    const maliciousKeys = await makeLocalRequest("POST", "/api/history/engagement", {
      eventId: "milestone-1947",
      type: "like",
      documentContent: "CONFIDENTIAL USER DATA",
    });
    assert(maliciousKeys.status === 400, "POST /api/history/engagement rejects extraneous documentContent keys (400)");

    const malformedId = await makeLocalRequest("POST", "/api/history/engagement", {
      eventId: "milestone<script>alert(1)</script>",
      type: "like",
    });
    assert(malformedId.status === 400, "POST /api/history/engagement rejects malformed eventId with special characters (400)");
  } catch (err: any) {
    assert(false, "Engagement API test execution", err?.message);
  }

  // --- Task 3: R2 Cloud Storage Fail-Closed Behavior ---
  console.log("\n--- [3/7] Verifying R2 Cloud Storage Fail-Closed Behavior ---");
  try {
    const r2Res = await makeLocalRequest("POST", "/api/r2/presigned-url", {
      fileKey: "test.pdf",
    });
    assert(r2Res.status === 503, "POST /api/r2/presigned-url returns 503 Service Unavailable when unconfigured");
    assert(r2Res.data?.code === "R2_STORAGE_NOT_CONFIGURED", "R2 response returns explicit R2_STORAGE_NOT_CONFIGURED error code");
    assert(!r2Res.data?.uploadUrl && !r2Res.data?.downloadUrl, "R2 response never returns fake or mock presigned URLs");
  } catch (err: any) {
    assert(false, "R2 fail-closed test execution", err?.message);
  }

  // --- Task 4: Filename Normalization & CSV Extension Security ---
  console.log("\n--- [4/7] Verifying Filename Normalization & CSV Extension Security ---");
  try {
    const csv1 = ensureValidFilename("Financial_Report", "text/csv;charset=utf-8");
    assert(csv1 === "Financial_Report.csv", `ensureValidFilename correctly outputs .csv for text/csv (got: ${csv1})`);

    const csv2 = ensureValidFilename("data.csv", "text/csv");
    assert(csv2 === "data.csv", `ensureValidFilename preserves existing .csv extension (got: ${csv2})`);

    const xlsx1 = ensureValidFilename("Table_Export", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert(xlsx1 === "Table_Export.xlsx", `ensureValidFilename outputs .xlsx for spreadsheetml (got: ${xlsx1})`);

    const traversal1 = ensureValidFilename("../../../etc/passwd", "application/pdf");
    assert(traversal1 === "etc_passwd.pdf", `ensureValidFilename neutralizes ../ path traversal (got: ${traversal1})`);

    const traversal2 = ensureValidFilename("..\\..\\windows\\system32\\calc", "application/pdf");
    assert(traversal2 === "windows_system32_calc.pdf", `ensureValidFilename neutralizes ..\\ path traversal (got: ${traversal2})`);

    const nullByte = ensureValidFilename("report\0injection.pdf", "application/pdf");
    assert(nullByte === "reportinjection.pdf", `ensureValidFilename strips null bytes (got: ${nullByte})`);

    const unicodeDoc = ensureValidFilename("वित्तीय_विवरण_२०२६.pdf", "application/pdf");
    assert(unicodeDoc === "वित्तीय_विवरण_२०२६.pdf", `ensureValidFilename preserves legitimate Unicode Devanagari Hindi text (got: ${unicodeDoc})`);

    const emptyName = ensureValidFilename("", "application/pdf");
    assert(emptyName === "PDFSun_Document.pdf", `ensureValidFilename falls back to clean default name for empty string (got: ${emptyName})`);

    const doubleExt = ensureValidFilename("document.pdf.txt", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    assert(doubleExt === "document.pdf.docx", `ensureValidFilename prevents double extensions (got: ${doubleExt})`);
  } catch (err: any) {
    assert(false, "Filename normalization test execution", err?.message);
  }

  // --- Task 5: Excel & CSV Formula Injection Regression ---
  console.log("\n--- [5/7] Verifying Excel & CSV Formula Injection Defense ---");
  try {
    const dangerousPayloads = [
      { input: "=1+1", expectedStartsWith: "'=" },
      { input: "+cmd|' /C calc'!A0", expectedStartsWith: "'+cmd" },
      { input: "-2+3*cmd", expectedStartsWith: "'-2" },
      { input: "@SUM(1,1)", expectedStartsWith: "'@SUM" },
      { input: "\t=DDE()", expectedStartsWith: "'\t=" },
      { input: "\r=1+1", expectedStartsWith: "'\r=" },
    ];

    for (const testCase of dangerousPayloads) {
      const escaped = sanitizePlainTextForExcel(testCase.input);
      assert(
        escaped.startsWith("'"),
        `Formula trigger escaped with leading quote for [${testCase.input.replace(/[\t\r\n]/g, "\\t")}] (got: ${escaped})`
      );
    }

    const safeNegative = sanitizePlainTextForExcel("-42.50");
    assert(safeNegative === "-42.50", "Legitimate negative number '-42.50' is not mangled");

    const safeGstin = sanitizePlainTextForExcel("27AABCU9603R1ZM");
    assert(safeGstin === "27AABCU9603R1ZM", "Indian GSTIN '27AABCU9603R1ZM' is not mangled");
  } catch (err: any) {
    assert(false, "Formula injection test execution", err?.message);
  }

  // --- Task 6: Cloud Run Proxy & Fetch Interceptor Source Inspection ---
  console.log("\n--- [6/7] Verifying Proxy Configuration & Fetch Interceptor Classification ---");
  try {
    const serverCode = fs.readFileSync("server.ts", "utf-8");
    assert(serverCode.includes('app.set("trust proxy", 1);'), "server.ts configures app.set('trust proxy', 1) for Cloud Run single GFE hop");

    const interceptorCode = fs.readFileSync("src/lib/fetchInterceptor.ts", "utf-8");
    assert(interceptorCode.includes('lowerUrl.includes("/api/analytics")'), "fetchInterceptor categorizes /api/analytics as non-blocking background telemetry");
    assert(interceptorCode.includes('lowerUrl.includes("/api/history")'), "fetchInterceptor categorizes /api/history as non-blocking background telemetry");
    assert(interceptorCode.includes('isUserInitiatedCriticalRoute'), "fetchInterceptor defines isUserInitiatedCriticalRoute guard");
    assert(interceptorCode.includes('!isUserInitiatedCriticalRoute && (isTelemetryEndpoint'), "fetchInterceptor excludes user-initiated routes (/api/r2/*, /api/download/*) from being suppressed");
  } catch (err: any) {
    assert(false, "Proxy & interceptor inspection", err?.message);
  }

  // --- Task 7: Complete 66-Tool Inventory & Routing Verification ---
  console.log("\n--- [7/7] Verifying Complete 66-Tool Inventory & Routing Integrity ---");
  try {
    assert(ALL_TOOLS.length === 66, `ALL_TOOLS contains exactly 66 registered tools (count: ${ALL_TOOLS.length})`);

    const appCode = fs.readFileSync("src/App.tsx", "utf-8");
    const workspaceCode = fs.readFileSync("src/components/ActiveToolWorkspace.tsx", "utf-8");

    let allCovered = true;
    for (const tool of ALL_TOOLS) {
      const inAppDedicated =
        appCode.includes(`activeTool.id === "${tool.id}"`) ||
        appCode.includes(`"${tool.id}"].includes`) ||
        appCode.includes(`"${tool.id}":`) ||
        tool.isAi;
      const inWorkspace =
        workspaceCode.includes(`case "${tool.id}":`) ||
        workspaceCode.includes(`"${tool.id}"`);

      if (!inAppDedicated && !inWorkspace) {
        console.error(`Unmapped tool detected: [${tool.id}] (${tool.name})`);
        allCovered = false;
      }
    }
    assert(allCovered, "All 66 registered tools mapped to active workspace cases, AI workspace, or dedicated tool components");

    const qrCodeDisplayUsage = workspaceCode.includes('QrCodeDisplay\n                    url={`${getPublicSiteUrl()}/#download=');
    assert(!qrCodeDisplayUsage, "ActiveToolWorkspace.tsx purged non-functional #download= QR code URL");
  } catch (err: any) {
    assert(false, "66-tool audit verification", err?.message);
  }

  console.log("=".repeat(80));
  console.log(`Phase 11 Verification Finished: ${passedCount} Passed, ${failedCount} Failed (${passedCount + failedCount} total checks)`);
  console.log("=".repeat(80));

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase11Tests().catch((err) => {
  console.error("Fatal error running Phase 11 tests:", err);
  process.exit(1);
});
