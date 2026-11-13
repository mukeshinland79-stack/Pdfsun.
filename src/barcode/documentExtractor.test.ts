/**
 * PDFSun Barcode Studio — Document Extractor Unit Test Suite
 */

import { suggestSymbology, extractCandidatesFromText } from "./documentExtractor";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
  }
}

async function runExtractorTests() {
  console.log("==========================================================================");
  console.log("PDFSun.in — BARCODE DOCUMENT EXTRACTOR TEST SUITE");
  console.log("==========================================================================");

  // 1. Symbology suggestion tests
  console.log("\n[1] Symbology Auto-Suggestion");
  assert(suggestSymbology("https://www.pdfsun.in/barcode") === "qrcode", "URL maps to qrcode");
  assert(suggestSymbology("8901030999991") === "ean13", "13-digit maps to ean13");
  assert(suggestSymbology("9780132350884") === "isbn", "13-digit starting with 978 maps to isbn");
  assert(suggestSymbology("012345678905") === "upca", "12-digit maps to upca");
  assert(suggestSymbology("12345678") === "ean8", "8-digit maps to ean8");
  assert(suggestSymbology("12345678901234") === "itf14", "14-digit maps to itf14");
  assert(suggestSymbology("SKU-INV-9902") === "code128", "Alphanumeric SKU maps to code128");

  // 2. Candidate Extraction from text
  console.log("\n[2] Candidate Extraction from Text Blocks");
  const sampleDocText = `
    INVOICE #9821
    Date: 2026-11-12
    Customer: Acme Corp
    SKU: SUN-BAM-01 | Eco Bamboo Brush
    SKU-SCC-30 | Solar Charge Controller
    Retail GTIN: 8901030999991
    Product Link: https://www.pdfsun.in/products/solar
  `;

  const candidates = extractCandidatesFromText(sampleDocText, "Invoice #9821");
  assert(candidates.length >= 3, `Extracted ${candidates.length} candidates from invoice text`);

  const hasSku1 = candidates.some((c) => c.value === "SUN-BAM-01");
  const hasGtin = candidates.some((c) => c.value === "8901030999991");
  const hasUrl = candidates.some((c) => c.value === "https://www.pdfsun.in/products/solar");

  assert(hasSku1, "Extracted SKU token SUN-BAM-01");
  assert(hasGtin, "Extracted GTIN token 8901030999991");
  assert(hasUrl, "Extracted URL token https://www.pdfsun.in/products/solar");

  console.log("==========================================================================");
  console.log(`DOCUMENT EXTRACTOR SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) process.exit(1);
}

runExtractorTests();
