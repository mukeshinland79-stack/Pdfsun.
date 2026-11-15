import assert from "node:assert/strict";
import {
  generateBarcode,
  computeGs1Mod10CheckDigit,
  expandUpceToUpcaBase,
  sanitizeSpreadsheetCell,
  escapeCsvField,
} from "../lib/barcodeEngine";
import {
  buildQrPayload,
  validateQrLogoFile,
  verifyQrPayloadViaMatrixPixels,
  resolveEffectiveEcc,
  MAX_QR_LOGO_BYTES,
} from "../lib/qrStudioEngine";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ FAIL: ${name} -> ${err?.message || err}`);
  }
}

console.log("==========================================================================");
console.log("PDFSun.in — TOOL #67 (BARCODE) & TOOL #68 (QR STUDIO) ENGINE TEST SUITE");
console.log("==========================================================================");

// 1. Barcode Symbologies & Checksums
test("Code 128 encodes alphanumeric & optimizes numeric pairs with Mod-103 verification", () => {
  const res = generateBarcode("PDFSUN-20260048", { symbology: "CODE128" });
  assert.equal(res.valid, true);
  assert.ok(res.svgMarkup.includes("<svg"));
  assert.ok(res.totalModules > 50);
});

test("Code 39 enforces valid alphabet and computes Mod-43 check digit when enabled", () => {
  const res = generateBarcode("INV-2026", { symbology: "CODE39", includeChecksum: true });
  assert.equal(res.valid, true);
  assert.ok(res.checkDigit && res.checkDigit.length === 1);
  const bad = generateBarcode("invalid@char", { symbology: "CODE39" });
  assert.equal(bad.valid, false);
});

test("EAN-13 preserves leading zeros, computes Mod-10 check digit, and rejects bad check digit", () => {
  const auto = generateBarcode("089010308951", { symbology: "EAN13" });
  assert.equal(auto.valid, true);
  assert.equal(auto.normalizedValue.length, 13);
  assert.equal(auto.normalizedValue[0], "0");
  const expected = computeGs1Mod10CheckDigit("089010308951");
  assert.equal(auto.checkDigit, expected);

  const wrongDigit = String((Number(expected) + 1) % 10);
  const invalid = generateBarcode("089010308951" + wrongDigit, { symbology: "EAN13" });
  assert.equal(invalid.valid, false);
});

test("EAN-8 validates 7-digit auto check digit and rejects invalid 8-digit checksum", () => {
  const auto = generateBarcode("9638507", { symbology: "EAN8" });
  assert.equal(auto.valid, true);
  assert.equal(auto.normalizedValue, "96385074");
  assert.equal(auto.totalModules, 67);

  const invalid = generateBarcode("96385079", { symbology: "EAN8" });
  assert.equal(invalid.valid, false);
});

test("UPC-A validates 11-digit & 12-digit inputs and preserves leading zero", () => {
  const res = generateBarcode("03600029145", { symbology: "UPCA" });
  assert.equal(res.valid, true);
  assert.equal(res.normalizedValue, "036000291452");
  assert.equal(res.totalModules, 95);

  const bad = generateBarcode("036000291459", { symbology: "UPCA" });
  assert.equal(bad.valid, false);
});

test("UPC-E expands 6/7/8 digits accurately and produces 51-module valid symbol", () => {
  assert.equal(expandUpceToUpcaBase("0425261"), "04210000526");
  const res = generateBarcode("0425261", { symbology: "UPCE" });
  assert.equal(res.valid, true);
  assert.equal(res.totalModules, 51);
  assert.equal(res.normalizedValue.length, 8);
});

test("ITF-14 validates 13/14 digits, Mod-10 check digit, and renders bearer bars", () => {
  const res = generateBarcode("1001234567890", { symbology: "ITF14", itfBearerBars: true });
  assert.equal(res.valid, true);
  assert.equal(res.normalizedValue, "10012345678902");
  const bad = generateBarcode("10012345678905", { symbology: "ITF14" });
  assert.equal(bad.valid, false);
});

test("Codabar validates allowed characters & start/stop guards", () => {
  const res = generateBarcode("123456-78", { symbology: "CODABAR", codabarStart: "A", codabarStop: "C" });
  assert.equal(res.valid, true);
  assert.equal(res.normalizedValue, "A123456-78C");

  const bad = generateBarcode("ABC123", { symbology: "CODABAR" });
  assert.equal(bad.valid, false);
});

test("GS1-128 parses AIs, inserts leading/separator FNC1 (102), and validates GTIN Mod-10 + expiry dates", () => {
  const res = generateBarcode("(01)08901030895128(10)LOT42(17)271231", { symbology: "GS1_128" });
  assert.equal(res.valid, true);
  const c128Vals = res.metadata?.code128Values || [];
  // Must contain FNC1 (102) immediately after Start B/C and between variable (10)LOT42 and (17)
  assert.equal(c128Vals[1], 102);
  assert.ok(c128Vals.filter((v) => v === 102).length >= 2);

  // Invalid GTIN Mod-10 in AI (01) must fail
  const badGtin = generateBarcode("(01)08901030895120(10)LOT42", { symbology: "GS1_128" });
  assert.equal(badGtin.valid, false);
  // Invalid month 13 in AI (17) must fail
  const badDate = generateBarcode("(17)271331", { symbology: "GS1_128" });
  assert.equal(badDate.valid, false);
});

// 2. Barcode SVG XSS & CSV Formula Injection Protection
test("Barcode SVG escapes script tags/quotes (no raw XSS in customLabel)", () => {
  const res = generateBarcode("12345", {
    symbology: "CODE128",
    customLabel: `<script>alert("xss")</script>`,
  });
  assert.equal(res.valid, true);
  assert.equal(res.svgMarkup.includes("<script>"), false);
  assert.ok(res.svgMarkup.includes("&lt;script&gt;"));
});

test("CSV/XLSX formula injection sanitizer prefixes =, +, -, @, tab, CR and preserves leading zeros", () => {
  assert.equal(sanitizeSpreadsheetCell("=CMD()"), "'=CMD()");
  assert.equal(sanitizeSpreadsheetCell("+1+1"), "'+1+1");
  assert.equal(sanitizeSpreadsheetCell("-SUM(A1)"), "'-SUM(A1)");
  assert.equal(sanitizeSpreadsheetCell("@import"), "'@import");
  assert.equal(sanitizeSpreadsheetCell("\t=1"), "'\t=1");
  assert.equal(sanitizeSpreadsheetCell("00123456"), "00123456");
  assert.equal(escapeCsvField("0890103089512"), "0890103089512");
});

// 3. QR Studio 11 Payload Builders & Validation
test("QR Studio builds & validates all 11 content types accurately", () => {
  assert.equal(buildQrPayload({ type: "url", url: { url: "pdfsun.in/merge-pdf" } }).payload, "https://pdfsun.in/merge-pdf");
  assert.equal(buildQrPayload({ type: "text", text: { text: "Hello PDFSun" } }).payload, "Hello PDFSun");
  assert.ok(buildQrPayload({ type: "email", email: { to: "team@pdfsun.in", subject: "Hi", body: "Msg" } }).payload.startsWith("mailto:team@pdfsun.in?"));
  assert.equal(buildQrPayload({ type: "phone", phone: { phone: "+91 98765-43210" } }).payload, "tel:+919876543210");
  assert.equal(buildQrPayload({ type: "sms", sms: { phone: "+919876543210", message: "Verify" } }).payload, "SMSTO:+919876543210:Verify");
  assert.equal(
    buildQrPayload({ type: "wifi", wifi: { ssid: "My;Home:Net", password: "p\\a;s", encryption: "WPA", hidden: true } }).payload,
    "WIFI:T:WPA;S:My\\;Home\\:Net;P:p\\\\a\\;s;H:true;;"
  );
  const vcard = buildQrPayload({
    type: "vcard",
    vcard: { firstName: "Mukesh", lastName: "Kalonia", organization: "PDFSun", title: "Founder", phone: "+919876543210", email: "support@pdfsun.in", website: "https://www.pdfsun.in", address: "Rajasthan, India" },
  });
  assert.equal(vcard.valid, true);
  assert.ok(vcard.payload.includes("BEGIN:VCARD") && vcard.payload.includes("END:VCARD"));
  assert.equal(buildQrPayload({ type: "whatsapp", whatsapp: { phone: "+919876543210", message: "Hi" } }).payload, "https://wa.me/919876543210?text=Hi");
  assert.equal(buildQrPayload({ type: "location", location: { latitude: "26.9124", longitude: "75.7873" } }).payload, "geo:26.912400,75.787300");
  assert.equal(buildQrPayload({ type: "google-forms", url: undefined, googleForms: { url: "https://forms.gle/abc123XYZ" } }).valid, true);
  assert.equal(buildQrPayload({ type: "pdf-menu", pdfMenu: { url: "https://www.pdfsun.in/menu.pdf" } }).valid, true);
});

test("QR Studio rejects javascript: XSS URLs, invalid Google Forms domains, and out-of-range coordinates", () => {
  assert.equal(buildQrPayload({ type: "url", url: { url: "javascript:alert(1)" } }).valid, false);
  assert.equal(buildQrPayload({ type: "google-forms", googleForms: { url: "https://evil.example.com/form" } }).valid, false);
  assert.equal(buildQrPayload({ type: "location", location: { latitude: "120", longitude: "75" } }).valid, false);
});

// 4. Logo Security Validation
test("QR logo validator enforces 5MB limit, raster magic bytes, and blocks SVG XSS uploads", () => {
  const svgReject = validateQrLogoFile({ name: "logo.svg", type: "image/svg+xml", size: 512 });
  assert.equal(svgReject.valid, false);

  const hugeReject = validateQrLogoFile({ name: "big.png", type: "image/png", size: MAX_QR_LOGO_BYTES + 1 });
  assert.equal(hugeReject.valid, false);

  const badMagic = validateQrLogoFile({
    name: "fake.png",
    type: "image/png",
    size: 100,
    headerBytes: new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0, 0, 0, 0, 0, 0, 0, 0]),
  });
  assert.equal(badMagic.valid, false);

  const validPng = validateQrLogoFile({
    name: "brand.png",
    type: "image/png",
    size: 2048,
    headerBytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
  });
  assert.equal(validPng.valid, true);
});

// 5. Real jsQR Round-Trip Scanning Verification
test("Real jsQR round-trip decoder verifies exact payload match (clean & ECC-H center logo occlusion)", () => {
  const urlPayload = "https://www.pdfsun.in/qr-code-generator?ref=verified";
  const cleanScan = verifyQrPayloadViaMatrixPixels(urlPayload, "M");
  assert.equal(cleanScan.verified, true);
  assert.equal(cleanScan.decodedText, urlPayload);

  assert.equal(resolveEffectiveEcc("L", true), "H");
  const logoOccludedScan = verifyQrPayloadViaMatrixPixels(urlPayload, "H", {
    simulateCenterLogoRatio: 0.2,
  });
  assert.equal(logoOccludedScan.verified, true);
  assert.equal(logoOccludedScan.exactMatch, true);
});

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
