import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  generateBarcode,
  computeGs1Mod10CheckDigit,
  expandUpceToUpcaBase,
  sanitizeSpreadsheetCell,
  escapeCsvField,
} from "../lib/barcodeEngine";
import {
  buildQrPayload,
  validateBulkQrPayload,
  validateQrLogoFile,
  isSafeRasterDataUrl,
  verifyQrPayloadViaMatrixPixels,
  generateQrStudioSvg,
  resolveEffectiveEcc,
  MAX_QR_LOGO_BYTES,
  QrStudioPayloadInput,
} from "../lib/qrStudioEngine";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`  ✗ FAIL: ${name} -> ${err?.message || err}`);
  }
}

async function main() {
  console.log("==========================================================================");
  console.log("PDFSun.in — TOOL #67 (BARCODE) & TOOL #68 (QR STUDIO) ENGINE TEST SUITE");
  console.log("==========================================================================");

  // 1. Barcode Symbologies, Checksums & Bounds
  await test("Code 128 encodes alphanumeric & numeric pairs, rejects non-ASCII and >128 chars", () => {
    const res = generateBarcode("PDFSUN-20260048", { symbology: "CODE128" });
    assert.equal(res.valid, true);
    assert.ok(res.svgMarkup.includes("<svg"));
    assert.ok(res.totalModules > 50);

    const nonAscii = generateBarcode("PDFSUN\u00e9", { symbology: "CODE128" });
    assert.equal(nonAscii.valid, false);

    const tooLong = generateBarcode("A".repeat(129), { symbology: "CODE128" });
    assert.equal(tooLong.valid, false);
  });

  await test("Code 39 enforces valid alphabet, Mod-43 check digit, and 80-char max length", () => {
    const res = generateBarcode("INV-2026", { symbology: "CODE39", includeChecksum: true });
    assert.equal(res.valid, true);
    assert.ok(res.checkDigit && res.checkDigit.length === 1);
    assert.equal(generateBarcode("invalid@char", { symbology: "CODE39" }).valid, false);
    assert.equal(generateBarcode("A".repeat(81), { symbology: "CODE39" }).valid, false);
  });

  await test("EAN-13 preserves leading zeros, computes Mod-10 check digit, and rejects bad length/check", () => {
    const auto = generateBarcode("089010308951", { symbology: "EAN13" });
    assert.equal(auto.valid, true);
    assert.equal(auto.normalizedValue.length, 13);
    assert.equal(auto.normalizedValue[0], "0");
    const expected = computeGs1Mod10CheckDigit("089010308951");
    assert.equal(auto.checkDigit, expected);

    const wrongDigit = String((Number(expected) + 1) % 10);
    assert.equal(generateBarcode("089010308951" + wrongDigit, { symbology: "EAN13" }).valid, false);
    assert.equal(generateBarcode("12345", { symbology: "EAN13" }).valid, false);
  });

  await test("EAN-8 validates 7-digit auto check digit and rejects invalid 8-digit checksum", () => {
    const auto = generateBarcode("9638507", { symbology: "EAN8" });
    assert.equal(auto.valid, true);
    assert.equal(auto.normalizedValue, "96385074");
    assert.equal(auto.totalModules, 67);

    assert.equal(generateBarcode("96385079", { symbology: "EAN8" }).valid, false);
    assert.equal(generateBarcode("963850", { symbology: "EAN8" }).valid, false);
  });

  await test("UPC-A validates 11-digit & 12-digit inputs and preserves leading zero", () => {
    const res = generateBarcode("03600029145", { symbology: "UPCA" });
    assert.equal(res.valid, true);
    assert.equal(res.normalizedValue, "036000291452");
    assert.equal(res.totalModules, 95);

    assert.equal(generateBarcode("036000291459", { symbology: "UPCA" }).valid, false);
  });

  await test("UPC-E expands 6/7/8 digits accurately, rejects invalid NS 2, and produces 51-module symbol", () => {
    assert.equal(expandUpceToUpcaBase("0425261"), "04210000526");
    const res = generateBarcode("0425261", { symbology: "UPCE" });
    assert.equal(res.valid, true);
    assert.equal(res.totalModules, 51);
    assert.equal(res.normalizedValue.length, 8);

    assert.equal(generateBarcode("2425261", { symbology: "UPCE" }).valid, false);
  });

  await test("ITF-14 validates 13/14 digits, Mod-10 check digit, leading zeros, and bearer bars", () => {
    const res = generateBarcode("0001234567890", { symbology: "ITF14", itfBearerBars: true });
    assert.equal(res.valid, true);
    assert.equal(res.normalizedValue, "00012345678905");
    assert.equal(generateBarcode("10012345678905", { symbology: "ITF14" }).valid, false);
  });

  await test("Codabar validates allowed characters, start/stop guards, and 80-char max length", () => {
    const res = generateBarcode("123456-78", { symbology: "CODABAR", codabarStart: "A", codabarStop: "C" });
    assert.equal(res.valid, true);
    assert.equal(res.normalizedValue, "A123456-78C");

    assert.equal(generateBarcode("ABC123", { symbology: "CODABAR" }).valid, false);
    assert.equal(generateBarcode("AB", { symbology: "CODABAR" }).valid, false);
    assert.equal(generateBarcode("1".repeat(81), { symbology: "CODABAR" }).valid, false);
  });

  await test("GS1-128 parses AIs, inserts leading/separator FNC1 (102), and validates GTIN Mod-10 + expiry dates + cap", () => {
    const res = generateBarcode("(01)08901030895128(10)LOT42(17)271231", { symbology: "GS1_128" });
    assert.equal(res.valid, true);
    const c128Vals = res.metadata?.code128Values || [];
    assert.equal(c128Vals[1], 102);
    assert.ok(c128Vals.filter((v) => v === 102).length >= 2);

    assert.equal(generateBarcode("(01)08901030895120(10)LOT42", { symbology: "GS1_128" }).valid, false);
    assert.equal(generateBarcode("(17)271331", { symbology: "GS1_128" }).valid, false);
    assert.equal(generateBarcode(`(10)${"A".repeat(165)}`, { symbology: "GS1_128" }).valid, false);
  });

  // 2. Barcode SVG XSS & CSV Formula Injection Protection
  await test("Barcode SVG escapes script tags/quotes (no raw XSS in customLabel)", () => {
    const res = generateBarcode("12345", {
      symbology: "CODE128",
      customLabel: `<script>alert("xss")</script>`,
    });
    assert.equal(res.valid, true);
    assert.equal(res.svgMarkup.includes("<script>"), false);
    assert.ok(res.svgMarkup.includes("&lt;script&gt;"));
  });

  await test("CSV/XLSX formula injection sanitizer prefixes =, +, -, @, tab, CR and preserves leading zeros", () => {
    assert.equal(sanitizeSpreadsheetCell("=CMD()"), "'=CMD()");
    assert.equal(sanitizeSpreadsheetCell("+1+1"), "'+1+1");
    assert.equal(sanitizeSpreadsheetCell("-SUM(A1)"), "'-SUM(A1)");
    assert.equal(sanitizeSpreadsheetCell("@import"), "'@import");
    assert.equal(sanitizeSpreadsheetCell("\t=1"), "'\t=1");
    assert.equal(sanitizeSpreadsheetCell("00123456"), "00123456");
    assert.equal(escapeCsvField("0890103089512"), "0890103089512");
  });

  // 3. QR Studio All 11 Payload Builders & jsQR Pixel Round-Trip Decoding
  await test("QR Studio builds & jsQR-decodes all 11 content types with exact payload match", () => {
    const cases: QrStudioPayloadInput[] = [
      { type: "url", url: { url: "pdfsun.in/merge-pdf" } },
      { type: "text", text: { text: "Hello PDFSun" } },
      { type: "email", email: { to: "team@pdfsun.in", subject: "Hi", body: "Msg" } },
      { type: "phone", phone: { phone: "+91 98765-43210" } },
      { type: "sms", sms: { phone: "+919876543210", message: "Verify" } },
      { type: "wifi", wifi: { ssid: "My;Home:Net", password: "p\\a;s", encryption: "WPA", hidden: true } },
      {
        type: "vcard",
        vcard: {
          firstName: "Mukesh",
          lastName: "Kalonia",
          organization: "PDFSun",
          title: "Founder",
          phone: "+919876543210",
          email: "support@pdfsun.in",
          website: "https://www.pdfsun.in",
          address: "Rajasthan, India",
        },
      },
      { type: "whatsapp", whatsapp: { phone: "+919876543210", message: "Hi" } },
      { type: "location", location: { latitude: "26.9124", longitude: "75.7873" } },
      { type: "google-forms", googleForms: { url: "https://forms.gle/abc123XYZ" } },
      { type: "pdf-menu", pdfMenu: { url: "https://www.pdfsun.in/menu.pdf" } },
    ];

    for (const c of cases) {
      const built = buildQrPayload(c);
      assert.equal(built.valid, true, `Failed payload build for ${c.type}: ${built.error}`);
      const decoded = verifyQrPayloadViaMatrixPixels(built.payload, "M");
      assert.equal(decoded.verified, true, `Failed jsQR decode for ${c.type}`);
      assert.equal(decoded.decodedText, built.payload, `Exact match failed for ${c.type}`);
    }
  });

  await test("QR Studio & Bulk validator reject javascript:/data:/file: XSS URLs, invalid Google Forms, & oversized payloads", () => {
    assert.equal(buildQrPayload({ type: "url", url: { url: "javascript:alert(1)" } }).valid, false);
    assert.equal(buildQrPayload({ type: "google-forms", googleForms: { url: "https://evil.example.com/form" } }).valid, false);
    assert.equal(buildQrPayload({ type: "location", location: { latitude: "120", longitude: "75" } }).valid, false);

    assert.equal(validateBulkQrPayload("javascript:alert(1)").valid, false);
    assert.equal(validateBulkQrPayload("data:text/html,<script>alert(1)</script>").valid, false);
    assert.equal(validateBulkQrPayload("vbscript:msgbox(1)").valid, false);
    assert.equal(validateBulkQrPayload("file:///etc/passwd").valid, false);
    assert.equal(validateBulkQrPayload("A".repeat(2501)).valid, false);
    assert.equal(validateBulkQrPayload("https://www.pdfsun.in").valid, true);
  });

  // 4. Logo Security & SVG Attribute Injection Prevention
  await test("QR logo validator enforces 5MB limit, >=12-byte raster magic bytes, blocks SVG XSS & tiny spoofs", async () => {
    assert.equal(validateQrLogoFile({ name: "logo.svg", type: "image/svg+xml", size: 512 }).valid, false);
    assert.equal(validateQrLogoFile({ name: "big.png", type: "image/png", size: MAX_QR_LOGO_BYTES + 1 }).valid, false);

    const tinySpoof = validateQrLogoFile({
      name: "tiny.png",
      type: "image/png",
      size: 4,
      headerBytes: new Uint8Array([0x3c, 0x73, 0x76, 0x67]),
    });
    assert.equal(tinySpoof.valid, false);

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

    assert.equal(isSafeRasterDataUrl('data:image/png;base64,iVBOR" onload="alert(1)'), false);
    const svgOut = await generateQrStudioSvg("https://www.pdfsun.in", {
      size: 240,
      margin: 2,
      ecc: "H",
      foreground: "#0f172a",
      background: "#ffffff",
      transparentBackground: true,
      logoDataUrl: 'data:image/png;base64,iVBOR" onload="alert(1)',
    });
    assert.equal(svgOut.includes("onload="), false);
    assert.ok(svgOut.includes("<svg"));
  });

  // 5. Real jsQR Center-Logo ECC-H Occlusion + Export Pipeline Verification (XLSX, ZIP, PDF)
  await test("Real jsQR verifies ECC-H 20% center logo occlusion, transparent QR SVG, XLSX leading-zero round-trip, ZIP & PDF", async () => {
    const urlPayload = "https://www.pdfsun.in/qr-code-generator?ref=verified";
    assert.equal(resolveEffectiveEcc("L", true), "H");
    const logoOccludedScan = verifyQrPayloadViaMatrixPixels(urlPayload, "H", {
      simulateCenterLogoRatio: 0.2,
    });
    assert.equal(logoOccludedScan.verified, true);
    assert.equal(logoOccludedScan.exactMatch, true);

    // XLSX write/read leading zero preservation
    const ws = XLSX.utils.aoa_to_sheet([["code", "label"], ["089010308951", "Tea"]]);
    Object.keys(ws).forEach((k) => {
      if (!k.startsWith("!") && ws[k]) {
        ws[k].t = "s";
        ws[k].z = "@";
      }
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barcodes");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const readWb = XLSX.read(buf, { type: "array", raw: false });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(readWb.Sheets.Barcodes, { raw: false });
    assert.equal(rows[0].code, "089010308951");

    // ZIP + jsPDF integrity
    const bc = generateBarcode("089010308951", { symbology: "EAN13" });
    const zip = new JSZip();
    zip.file("001-ean13.svg", bc.svgMarkup);
    const zipBytes = await zip.generateAsync({ type: "uint8array" });
    assert.equal(zipBytes[0], 0x50); // 'P'
    assert.equal(zipBytes[1], 0x4b); // 'K'

    const pdfDoc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    pdfDoc.text("PDFSun Label Sheet Test", 40, 50);
    const pdfBytes = new Uint8Array(pdfDoc.output("arraybuffer"));
    const pdfHeader = String.fromCharCode(pdfBytes[0], pdfBytes[1], pdfBytes[2], pdfBytes[3]);
    assert.equal(pdfHeader, "%PDF");
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
