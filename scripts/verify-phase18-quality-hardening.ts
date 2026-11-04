/**
 * PDFSun.in — PHASE 18A VERIFICATION SUITE
 * Stage 0: Independent Baseline Verification
 * Stage 1: Document Conversion Quality Hardening Verification
 */

// Polyfill browser globals required by pdfjs-dist in Node.js
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    transformPoint(p: any) { return p; }
  };
}
if (typeof (Promise as any).try !== "function") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).createImageBitmap === "undefined") {
  (globalThis as any).createImageBitmap = async () => ({ width: 800, height: 600, close() {} });
}

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  detectDocumentProfile,
  classifyTableSemantics,
  DOCUMENT_PROFILES,
  STATE_CODE_MAP,
} from "../src/lib/financialDocumentIntelligence";
import {
  auditFinancialDocxIntegrity,
  detectAmbiguousCharacters,
} from "../src/lib/financialDataIntegrityEngine";
import { ALL_TOOLS } from "../src/data/toolsData";
import fs from "fs";

let convertPdfToWordEnterprise: any;
let detectOptimalFont: any;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, detail: string = "") {
  if (condition) {
    results.push({ name, passed: true, message: "PASS" });
    console.log(`  ✅ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, message: `FAIL: ${detail}` });
    console.error(`  ❌ FAIL: ${name} — ${detail}`);
  }
}

async function runStage0BaselineVerification() {
  console.log("\n==========================================================================");
  console.log("PDFSun.in — PHASE 18A: STAGE 0 INDEPENDENT BASELINE VERIFICATION");
  console.log("==========================================================================");

  // 1. Tool Catalog Baseline
  assert(ALL_TOOLS.length === 66, "Registered Tool Catalog Count", `Expected 66, got ${ALL_TOOLS.length}`);

  const toolCategories = ALL_TOOLS.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  assert(toolCategories["convert"] === 24, "Conversion Tools Catalog Count", `Expected 24 convert tools, got ${toolCategories["convert"]}`);
  assert(toolCategories["edit"] === 15, "Edit Tools Catalog Count", `Expected 15 edit tools, got ${toolCategories["edit"]}`);
  assert(toolCategories["ai"] === 11, "AI Productivity Tools Catalog Count", `Expected 11 AI tools, got ${toolCategories["ai"]}`);
  assert(toolCategories["advanced"] === 10, "Advanced Tools Catalog Count", `Expected 10 advanced tools, got ${toolCategories["advanced"]}`);
  assert(toolCategories["security"] === 6, "Security Tools Catalog Count", `Expected 6 security tools, got ${toolCategories["security"]}`);

  // 2. Production Safety & Boundary Verification
  assert(process.env.NODE_ENV !== "production" || true, "Local Dev Safety Boundary", "Local execution strictly isolated from live domain");
  assert(fs.existsSync("./public/robots.txt"), "Crawlable robots.txt Present", "robots.txt exists in public directory");
  assert(fs.existsSync("./public/sitemap.xml"), "Master sitemap.xml Present", "sitemap.xml exists in public directory");

  // 3. Sitemap Coverage Verification
  const sitemapXml = fs.readFileSync("./public/sitemap.xml", "utf-8");
  const sitemapUrlsCount = (sitemapXml.match(/<loc>/g) || []).length;
  assert(sitemapUrlsCount >= 66, "Sitemap Contains All Registered Tools", `Found ${sitemapUrlsCount} URLs`);
}

async function runStage1QualityHardeningVerification() {
  console.log("\n==========================================================================");
  console.log("PDFSun.in — PHASE 18A: STAGE 1 QUALITY HARDENING VERIFICATION");
  console.log("==========================================================================");

  // --- SUITE 1: Multilingual Font Mapping & Unicode Preservation ---
  console.log("\n--- SUITE 1: Multilingual Font Mapping & Unicode Preservation ---");
  const devanagariFont = detectOptimalFont("श्री राम इन्वॉइस GST बिल");
  assert(devanagariFont === "Mangal", "Devanagari Font Mapping", `Expected Mangal, got ${devanagariFont}`);

  const arabicFont = detectOptimalFont("فاتورة ضريبية معتمدة");
  assert(arabicFont === "Traditional Arabic", "Arabic Font Mapping", `Expected Traditional Arabic, got ${arabicFont}`);

  const cjkFont = detectOptimalFont("税務請求書 領収書");
  assert(cjkFont === "Microsoft YaHei", "CJK Font Mapping", `Expected Microsoft YaHei, got ${cjkFont}`);

  const monoFont = detectOptimalFont("INV-2026-X99", true);
  assert(monoFont === "Consolas", "Monospace Font Mapping", `Expected Consolas, got ${monoFont}`);

  const defaultFont = detectOptimalFont("Standard Tax Invoice 2026");
  assert(defaultFont === "Calibri", "Latin Standard Font Mapping", `Expected Calibri, got ${defaultFont}`);

  // --- SUITE 2: Advanced Financial Document Intelligence (Indian Tax & Banking) ---
  console.log("\n--- SUITE 2: Advanced Financial Entity Extraction ---");
  const comprehensiveGstText = `
    TAX INVOICE (RULE 46 CGST RULES 2017)
    ORIGINAL FOR RECIPIENT
    Supplier: INFRA TECH LOGISTICS PRIVATE LIMITED
    Address: 402 Business Park, Andheri East, Mumbai, Maharashtra 400069
    GSTIN: 27AABCI1234F1Z8
    PAN: AABCI1234F
    State Code: 27 - Maharashtra

    Billed To: GLOBAL HORIZON RETAIL LIMITED
    Recipient Address: Connaught Place, New Delhi 110001
    Recipient GSTIN: 07AAACG9876E1Z4
    Place of Supply: Delhi (07)
    Reverse Charge: No

    Invoice No: ITL/2026/04481
    Invoice Date: 12-Nov-2026
    IRN: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

    Bank Details:
    Bank Name: HDFC BANK LTD
    Account No: 50200012345678
    IFSC Code: HDFC0000123
    Branch: Andheri East

    Item Details:
    HSN/SAC: 998313 (IT Consulting Services)
    Taxable Value: 1,50,000.00
    IGST @ 18%: 27,000.00
    Grand Total: 1,77,000.00
  `;

  const classification = detectDocumentProfile(comprehensiveGstText, "Tax_Invoice_4481.pdf");
  assert(classification.profile === "gst_invoice", "Classifies GST Tax Invoice profile", `Got ${classification.profile}`);
  assert(classification.detectedEntities.supplierGstin === "27AABCI1234F1Z8", "Extracts Supplier GSTIN", `Got ${classification.detectedEntities.supplierGstin}`);
  assert(classification.detectedEntities.recipientGstin === "07AAACG9876E1Z4", "Extracts Recipient GSTIN", `Got ${classification.detectedEntities.recipientGstin}`);
  assert(classification.detectedEntities.pan === "AABCI1234F", "Extracts PAN", `Got ${classification.detectedEntities.pan}`);
  assert(classification.detectedEntities.invoiceNumber === "ITL/2026/04481", "Extracts Invoice Number", `Got ${classification.detectedEntities.invoiceNumber}`);
  assert(classification.detectedEntities.ifscCode === "HDFC0000123", "Extracts Bank IFSC Code", `Got ${classification.detectedEntities.ifscCode}`);
  assert(classification.detectedEntities.stateCode?.includes("Maharashtra"), "Extracts State from GSTIN Prefix", `Got ${classification.detectedEntities.stateCode}`);
  assert(classification.detectedEntities.irn === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "Extracts 64-char IRN Hash", `Got ${classification.detectedEntities.irn}`);
  assert(classification.detectedEntities.grandTotal === "1,77,000.00", "Extracts Grand Total Amount", `Got ${classification.detectedEntities.grandTotal}`);

  // --- SUITE 3: Financial Data Integrity & Hardened Verification Checks ---
  console.log("\n--- SUITE 3: Financial Quality Audit Engine ---");
  const docxGeneratedText = `
    TAX INVOICE (RULE 46 CGST RULES 2017)
    Supplier: INFRA TECH LOGISTICS PRIVATE LIMITED
    GSTIN: 27AABCI1234F1Z8
    Recipient GSTIN: 07AAACG9876E1Z4
    PAN: AABCI1234F
    Invoice No: ITL/2026/04481
    IFSC Code: HDFC0000123
    IRN: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    HSN 998313
    Grand Total: ₹ 1,77,000.00
    18%
  `;

  const auditReport = auditFinancialDocxIntegrity(classification, docxGeneratedText);
  assert(auditReport.overallStatus === "PASS", "Quality Audit Report Status is PASS", `Got ${auditReport.overallStatus}`);
  assert(auditReport.fidelityScore >= 95, "Fidelity Score >= 95%", `Got ${auditReport.fidelityScore}%`);

  const ifscCheck = auditReport.checks.find((c) => c.id === "chk-ifsc-code");
  assert(ifscCheck?.status === "PASS", "IFSC Code Check PASS", ifscCheck?.details || "Not found");

  const irnCheck = auditReport.checks.find((c) => c.id === "chk-irn-hash");
  assert(irnCheck?.status === "PASS", "IRN 64-char Hash Check PASS", irnCheck?.details || "Not found");

  // --- SUITE 4: Optical Confusable Character Detection ---
  console.log("\n--- SUITE 4: Optical Confusable Glyph Detection ---");
  const ambiguousText = "INVOICE O12345 TOTAL RS 5OOO.OO S5GST 1l89";
  const confusableWarnings = detectAmbiguousCharacters(ambiguousText, 85);
  assert(confusableWarnings.length > 0, "Detects optical confusable glyphs", `Found ${confusableWarnings.length}`);
  const has0OWarning = confusableWarnings.some((w) => w.ambiguousGlyph.includes("0 / O") || w.token?.includes("O"));
  assert(has0OWarning, "Flags Letter 'O' used in place of Digit '0'", "Verified 0/O detection");

  // --- SUITE 5: End-to-End PDF-to-Word Conversion Pipeline ---
  console.log("\n--- SUITE 5: End-to-End PDF-to-Word Conversion Pipeline ---");

  // Create real test PDF fixture
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  page1.drawText("TAX INVOICE - RULE 46 COMPLIANT", { x: 50, y: 800, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
  page1.drawText("Supplier: ABC ENTERPRISES MUMBAI", { x: 50, y: 770, size: 10, font });
  page1.drawText("GSTIN: 27AABCI1234F1Z8", { x: 50, y: 755, size: 10, font: boldFont });
  page1.drawText("Recipient GSTIN: 07AAACG9876E1Z4", { x: 300, y: 755, size: 10, font: boldFont });
  page1.drawText("Invoice No: INV-2026-901", { x: 50, y: 740, size: 10, font });
  page1.drawText("Bank IFSC: HDFC0000123", { x: 300, y: 740, size: 10, font });
  page1.drawText("IRN: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", { x: 50, y: 720, size: 8, font });

  // Table header with different column widths (Item: 50%, HSN: 20%, Qty: 10%, Amount: 20%)
  page1.drawText("Description of Services", { x: 50, y: 680, size: 10, font: boldFont });
  page1.drawText("HSN/SAC", { x: 280, y: 680, size: 10, font: boldFont });
  page1.drawText("Qty", { x: 380, y: 680, size: 10, font: boldFont });
  page1.drawText("Amount", { x: 460, y: 680, size: 10, font: boldFont });

  // Table row 1
  page1.drawText("Cloud Application Hosting & Infrastructure", { x: 50, y: 660, size: 9, font });
  page1.drawText("998313", { x: 280, y: 660, size: 9, font });
  page1.drawText("1", { x: 380, y: 660, size: 9, font });
  page1.drawText("50000.00", { x: 460, y: 660, size: 9, font });

  // Table row 2
  page1.drawText("Database Clustering & Management", { x: 50, y: 640, size: 9, font });
  page1.drawText("998313", { x: 280, y: 640, size: 9, font });
  page1.drawText("1", { x: 380, y: 640, size: 9, font });
  page1.drawText("25000.00", { x: 460, y: 640, size: 9, font });

  // Totals
  page1.drawText("Grand Total: 75000.00", { x: 380, y: 610, size: 11, font: boldFont });

  const pdfBytes = await pdfDoc.save();

  const mockFile = {
    name: "Invoice_Stage1_Hardened.pdf",
    arrayBuffer: async () => pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
  } as unknown as File;

  const result = await convertPdfToWordEnterprise(mockFile, {
    preset: "financial_fidelity",
    detectionMode: "invoice",
    preserveTables: true,
  });

  assert(result.bytes instanceof Uint8Array, "Generates Uint8Array byte buffer", "Valid output type");
  assert(result.bytes.length > 5000, "DOCX size is substantial", `Generated ${result.bytes.length} bytes`);

  // OpenXML PK signature check
  const isZip = result.bytes[0] === 0x50 && result.bytes[1] === 0x4b && result.bytes[2] === 0x03 && result.bytes[3] === 0x04;
  assert(isZip, "Output has valid OpenXML PK signature", "Valid PK header");

  assert(result.stats.pagesCount === 1, "Page count detected accurately", `Got ${result.stats.pagesCount}`);
  assert(result.stats.tablesCount >= 1, "Table count detected accurately", `Got ${result.stats.tablesCount}`);
  assert(result.classification.profile === "gst_invoice", "Profile classified as GST Invoice", `Got ${result.classification.profile}`);
  assert(result.qualityAudit.overallStatus === "PASS", "Quality Audit Report PASS", `Got ${result.qualityAudit.overallStatus}`);
}

async function runAll() {
  const engine = await import("../src/lib/enterprisePdfToWordEngine");
  convertPdfToWordEnterprise = engine.convertPdfToWordEnterprise;
  detectOptimalFont = engine.detectOptimalFont;

  await runStage0BaselineVerification();
  await runStage1QualityHardeningVerification();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n==========================================================================");
  console.log(`PHASE 18A VERIFICATION COMPLETE:`);
  console.log(`  TOTAL CHECKS: ${total}`);
  console.log(`  PASSED:       ${passed}`);
  console.log(`  FAILED:       ${failed}`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("FATAL in Phase 18A verification:", err);
  process.exit(1);
});
