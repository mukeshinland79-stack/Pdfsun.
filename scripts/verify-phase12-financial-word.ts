/**
 * PDFSun.in — Phase 12 Automated Verification Suite
 * Next-Generation Universal PDF-to-Word & Financial Document Intelligence Engine
 *
 * Verifies:
 * 1. 18-profile classification & entity extraction (GST Rule 46, Banking, Balance Sheet, P&L, etc.)
 * 2. Banking table semantic classification (strict debit & credit column separation)
 * 3. Confusable OCR character detection & review preservation
 * 4. Financial data integrity audit report generation & fidelity scoring
 * 5. End-to-end PDF-to-DOCX conversion with real-file AST validation & OpenXML structure integrity
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
import {
  detectDocumentProfile,
  DOCUMENT_PROFILES,
  classifyTableSemantics,
} from "../src/lib/financialDocumentIntelligence";
import {
  detectAmbiguousCharacters,
  auditFinancialDocxIntegrity,
} from "../src/lib/financialDataIntegrityEngine";

let passCount = 0;
let warnCount = 0;
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

async function runPhase12Verification() {
  console.log("==========================================================================");
  console.log("PDFSun.in — PHASE 12 AUTOMATED AUDIT & CERTIFICATION SUITE");
  console.log("Next-Gen Universal PDF-to-Word & Financial Document Intelligence Engine");
  console.log("==========================================================================\n");

  // -------------------------------------------------------------------------
  // SUITE 1: 18 Document Classification Profiles & GST Rule 46 Entity Extraction
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: Document Classification & Entity Extraction ---");

  const gstInvoiceText = `
    TAX INVOICE
    Invoice No: INV-2026-9042
    Invoice Date: 15-08-2026
    Supplier Details:
    ACME TECHNOLOGIES PRIVATE LIMITED
    GSTIN / UIN: 27AABCU9603R1ZM
    PAN: AABCU9603R
    State: Maharashtra (Code: 27)

    Recipient / Bill To:
    GLOBAL LOGISTICS LTD
    GSTIN / UIN: 29AAGCB2180N1ZB
    PAN: AAGCB2180N
    State: Karnataka (Code: 29)

    HSN / SAC: 998313
    Description: IT Consultancy & Software Services
    Taxable Value: ₹1,00,000.00
    CGST @ 9%: ₹9,000.00
    SGST @ 9%: ₹9,000.00
    Total Tax: ₹18,000.00
    Invoice Grand Total: ₹1,18,000.00
    Reverse Charge Applicable: No
  `;

  const gstClassification = detectDocumentProfile(gstInvoiceText, "Acme_Tax_Invoice.pdf");
  assert(gstClassification.profile === "gst_invoice", "Classifies GST Tax Invoice profile correctly");
  assert(gstClassification.entities?.gstinSupplier === "27AABCU9603R1ZM", "Extracts Supplier GSTIN verbatim");
  assert(gstClassification.entities?.gstinRecipient === "29AAGCB2180N1ZB", "Extracts Recipient GSTIN verbatim");
  assert(gstClassification.entities?.pan === "AABCU9603R", "Extracts PAN number");
  assert(gstClassification.entities?.invoiceNumber === "INV-2026-9042", "Extracts Invoice Number");
  assert(gstClassification.entities?.hsnCodes?.includes("998313") === true, "Extracts HSN/SAC code 998313");

  const bankStatementText = `
    HDFC BANK LIMITED
    ACCOUNT STATEMENT
    Account Name: Mukesh Sharma
    Account Number: 50100234901234
    IFSC Code: HDFC0000128
    Period: 01-Jan-2026 to 31-Jan-2026
    Date       Description               Withdrawal(Dr)  Deposit(Cr)   Balance
    01/01/2026 Opening Balance                                         ₹50,000.00
    05/01/2026 NEFT INW-KUMAR ENTERPRISE                 ₹25,000.00    ₹75,000.00
    10/01/2026 UPI-SWIGGY FOOD           ₹650.00                       ₹74,350.00
    15/01/2026 SALARY CREDIT                             ₹1,20,000.00  ₹1,94,350.00
    25/01/2026 EMI LOAN PAYMENT          ₹35,000.00                    ₹1,59,350.00
  `;

  const bankClassification = detectDocumentProfile(bankStatementText, "HDFC_Statement_Jan2026.pdf");
  assert(bankClassification.profile === "bank_statement", "Classifies Bank Statement & Ledger profile correctly");
  assert(bankClassification.category === "banking_ledger", "Categorizes as banking document");

  const balanceSheetText = `
    BALANCE SHEET AS AT 31ST MARCH 2026
    EQUITY AND LIABILITIES:
    1. Shareholders Funds
       (a) Share Capital: ₹50,00,000
       (b) Reserves & Surplus: ₹1,20,00,000
    2. Non-Current Liabilities
       (a) Long-term borrowings: ₹40,00,000
    TOTAL LIABILITIES: ₹2,10,00,000

    ASSETS:
    1. Non-Current Assets
       (a) Property, Plant & Equipment: ₹1,50,00,000
    2. Current Assets
       (a) Trade Receivables: ₹35,00,000
       (b) Cash & Cash Equivalents: ₹25,00,000
    TOTAL ASSETS: ₹2,10,00,000
  `;

  const bsClassification = detectDocumentProfile(balanceSheetText, "Balance_Sheet_FY2526.pdf");
  assert(bsClassification.profile === "balance_sheet", "Classifies Balance Sheet profile correctly");

  const pnlText = `
    STATEMENT OF PROFIT AND LOSS FOR THE YEAR ENDED 31 MARCH 2026
    Revenue from Operations: ₹4,50,00,000
    Other Income: ₹15,00,000
    Total Income: ₹4,65,00,000
    Cost of Materials Consumed: ₹1,80,00,000
    Employee Benefit Expenses: ₹90,00,000
    Finance Costs: ₹12,00,000
    Depreciation & Amortization: ₹25,00,000
    Profit Before Tax: ₹1,58,00,000
    Net Profit After Tax: ₹1,18,50,000
  `;

  const pnlClassification = detectDocumentProfile(pnlText, "Profit_and_Loss_FY26.pdf");
  assert(pnlClassification.profile === "profit_loss", "Classifies Profit & Loss Statement correctly");

  const poText = `
    PURCHASE ORDER
    PO Number: PO-2026-8812
    Vendor: Dynamic Industrial Tools
    Payment Terms: Net 30 Days
    Delivery Address: Warehouse 4, Sector 18, Gurgaon
    Item: Industrial Bearings (SKU: IB-900)
    Quantity: 500 units @ ₹450 = ₹2,25,000
  `;

  const poClassification = detectDocumentProfile(poText, "PO_8812.pdf");
  assert(poClassification.profile === "purchase_order", "Classifies Purchase Order correctly");

  const utilityBillText = `
    TATA POWER ELECTRICITY CONSUMER BILL
    Consumer Number: 9008234129
    Meter No: TP-88421
    Sanctioned Load: 5.0 kW
    Units Consumed: 482 kWh
    Due Date: 28-Aug-2026
    Total Amount Payable: ₹4,290.00
  `;

  const utilityClassification = detectDocumentProfile(utilityBillText, "Tata_Power_Bill.pdf");
  assert(utilityClassification.profile === "utility_bill", "Classifies Utility Bill correctly");

  const medicalBillText = `
    APOLLO HOSPITALS ENTERPRISE LIMITED
    INPATIENT FINAL DISCHARGE BILL
    Patient Name: Rakesh Verma
    UHID: APL-902148
    Doctor: Dr. S. Mukherjee, MD
    Room Category: Deluxe Ward (4 Days)
    Pharmacy Charges: ₹14,250.00
    Investigation / Lab Charges: ₹8,900.00
    Total Hospital Charges: ₹58,400.00
  `;

  const medicalClassification = detectDocumentProfile(medicalBillText, "Apollo_Medical_Bill.pdf");
  assert(medicalClassification.profile === "medical_bill", "Classifies Medical & Hospital Bill correctly");

  const payrollText = `
    SALARY SLIP FOR THE MONTH OF JULY 2026
    Employee Name: Ananya Sen
    Employee ID: EMP-1049
    Designation: Senior Architect
    Basic Salary: ₹85,000.00
    HRA: ₹34,000.00
    Special Allowance: ₹25,000.00
    Provident Fund (PF): ₹9,500.00
    Professional Tax: ₹200.00
    Net Salary Payable: ₹1,34,300.00
  `;

  const payrollClassification = detectDocumentProfile(payrollText, "Salary_Slip_July2026.pdf");
  assert(payrollClassification.profile === "payroll_statement", "Classifies Payroll / Salary Slip correctly");

  const ukVatText = `
    VAT INVOICE
    Company: Apex UK Systems Ltd
    VAT Reg No: GB 123 4567 89
    Invoice Date: 12 July 2026
    Subtotal: £2,500.00
    VAT @ 20%: £500.00
    Total Payable: £3,000.00
  `;

  const ukVatClassification = detectDocumentProfile(ukVatText, "Apex_UK_Invoice.pdf");
  assert(ukVatClassification.profile === "vat_invoice", "Classifies International VAT invoice correctly");

  // -------------------------------------------------------------------------
  // SUITE 2: Banking & Table Semantic Classifier (Debit & Credit Separation)
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Banking & Table Semantics Classification ---");

  const bankGrid = [
    ["Date", "Particulars / Narration", "Cheque No", "Withdrawal (Dr)", "Deposit (Cr)", "Balance"],
    ["01-08-2026", "Opening Balance", "-", "", "", "1,50,000.00"],
    ["03-08-2026", "NEFT/CLG/VENDOR PAYMENT", "98021", "25,000.00", "", "1,25,000.00"],
    ["05-08-2026", "RTGS/INWARD/CLIENT REMIT", "-", "", "95,000.00", "2,20,000.00"],
  ];

  const tableSemantics = classifyTableSemantics(bankGrid);
  assert(tableSemantics.isFinancialTable === true, "Identifies table as financial table");
  assert(tableSemantics.hasDebitCredit === true, "Detects debit and credit semantic presence");
  assert(tableSemantics.debitColumnIdx === 3, `Correctly identifies Withdrawal (Dr) at col 3 (found: ${tableSemantics.debitColumnIdx})`);
  assert(tableSemantics.creditColumnIdx === 4, `Correctly identifies Deposit (Cr) at col 4 (found: ${tableSemantics.creditColumnIdx})`);
  assert(tableSemantics.balanceColumnIdx === 5, `Correctly identifies Balance at col 5 (found: ${tableSemantics.balanceColumnIdx})`);

  // -------------------------------------------------------------------------
  // SUITE 3: Optical Confusable Character Review
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Optical Confusable Character Detection ---");

  const ambiguousText = "Invoice INV-202O and Account 5Ol002 Amount: 1,OOO.OO Total: 5S0";
  const ambiguities = detectAmbiguousCharacters(ambiguousText);
  assert(ambiguities.length >= 3, `Detects optical confusable glyphs (found: ${ambiguities.length})`);
  const foundOforZero = ambiguities.some(
    (a) => (a.char === "O" || a.ambiguousGlyph.includes("0 / O")) && a.suggestedAlternatives.some((alt) => alt.includes("0"))
  );
  assert(foundOforZero, "Flags letter 'O' used in place of digit '0' in numeric tokens");

  // -------------------------------------------------------------------------
  // SUITE 4: Financial Quality Audit Report Generation
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Financial Quality Audit & Fidelity Scoring ---");

  const auditReport = auditFinancialDocxIntegrity(gstClassification, gstInvoiceText);
  assert(auditReport.overallStatus === "PASS", `Overall audit status is PASS (got: ${auditReport.overallStatus})`);
  assert(auditReport.fidelityScore >= 95, `Fidelity score is >= 95% (got: ${auditReport.fidelityScore}%)`);
  assert(auditReport.checks.length >= 7, `Comprehensive checks generated (count: ${auditReport.checks.length})`);

  const gstinCheck = auditReport.checks.find((c) => c.id === "chk-supplier-gstin" || c.id === "gstin_integrity");
  assert(gstinCheck?.status === "PASS", "GSTIN integrity check passes");

  // -------------------------------------------------------------------------
  // SUITE 5: Real-World PDF-to-DOCX Conversion Pipeline
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 5: End-to-End PDF-to-Word Conversion Pipeline ---");

  const { convertPdfToWordEnterprise } = await import("../src/lib/enterprisePdfToWordEngine");

  // Create real synthetic GST Invoice PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4

  page.drawText("TAX INVOICE — GST RULE 46 COMPLIANT", {
    x: 50,
    y: 800,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  page.drawText("Invoice Number: INV-2026-9042", {
    x: 50,
    y: 775,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("Supplier GSTIN: 27AABCU9603R1ZM | PAN: AABCU9603R", {
    x: 50,
    y: 755,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("Recipient GSTIN: 29AAGCB2180N1ZB | State: Karnataka", {
    x: 50,
    y: 735,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Table header
  page.drawText("HSN/SAC", { x: 50, y: 700, size: 10, font: fontBold });
  page.drawText("Description", { x: 130, y: 700, size: 10, font: fontBold });
  page.drawText("Taxable (INR)", { x: 300, y: 700, size: 10, font: fontBold });
  page.drawText("CGST 9%", { x: 400, y: 700, size: 10, font: fontBold });
  page.drawText("SGST 9%", { x: 470, y: 700, size: 10, font: fontBold });

  // Table row
  page.drawText("998313", { x: 50, y: 680, size: 10, font });
  page.drawText("Software Architecture", { x: 130, y: 680, size: 10, font });
  page.drawText("1,00,000.00", { x: 300, y: 680, size: 10, font });
  page.drawText("9,000.00", { x: 400, y: 680, size: 10, font });
  page.drawText("9,000.00", { x: 470, y: 680, size: 10, font });

  page.drawText("Grand Total: INR 1,18,000.00", {
    x: 350,
    y: 650,
    size: 11,
    font: fontBold,
  });

  const pdfBytes = await pdfDoc.save();
  const testPdfFile = new File([pdfBytes], "Test_GST_Invoice.pdf", { type: "application/pdf" });

  // Test Mode 1: Financial Fidelity
  console.log("  Running Mode 1: financial_fidelity preset...");
  const fidelityResult = await convertPdfToWordEnterprise(testPdfFile, {
    preset: "financial_fidelity",
    documentProfile: "gst_invoice",
  });

  assert(fidelityResult.bytes instanceof Uint8Array, "Generates Uint8Array byte buffer");
  assert(fidelityResult.bytes.length > 1000, `DOCX size is substantial (${fidelityResult.bytes.length} bytes)`);

  // Verify OpenXML ZIP signature: PK\x03\x04
  const isZip =
    fidelityResult.bytes[0] === 0x50 &&
    fidelityResult.bytes[1] === 0x4b &&
    fidelityResult.bytes[2] === 0x03 &&
    fidelityResult.bytes[3] === 0x04;
  assert(isZip, "Output has valid OpenXML PK\\x03\\x04 ZIP archive signature");

  // Extract raw text from generated DOCX with mammoth to verify text fidelity
  const mammothRes = await mammoth.extractRawText({
    buffer: Buffer.from(fidelityResult.bytes.buffer, fidelityResult.bytes.byteOffset, fidelityResult.bytes.byteLength),
  });
  const docxExtractedText = mammothRes.value;

  assert(docxExtractedText.includes("27AABCU9603R1ZM"), "Preserves Supplier GSTIN in DOCX");
  assert(docxExtractedText.includes("29AAGCB2180N1ZB"), "Preserves Recipient GSTIN in DOCX");
  assert(docxExtractedText.includes("1,18,000.00"), "Preserves Grand Total Amount in DOCX");
  assert(fidelityResult.classification?.profile === "gst_invoice", "Retains classified GST profile");
  assert(fidelityResult.qualityAudit?.overallStatus === "PASS", "Quality audit report status is PASS");
  assert(fidelityResult.qualityAudit?.fidelityScore >= 90, `Fidelity score is ${fidelityResult.qualityAudit?.fidelityScore}%`);

  // Test Mode 2: Editable Word
  console.log("  Running Mode 2: editable_word preset...");
  const editableResult = await convertPdfToWordEnterprise(testPdfFile, {
    preset: "editable_word",
  });
  assert(editableResult.bytes.length > 1000, "Generates editable Word document successfully");
  assert(editableResult.stats.paragraphsCount > 0, "Extracts fluid paragraphs");

  // Test Mode 3: Scanned OCR Mode
  console.log("  Running Mode 3: scanned_ocr preset fallback resilience...");
  const scannedResult = await convertPdfToWordEnterprise(testPdfFile, {
    preset: "scanned_ocr",
    enableOcrFallback: true,
  });
  assert(scannedResult.bytes.length > 1000, "Generates scanned OCR Word document successfully");

  console.log("\n==========================================================================");
  console.log(`PHASE 12 VERIFICATION COMPLETE:`);
  console.log(`  PASSED:   ${passCount}`);
  console.log(`  WARNINGS: ${warnCount}`);
  console.log(`  FAILED:   ${failCount}`);
  console.log("==========================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase12Verification().catch((err) => {
  console.error("FATAL ERROR in Phase 12 Verification:", err);
  process.exit(1);
});
