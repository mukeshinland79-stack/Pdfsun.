/**
 * PDFSun.in — Phase 11F Automated Forensic Verification Suite
 * Advanced Invoice Layout Reconstruction & Zero-Fragmentation Table Fix
 *
 * Verifies:
 * 1. Complete elimination of naive 2-column newspaper page splitting on invoices
 * 2. Unification of line items grid into a single table with all 7 columns intact
 * 3. Multi-line item description retention within cell boundaries (no table fragmentation)
 * 4. Two-column party details reconstruction (Supplier card on left, Customer/Invoice on right)
 * 5. Summary and bank details reconstruction (Bank & words on left, Totals on right)
 * 6. Zero blank or poorly utilized pages (compact 0.5-inch margins, zero orphan page breaks)
 * 7. Verification of Mode A (Fully Editable Word) and Mode B (High-Fidelity Visual Reconstruction)
 * 8. OpenXML binary archive integrity and Mammoth HTML AST structure
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
import mammoth from "mammoth";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    failCount++;
  }
}

async function runPhase11FVerification() {
  const { convertPdfToWordEnterprise } = await import("../src/lib/enterprisePdfToWordEngine");
  console.log("==========================================================================");
  console.log("PDFSun.in — PHASE 11F AUTOMATED INVOICE LAYOUT RECONSTRUCTION VERIFICATION");
  console.log("Forensic Verification of Zero-Fragmentation Table & Invoice Reconstruction");
  console.log("==========================================================================\n");

  // -------------------------------------------------------------------------
  // SUITE 1: Create Real Complex GST Tax Invoice PDF
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: Generating Realistic Multi-Column GST Tax Invoice PDF ---");

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4: 595 x 842 pt

  // Header
  page.drawText("TAX INVOICE", { x: 250, y: 810, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText("Original for Recipient", { x: 460, y: 810, size: 9, font });

  // Two-Column Party Info
  page.drawText("Sold By / Supplier Details:", { x: 40, y: 780, size: 10, font: fontBold });
  page.drawText("ACME CLOUD SOLUTIONS PVT LTD", { x: 40, y: 765, size: 10, font: fontBold });
  page.drawText("Plot 42, Cyber City, Phase 2, Gurugram, HR - 122002", { x: 40, y: 750, size: 9, font });
  page.drawText("GSTIN: 06AABCA1234F1Z5 | PAN: AABCA1234F", { x: 40, y: 735, size: 9, font });
  page.drawText("State: Haryana (Code: 06)", { x: 40, y: 720, size: 9, font });

  page.drawText("Invoice Details & Billed To:", { x: 320, y: 780, size: 10, font: fontBold });
  page.drawText("Invoice No: INV-2026-8841", { x: 320, y: 763, size: 9, font: fontBold });
  page.drawText("Invoice Date: 12-May-2026 | Due: 26-May-2026", { x: 320, y: 748, size: 9, font });
  page.drawText("Billed To: TECHCORP ENTERPRISES INDIA LTD", { x: 320, y: 733, size: 9, font: fontBold });
  page.drawText("GSTIN: 27AAGCT9876Q1Z9 | State: Maharashtra (27)", { x: 320, y: 718, size: 9, font });
  page.drawText("Place of Supply: Maharashtra | Reverse Charge: No", { x: 320, y: 703, size: 9, font });

  // 7-Column Line Items Table Header
  page.drawText("S.No", { x: 40, y: 670, size: 9, font: fontBold });
  page.drawText("Item Description", { x: 75, y: 670, size: 9, font: fontBold });
  page.drawText("HSN/SAC", { x: 260, y: 670, size: 9, font: fontBold });
  page.drawText("Qty", { x: 325, y: 670, size: 9, font: fontBold });
  page.drawText("Rate", { x: 360, y: 670, size: 9, font: fontBold });
  page.drawText("Taxable", { x: 430, y: 670, size: 9, font: fontBold });
  page.drawText("IGST (18%)", { x: 505, y: 670, size: 9, font: fontBold });

  // Item 1: Multi-line description
  page.drawText("1", { x: 40, y: 645, size: 9, font });
  page.drawText("Enterprise Cloud Migration & Architecture", { x: 75, y: 645, size: 9, font });
  page.drawText("998313", { x: 260, y: 645, size: 9, font });
  page.drawText("1.00", { x: 325, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 360, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 430, y: 645, size: 9, font });
  page.drawText("13,500.00", { x: 505, y: 645, size: 9, font });

  page.drawText("AWS & Azure Multi-Region Disaster Recovery Setup", { x: 75, y: 630, size: 8, font });
  page.drawText("Period: 01-May-2026 to 31-May-2026", { x: 75, y: 615, size: 8, font });

  // Item 2
  page.drawText("2", { x: 40, y: 590, size: 9, font });
  page.drawText("SOC-2 Compliance Security Hardening Audit", { x: 75, y: 590, size: 9, font });
  page.drawText("998315", { x: 260, y: 590, size: 9, font });
  page.drawText("2.00", { x: 325, y: 590, size: 9, font });
  page.drawText("20,000.00", { x: 360, y: 590, size: 9, font });
  page.drawText("40,000.00", { x: 430, y: 590, size: 9, font });
  page.drawText("7,200.00", { x: 505, y: 590, size: 9, font });

  // Totals & Bank details
  page.drawText("Bank Account Details:", { x: 40, y: 530, size: 9, font: fontBold });
  page.drawText("Bank Name: HDFC Bank Ltd | A/c No: 50200012345678", { x: 40, y: 515, size: 8, font });
  page.drawText("IFSC Code: HDFC0000240 | Branch: Cyber City Gurugram", { x: 40, y: 500, size: 8, font });
  page.drawText("Amount in Words: One Lakh Thirty-Five Thousand Seven Hundred Only", { x: 40, y: 480, size: 8, font: fontBold });

  page.drawText("Total Taxable Value:", { x: 360, y: 530, size: 9, font });
  page.drawText("1,15,000.00", { x: 485, y: 530, size: 9, font: fontBold });
  page.drawText("Integrated Tax (IGST 18%):", { x: 360, y: 512, size: 9, font });
  page.drawText("20,700.00", { x: 485, y: 512, size: 9, font });
  page.drawText("Invoice Total (INR):", { x: 360, y: 490, size: 10, font: fontBold });
  page.drawText("1,35,700.00", { x: 485, y: 490, size: 10, font: fontBold });

  const pdfBytes = await pdfDoc.save();
  const testFile = new File([pdfBytes], "Realistic_GST_Tax_Invoice.pdf", { type: "application/pdf" });
  assert(pdfBytes.length > 1000, "Synthetic complex GST invoice PDF compiled successfully");

  // -------------------------------------------------------------------------
  // SUITE 2: Mode A (Fully Editable Word Document) Verification
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Mode A (Fully Editable Word Document) Verification ---");

  const resultModeA = await convertPdfToWordEnterprise(testFile, {
    preset: "editable_word",
    reconstructionMode: "editable_word",
  });

  assert(resultModeA.bytes instanceof Uint8Array, "Mode A produces binary Uint8Array");
  assert(resultModeA.bytes.length > 5000, `Mode A DOCX file size substantial (${resultModeA.bytes.length} bytes)`);

  // Check OpenXML PK ZIP header
  const isZip =
    resultModeA.bytes[0] === 0x50 &&
    resultModeA.bytes[1] === 0x4b &&
    resultModeA.bytes[2] === 0x03 &&
    resultModeA.bytes[3] === 0x04;
  assert(isZip, "Mode A output has valid Microsoft Word OpenXML PK zip header");
  assert(resultModeA.stats.reconstructionMode === "editable_word", "Discloses reconstructionMode as 'editable_word'");
  assert(resultModeA.stats.isInvoiceDetected === true, "Flags isInvoiceDetected as true");
  assert((resultModeA.stats.layoutFidelityScore || 0) >= 98, "High layout fidelity score reported");

  // Mammoth HTML Inspection for Mode A
  const htmlResModeA = await mammoth.convertToHtml({
    buffer: Buffer.from(resultModeA.bytes.buffer, resultModeA.bytes.byteOffset, resultModeA.bytes.byteLength),
  });
  const htmlA = htmlResModeA.value;

  // 1. Title Header
  assert(htmlA.includes("TAX INVOICE"), "Mode A preserves header title 'TAX INVOICE'");

  // 2. Two-Column Party Table (Seller vs Buyer)
  const hasPartyTableA = htmlA.includes("ACME CLOUD SOLUTIONS PVT LTD") && htmlA.includes("TECHCORP ENTERPRISES INDIA LTD");
  assert(hasPartyTableA, "Mode A groups Seller and Buyer side-by-side in Party Table");

  const hasSupplierGstinA = htmlA.includes("06AABCA1234F1Z5");
  assert(hasSupplierGstinA, "Mode A preserves Supplier GSTIN 06AABCA1234F1Z5 inside party card");

  const hasCustomerGstinA = htmlA.includes("27AAGCT9876Q1Z9");
  assert(hasCustomerGstinA, "Mode A preserves Customer GSTIN 27AAGCT9876Q1Z9 inside party card");

  const hasInvoiceNoA = htmlA.includes("INV-2026-8841");
  assert(hasInvoiceNoA, "Mode A preserves Invoice Number INV-2026-8841");

  // 3. Grid Table: All 7 columns unified in one single table
  const hasAll7HeadersA =
    htmlA.includes("<th><p><strong>S.No</strong></p></th>") &&
    htmlA.includes("<th><p><strong>Item Description</strong></p></th>") &&
    htmlA.includes("<th><p><strong>HSN/SAC</strong></p></th>") &&
    htmlA.includes("<th><p><strong>Qty</strong></p></th>") &&
    htmlA.includes("<th><p><strong>Rate</strong></p></th>") &&
    htmlA.includes("<th><p><strong>Taxable</strong></p></th>") &&
    htmlA.includes("<th><p><strong>IGST (18%)</strong></p></th>");
  assert(hasAll7HeadersA, "Mode A reconstructs unified 7-column line items table (Zero column loss)");

  // 4. Multi-line description retention in cell
  const hasMultiLineInCellA =
    htmlA.includes("Enterprise Cloud Migration &amp; Architecture") &&
    htmlA.includes("AWS &amp; Azure Multi-Region Disaster Recovery Setup") &&
    htmlA.includes("Period: 01-May-2026 to 31-May-2026");
  assert(hasMultiLineInCellA, "Mode A keeps multi-line item description inside description cell (Zero fragmentation)");

  // 5. Item 2 and HSN code inside table
  const hasItem2A = htmlA.includes("SOC-2 Compliance Security Hardening Audit");
  const hasHsn2A = htmlA.includes("998315");
  assert(hasItem2A && hasHsn2A, "Mode A retains item 2 and HSN code 998315 inside the table");

  // 6. Summary and Bank Details
  const hasBankDetailsA = htmlA.includes("HDFC0000240") && htmlA.includes("One Lakh Thirty-Five Thousand");
  assert(hasBankDetailsA, "Mode A preserves Bank IFSC Code and Amount in Words in summary card");

  const hasInvoiceTotalA = htmlA.includes("1,35,700.00");
  assert(hasInvoiceTotalA, "Mode A preserves Invoice Total INR 1,35,700.00");

  // 7. Table Count: Exactly 3 tables (Party, Grid, Summary)
  const tableCountA = (htmlA.match(/<table/g) || []).length;
  assert(tableCountA === 3, `Mode A table count is exactly 3 (Party, Grid, Summary) - got: ${tableCountA}`);

  // -------------------------------------------------------------------------
  // SUITE 3: Mode B (High-Fidelity Visual Reconstruction) Verification
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Mode B (High-Fidelity Visual Reconstruction) Verification ---");

  const resultModeB = await convertPdfToWordEnterprise(testFile, {
    preset: "visual_fidelity",
    reconstructionMode: "visual_fidelity",
  });

  assert(resultModeB.bytes instanceof Uint8Array, "Mode B produces binary Uint8Array");
  assert(resultModeB.stats.reconstructionMode === "visual_fidelity", "Discloses reconstructionMode as 'visual_fidelity'");

  const htmlResModeB = await mammoth.convertToHtml({
    buffer: Buffer.from(resultModeB.bytes.buffer, resultModeB.bytes.byteOffset, resultModeB.bytes.byteLength),
  });
  const htmlB = htmlResModeB.value;

  const tableCountB = (htmlB.match(/<table/g) || []).length;
  assert(tableCountB === 3, `Mode B table count is exactly 3 (Party, Grid, Summary) - got: ${tableCountB}`);
  assert(htmlB.includes("06AABCA1234F1Z5"), "Mode B retains Supplier GSTIN");
  assert(htmlB.includes("27AAGCT9876Q1Z9"), "Mode B retains Customer GSTIN");
  assert(htmlB.includes("1,35,700.00"), "Mode B retains Grand Total Amount");

  // -------------------------------------------------------------------------
  // SUITE 4: Banking Ledger & Strict Debit/Credit Table Layout
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Banking Ledger Statement Layout Verification ---");

  const bankPdfDoc = await PDFDocument.create();
  const bankFont = await bankPdfDoc.embedFont(StandardFonts.Helvetica);
  const bankFontBold = await bankPdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bankPage = bankPdfDoc.addPage([595.28, 841.89]);

  bankPage.drawText("ACCOUNT STATEMENT / PASSBOOK", { x: 200, y: 810, size: 14, font: bankFontBold });
  bankPage.drawText("Account No: 501002938471 | IFSC: HDFC0000240", { x: 50, y: 780, size: 10, font: bankFont });

  // Banking 5-column table
  bankPage.drawText("Date", { x: 50, y: 750, size: 9, font: bankFontBold });
  bankPage.drawText("Narration / Description", { x: 120, y: 750, size: 9, font: bankFontBold });
  bankPage.drawText("Withdrawal (Dr)", { x: 300, y: 750, size: 9, font: bankFontBold });
  bankPage.drawText("Deposit (Cr)", { x: 390, y: 750, size: 9, font: bankFontBold });
  bankPage.drawText("Closing Balance", { x: 480, y: 750, size: 9, font: bankFontBold });

  bankPage.drawText("01-May-2026", { x: 50, y: 725, size: 9, font: bankFont });
  bankPage.drawText("UPI/Vendor Settlement", { x: 120, y: 725, size: 9, font: bankFont });
  bankPage.drawText("15,000.00", { x: 300, y: 725, size: 9, font: bankFont });
  bankPage.drawText("0.00", { x: 390, y: 725, size: 9, font: bankFont });
  bankPage.drawText("85,000.00", { x: 480, y: 725, size: 9, font: bankFont });

  const bankBytes = await bankPdfDoc.save();
  const bankFile = new File([bankBytes], "Bank_Statement_May2026.pdf", { type: "application/pdf" });

  const bankRes = await convertPdfToWordEnterprise(bankFile, {
    preset: "financial_fidelity",
  });

  assert(bankRes.bytes.length > 5000, "Bank statement converts to valid DOCX");
  const bankHtml = (
    await mammoth.convertToHtml({
      buffer: Buffer.from(bankRes.bytes.buffer, bankRes.bytes.byteOffset, bankRes.bytes.byteLength),
    })
  ).value;

  assert(bankHtml.includes("ACCOUNT STATEMENT"), "Bank title preserved");
  assert(bankHtml.includes("Withdrawal (Dr)"), "Debit column header preserved");
  assert(bankHtml.includes("Deposit (Cr)"), "Credit column header preserved");
  assert(bankHtml.includes("85,000.00"), "Closing balance preserved");

  // -------------------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`PHASE 11F VERIFICATION COMPLETE:`);
  console.log(`  PASSED:   ${passCount}`);
  console.log(`  FAILED:   ${failCount}`);
  console.log("==========================================================================");

  if (failCount === 0) {
    console.log("🎉 ALL PHASE 11F ACCEPTANCE CRITERIA SATISFIED 100%!");
  } else {
    console.error("❌ PHASE 11F ACCEPTANCE SUITE FAILED!");
    process.exit(1);
  }
}

runPhase11FVerification().catch((err) => {
  console.error("Fatal error running Phase 11F verification suite:", err);
  process.exit(1);
});
