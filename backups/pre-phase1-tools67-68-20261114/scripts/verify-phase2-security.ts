// Environment compatibility polyfills for Node execution
if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  };
}

async function verifyAll() {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pako = await import("pako");
  const { encryptPDF } = await import("@pdfsmaller/pdf-encrypt");
  const { decryptPDF, isEncrypted } = await import("@pdfsmaller/pdf-decrypt");
  const { redactPdfPermanently } = await import("../src/lib/enterpriseRedactionEngine");
  console.log("=================================================");
  console.log("PDFSun.in Phase 2 Security & Integrity Verification");
  console.log("=================================================\n");

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  function recordCheck(name: string, condition: boolean, details?: string) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`[PASS] ${name}${details ? ` -> ${details}` : ""}`);
    } else {
      failedChecks++;
      console.error(`[FAIL] ${name}${details ? ` -> ${details}` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: Permanent PDF Stream Redaction Verification
  // -------------------------------------------------------------
  console.log(">>> [1/3] VERIFYING PDF REDACTION & CONTENT STREAM PERMANENCE");

  // Step 1: Create a test document with public and secret data
  const testDoc = await PDFDocument.create();
  const font = await testDoc.embedFont(StandardFonts.Helvetica);
  const page = testDoc.addPage([600, 800]);

  const sensitiveSSN = "987-65-4321";
  const sensitiveSecret = "CONFIDENTIAL_PAYROLL_DATA_XYZ";
  const publicText = "PUBLIC_AUDIT_REPORT_VISIBLE_OK";

  page.drawText(`${publicText} - Public Header`, { x: 50, y: 750, font, size: 12 });
  page.drawText(`Employee SSN: ${sensitiveSSN}`, { x: 50, y: 700, font, size: 12 });
  page.drawText(`Internal Secret: ${sensitiveSecret}`, { x: 50, y: 650, font, size: 12 });

  const sensitiveSSNHex = Buffer.from(sensitiveSSN).toString("hex").toUpperCase();
  const sensitiveSecretHex = Buffer.from(sensitiveSecret).toString("hex").toUpperCase();
  const publicTextHex = Buffer.from(publicText).toString("hex").toUpperCase();

  const rawUnredactedBytes = await testDoc.save({ useObjectStreams: false });

  // Verify that the unredacted bytes actually contain the tokens (inside flate streams)
  let foundInUnredacted = false;
  const unredDoc = await PDFDocument.load(rawUnredactedBytes);
  const unredPage = unredDoc.getPage(0);
  const unredRef = (unredPage.node as any).Contents();
  const unredRefArray = unredRef.asArray ? unredRef.asArray() : (unredRef.array || [unredRef]);
  for (const ref of unredRefArray) {
    const stream = unredDoc.context.lookup(ref) as any;
    if (stream && stream.getContents) {
      try {
        const text = new TextDecoder("latin1").decode(pako.inflate(stream.getContents()));
        if (
          (text.includes(sensitiveSSN) || text.includes(sensitiveSSNHex)) &&
          (text.includes(sensitiveSecret) || text.includes(sensitiveSecretHex))
        ) {
          foundInUnredacted = true;
          break;
        }
      } catch {}
    }
  }
  recordCheck("Baseline: Raw unredacted document contains sensitive tokens in streams", foundInUnredacted);

  // Step 2: Execute permanent redaction
  const redactFile = new File([new Blob([rawUnredactedBytes])], "TestRedact.pdf", { type: "application/pdf" });
  const redactionResult = await redactPdfPermanently(redactFile, {
    terms: [sensitiveSSN, sensitiveSecret],
    boxes: [
      { pageIndex: 0, x: 50, y: 690, width: 250, height: 25 },
      { pageIndex: 0, x: 50, y: 640, width: 300, height: 25 }
    ],
    redactionColor: { r: 0, g: 0, b: 0 },
    redactionLabel: "REDACTED",
  });

  const sanitizedBytes = redactionResult.pdfBytes;

  // Step 3: Decompress EVERY stream in the sanitized output to prove zero-data leak
  let ssnFoundAfter = false;
  let secretFoundAfter = false;
  let publicTextPreserved = false;
  let streamCount = 0;

  const sanitizedDoc = await PDFDocument.load(sanitizedBytes);
  const sanPage = sanitizedDoc.getPage(0);
  const sanRef = (sanPage.node as any).Contents();
  const sanRefArray = sanRef.asArray ? sanRef.asArray() : (sanRef.array || [sanRef]);

  for (const ref of sanRefArray) {
    const stream = sanitizedDoc.context.lookup(ref) as any;
    if (stream && stream.getContents) {
      streamCount++;
      try {
        let decomp: Uint8Array;
        try {
          decomp = pako.inflate(stream.getContents());
        } catch {
          decomp = stream.getContents();
        }
        const text = new TextDecoder("latin1").decode(decomp);
        if (text.includes(sensitiveSSN) || text.includes(sensitiveSSNHex)) ssnFoundAfter = true;
        if (text.includes(sensitiveSecret) || text.includes(sensitiveSecretHex)) secretFoundAfter = true;
        if (text.includes(publicText) || text.includes(publicTextHex)) publicTextPreserved = true;
      } catch {}
    }
  }

  // Also verify raw uncompressed byte scanning
  const rawString = new TextDecoder("latin1").decode(sanitizedBytes);
  if (rawString.includes(sensitiveSSN) || rawString.includes(sensitiveSSNHex)) ssnFoundAfter = true;
  if (rawString.includes(sensitiveSecret) || rawString.includes(sensitiveSecretHex)) secretFoundAfter = true;

  recordCheck(
    "Stream Sanitization: Sensitive SSN ('987-65-4321') permanently purged from all streams",
    !ssnFoundAfter,
    `Inspected ${streamCount} streams; SSN found: ${ssnFoundAfter}`
  );

  recordCheck(
    "Stream Sanitization: Internal Secret ('CONFIDENTIAL_PAYROLL_DATA_XYZ') permanently purged",
    !secretFoundAfter,
    `Secret found in bytes/streams: ${secretFoundAfter}`
  );

  recordCheck(
    "Document Integrity: Public non-redacted text preserved",
    publicTextPreserved,
    `Public text found: ${publicTextPreserved}`
  );

  // Step 4: Verify that the document remains a structurally valid PDF
  let validDocLoaded = false;
  let pageCount = 0;
  try {
    const loadedSanitized = await PDFDocument.load(sanitizedBytes);
    pageCount = loadedSanitized.getPageCount();
    validDocLoaded = true;
  } catch (err) {
    validDocLoaded = false;
  }
  recordCheck("Output Validity: Sanitized PDF loads cleanly in PDFDocument parser", validDocLoaded, `Pages: ${pageCount}`);


  // -------------------------------------------------------------
  // TEST SUITE 2: Genuine PDF Password Encryption Verification
  // -------------------------------------------------------------
  console.log("\n>>> [2/3] VERIFYING GENUINE AES-256 PDF PASSWORD ENCRYPTION");

  const rawDoc = await PDFDocument.create();
  const rawPage = rawDoc.addPage([500, 500]);
  rawPage.drawText("Protected Content Payload 12345");
  const rawBytesToProtect = await rawDoc.save();

  // Test encryption
  const userPassword = "MySecurePassword2026!";
  const encryptedBytes = await encryptPDF(rawBytesToProtect, userPassword, {
    algorithm: "AES-256",
    allowPrinting: false,
    allowCopying: false,
  });

  // Check 1: Check presence of /Encrypt in PDF trailer / catalog
  const encInfo = await isEncrypted(encryptedBytes);
  recordCheck("ISO Standard /Encrypt Dictionary present", encInfo.encrypted === true);
  recordCheck("Encryption Algorithm is genuine AES-256", encInfo.algorithm === "AES-256");

  // Check 2: Raw bytes contain standard PDF security keys (/Filter /Standard, /V 5, /R 5 or 6)
  const encHeaderString = new TextDecoder("latin1").decode(encryptedBytes.slice(-4096)); // search trailer area
  const fullEncString = new TextDecoder("latin1").decode(encryptedBytes);
  const hasFilterStandard = fullEncString.includes("/Filter/Standard") || fullEncString.includes("/Filter /Standard");
  const hasEncryptRef = fullEncString.includes("/Encrypt");
  recordCheck("Trailer references genuine /Encrypt object", hasEncryptRef);
  recordCheck("Security Handler is /Filter /Standard", hasFilterStandard);

  // Check 3: Standard PDF parser rejects loading without ignoreEncryption / password
  let standardLoadThrew = false;
  try {
    await PDFDocument.load(encryptedBytes);
  } catch (err: any) {
    standardLoadThrew = true;
  }
  recordCheck("Unauthenticated Access: Document rejects opening without password", standardLoadThrew);

  // Check 4: Decrypt with correct password
  let decryptSuccess = false;
  let decryptedBytes: Uint8Array = new Uint8Array(0);
  try {
    decryptedBytes = await decryptPDF(encryptedBytes, userPassword);
    const decryptedDoc = await PDFDocument.load(decryptedBytes);
    decryptSuccess = decryptedDoc.getPageCount() === 1;
  } catch (e) {
    decryptSuccess = false;
  }
  recordCheck("Authenticated Decryption: Correct password restores document", decryptSuccess);

  // Check 5: Decrypt with incorrect password fails
  let wrongPasswordThrew = false;
  try {
    await decryptPDF(encryptedBytes, "WrongIncorrectPassword!");
  } catch {
    wrongPasswordThrew = true;
  }
  recordCheck("Security Boundary: Incorrect password rejected with authentication failure", wrongPasswordThrew);


  // -------------------------------------------------------------
  // TEST SUITE 3: Client-Side Processing Boundary Verification
  // -------------------------------------------------------------
  console.log("\n>>> [3/3] VERIFYING CLIENT-SIDE IN-MEMORY EXECUTION (ZERO REMOTE API CALLS)");

  // Inspect source files for any fetch, XMLHttpRequest, axios, or remote endpoints
  const fs = await import("fs");
  const path = await import("path");

  const redactionEngineCode = fs.readFileSync(path.resolve("src/lib/enterpriseRedactionEngine.ts"), "utf-8");
  const pdfEngineCode = fs.readFileSync(path.resolve("src/lib/pdfEngine.ts"), "utf-8");

  // Verify enterpriseRedactionEngine has NO network calls
  const redactionHasFetch = redactionEngineCode.includes("fetch(") || redactionEngineCode.includes("XMLHttpRequest") || redactionEngineCode.includes("axios");
  recordCheck("src/lib/enterpriseRedactionEngine.ts has ZERO network requests (fetch/XHR/axios)", !redactionHasFetch);

  // Verify protectPdf function in pdfEngine has NO network calls
  const protectPdfSection = pdfEngineCode.substring(
    pdfEngineCode.indexOf("export async function protectPdf("),
    pdfEngineCode.indexOf("export async function protectPdf(") + 1200
  );
  const protectHasFetch = protectPdfSection.includes("fetch(") || protectPdfSection.includes("http://") || protectPdfSection.includes("https://");
  recordCheck("protectPdf implementation has ZERO network requests", !protectHasFetch);

  // -------------------------------------------------------------
  // TEST SUITE 4: Scanned PDF & Raster Image XObject Sanitization
  // -------------------------------------------------------------
  console.log("\n>>> [4/5] VERIFYING SCANNED PDF & IMAGE XOBJECT REDACTION");

  const scannedDoc = await PDFDocument.create();
  const testPngBytes = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ]);
  const originalEmbeddedImg = await scannedDoc.embedPng(testPngBytes);
  const scannedP = scannedDoc.addPage([500, 700]);
  scannedP.drawImage(originalEmbeddedImg, { x: 50, y: 50, width: 400, height: 600 });
  const rawScannedPdf = await scannedDoc.save();

  const scannedFile = new File([new Blob([rawScannedPdf])], "ScannedScan.pdf", { type: "application/pdf" });
  const scannedSanitized = await redactPdfPermanently(scannedFile, {
    boxes: [{ pageIndex: 0, x: 100, y: 200, width: 200, height: 50 }],
    strategy: "deep_raster",
  });

  recordCheck("Scanned PDF Redaction produces valid byte stream", scannedSanitized.pdfBytes.length > 0);
  recordCheck("Scanned PDF correctly selects pixel_raster sanitization", scannedSanitized.rasterizedPages.includes(0));

  const loadedSanitizedScanned = await PDFDocument.load(scannedSanitized.pdfBytes);
  const page0Size = loadedSanitizedScanned.getPage(0).getSize();
  recordCheck("Scanned PDF preserves page dimensions (500x700)", page0Size.width === 500 && page0Size.height === 700);

  // -------------------------------------------------------------
  // TEST SUITE 5: Encrypted Fail-Closed & Malformed Input Handling
  // -------------------------------------------------------------
  console.log("\n>>> [5/5] VERIFYING ENCRYPTED FAIL-CLOSED & MALFORMED INPUT SAFETY");

  const encDoc = await PDFDocument.create();
  encDoc.addPage([300, 300]).drawText("Top Secret Encrypted Text");
  const rawDocBytes = await encDoc.save();
  const lockedBytes = await encryptPDF(rawDocBytes, "AuthorizedPass99");
  const lockedFile = new File([new Blob([lockedBytes])], "Locked.pdf", { type: "application/pdf" });

  let lockedWithoutPassBlocked = false;
  try {
    await redactPdfPermanently(lockedFile, { terms: ["Top Secret"] });
  } catch (e: any) {
    if (e.message.includes("password-protected")) lockedWithoutPassBlocked = true;
  }
  recordCheck("Encrypted PDF without password safely fails closed", lockedWithoutPassBlocked);

  let lockedWithPassUnlocked = false;
  try {
    const unlockedRes = await redactPdfPermanently(lockedFile, {
      terms: ["Top Secret"],
      password: "AuthorizedPass99",
    });
    lockedWithPassUnlocked = unlockedRes.pdfBytes.length > 0;
  } catch {}
  recordCheck("Encrypted PDF with authorized password unlocks and sanitizes", lockedWithPassUnlocked);

  let malformedCaughtSafely = false;
  try {
    const badFile = new File([new Blob([new Uint8Array([0, 1, 2, 3, 4])])], "bad.pdf", { type: "application/pdf" });
    await redactPdfPermanently(badFile, { terms: ["bad"] });
  } catch (e: any) {
    if (e.message.includes("Document Parsing Failed")) malformedCaughtSafely = true;
  }
  recordCheck("Malformed / invalid PDF input fails safely with clear error", malformedCaughtSafely);

  console.log("\n=================================================");
  console.log(`Summary: ${passedChecks} Passed, ${failedChecks} Failed out of ${totalChecks} Checks.`);
  console.log("=================================================");

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyAll().catch((err) => {
  console.error("Verification failed with exception:", err);
  process.exit(1);
});
