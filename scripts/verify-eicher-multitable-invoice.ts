/**
 * PDFSun.in — Verification Suite for Eicher Proforma Invoice Defect Fix
 * Tests Multi-Table Segmentation, Vehicle Metadata Grid, HSN Summary, and Dense Annexure
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

async function buildSyntheticEicherProformaInvoice(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // PAGE 1: Header, Party, Vehicle Metadata, Spare Parts Table, Labour Table, Summary
  const p1 = pdfDoc.addPage([595.28, 841.89]); // A4
  let y = 800;

  // Header Title
  p1.drawText("EICHER COMMERCIAL VEHICLES DEALERSHIP", { x: 50, y, size: 14, font: fontBold, color: rgb(0.12, 0.23, 0.54) });
  y -= 18;
  p1.drawText("PROFORMA TAX INVOICE", { x: 220, y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 25;

  // Party Details
  p1.drawText("Sold By: Inland Motors Ltd.", { x: 50, y, size: 9, font: fontBold });
  p1.drawText("Billed To: Translog India Logistics", { x: 320, y, size: 9, font: fontBold });
  y -= 14;
  p1.drawText("GSTIN: 07AAACE1234F1Z8 | State: Delhi", { x: 50, y, size: 9, font: fontRegular });
  p1.drawText("GSTIN: 08AABCT5678Q1Z2 | State: Rajasthan", { x: 320, y, size: 9, font: fontRegular });
  y -= 14;
  p1.drawText("Address: Industrial Area Phase 1, New Delhi", { x: 50, y, size: 9, font: fontRegular });
  p1.drawText("Invoice No: EICHER-PI-2026-9042 | Date: 05-Nov-2026", { x: 320, y, size: 9, font: fontRegular });
  y -= 25;

  // Vehicle Metadata Line
  p1.drawText("Chassis No: MC2E49B12345 | Engine No: E483-CD98765 | Model: Pro 2049 | Reg No: DL-1AA-9812", {
    x: 50,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 25;

  // Table 1 Header: Spare Parts (7 cols)
  p1.drawText("SPARE PARTS CHARGES", { x: 50, y, size: 10, font: fontBold, color: rgb(0.12, 0.23, 0.54) });
  y -= 15;
  p1.drawText("Sr.  Part No      Description            HSN      Qty   Rate      Amount", { x: 50, y, size: 9, font: fontBold });
  y -= 14;
  p1.drawText("1    ED00142      Filter Engine Oil      842123   2     1450.00   2900.00", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 12;
  p1.drawText("2    ED00981      Clutch Plate Assembly  870893   1     7800.00   7800.00", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 12;
  p1.drawText("3    ED00411      Brake Shoe Kit         870830   4     2100.00   8400.00", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 25;

  // Table 2 Header: Labour Details (5 cols)
  p1.drawText("LABOUR & SERVICE CHARGES", { x: 50, y, size: 10, font: fontBold, color: rgb(0.12, 0.23, 0.54) });
  y -= 15;
  p1.drawText("Sr.  Labour Description             SAC      Rate      Amount", { x: 50, y, size: 9, font: fontBold });
  y -= 14;
  p1.drawText("1    Clutch Overhaul & Setting      998714   3500.00   3500.00", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 12;
  p1.drawText("2    General Scheduled Service      998714   2200.00   2200.00", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 30;

  // Financial Summary
  p1.drawText("Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234", { x: 50, y, size: 8.5, font: fontRegular });
  p1.drawText("Parts Subtotal: INR 19,100.00", { x: 380, y, size: 8.5, font: fontRegular });
  y -= 14;
  p1.drawText("Amount in Words: Twenty Eight Thousand Three Hundred Twenty Only", { x: 50, y, size: 8.5, font: fontRegular });
  p1.drawText("Labour Subtotal: INR 5,700.00", { x: 380, y, size: 8.5, font: fontRegular });
  y -= 14;
  p1.drawText("Total Taxable Value: INR 24,800.00", { x: 380, y, size: 8.5, font: fontRegular });
  y -= 14;
  p1.drawText("Invoice Total: INR 28,320.00", { x: 380, y, size: 10, font: fontBold, color: rgb(0.12, 0.23, 0.54) });

  // PAGE 2: HSN / GST Tax Breakdown Table + Terms and Conditions
  const p2 = pdfDoc.addPage([595.28, 841.89]);
  y = 800;

  p2.drawText("HSN/SAC TAX SUMMARY BREAKDOWN", { x: 50, y, size: 12, font: fontBold, color: rgb(0.12, 0.23, 0.54) });
  y -= 25;
  // HSN Table (7 cols)
  p2.drawText("HSN/SAC   Taxable Value   CGST Rate   CGST Amount   SGST Rate   SGST Amount   Total Tax", { x: 50, y, size: 8.5, font: fontBold });
  y -= 15;
  p2.drawText("842123    2900.00         9.0%        261.00        9.0%        261.00        522.00", { x: 50, y, size: 8, font: fontRegular });
  y -= 12;
  p2.drawText("870893    7800.00         14.0%       1092.00       14.0%       1092.00       2184.00", { x: 50, y, size: 8, font: fontRegular });
  y -= 12;
  p2.drawText("870830    8400.00         14.0%       1176.00       14.0%       1176.00       2352.00", { x: 50, y, size: 8, font: fontRegular });
  y -= 12;
  p2.drawText("998714    5700.00         9.0%        513.00        9.0%        513.00        1026.00", { x: 50, y, size: 8, font: fontRegular });
  y -= 35;

  p2.drawText("TERMS AND CONDITIONS", { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 16;
  p2.drawText("1. Goods once sold will not be taken back or exchanged under any circumstances.", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 14;
  p2.drawText("2. Warranty on spare parts is strictly as per manufacturer terms.", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 14;
  p2.drawText("3. Payment is due strictly within 7 business days from proforma issue date.", { x: 50, y, size: 8.5, font: fontRegular });
  y -= 35;
  p2.drawText("Customer Acceptance Signature: __________________", { x: 50, y, size: 9, font: fontRegular });
  p2.drawText("For Inland Motors Ltd: Authorized Signatory", { x: 350, y, size: 9, font: fontBold });

  // PAGE 3: Dense 11-Column Annexure
  const p3 = pdfDoc.addPage([595.28, 841.89]);
  y = 800;

  p3.drawText("ANNEXURE - DETAILED ESTIMATED PARTS & CONSUMABLES BREAKDOWN", { x: 50, y, size: 11, font: fontBold, color: rgb(0.12, 0.23, 0.54) });
  y -= 25;

  // 11 Columns Header
  p3.drawText("Sr  PartNo   Description       Qty  MRP     Disc%  DiscAmt  Taxable  CGSTAmt  SGSTAmt  Total", { x: 40, y, size: 8, font: fontBold });
  y -= 14;

  const annexureItems = [
    "1   ED001    OIL FILTER ASSY   2    1450.0  5.0%   145.00   2755.00  247.95   247.95   3250.90",
    "2   ED002    CLUTCH DISC       1    7800.0  0.0%   0.00     7800.00  1092.00  1092.00  9984.00",
    "3   ED003    BRAKE LINER KIT   4    2100.0  10.0%  840.00   7560.00  1058.40  1058.40  9676.80",
    "4   ED004    HUB GREASE 1KG    3    450.00  0.0%   0.00     1350.00  121.50   121.50   1593.00",
    "5   ED005    PROPELLER SHAFT   1    12500.  5.0%   625.00   11875.0  1662.50  1662.50  15200.0",
    "6   ED006    COOLANT 5LTR      2    1100.0  0.0%   0.00     2200.00  198.00   198.00   2596.00",
    "7   ED007    WIPER BLADE SET   1    650.00  0.0%   0.00     650.00   58.50    58.50    767.00",
    "8   ED008    BATTERY 12V 100AH 1    9500.0  0.0%   0.00     9500.00  1330.00  1330.00  12160.0",
  ];

  for (const item of annexureItems) {
    p3.drawText(item, { x: 40, y, size: 7.5, font: fontRegular });
    y -= 12;
  }

  y -= 25;
  p3.drawText("Total Estimated Value Annexure: INR 55,227.70", { x: 350, y, size: 9, font: fontBold });
  y -= 25;
  p3.drawText("Authorized Signatory: ________________________", { x: 350, y, size: 9, font: fontBold });

  return await pdfDoc.save();
}

async function runEicherVerification() {
  const { convertPdfToWordEnterprise } = await import("../src/lib/enterprisePdfToWordEngine");

  console.log("==========================================================================");
  console.log("PDFSun.in — EICHER PROFORMA INVOICE MULTI-TABLE CONVERSION VERIFICATION");
  console.log("Verification of Zero-Collision Multi-Table Architecture & Page Parity");
  console.log("==========================================================================");

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    const pdfBytes = await buildSyntheticEicherProformaInvoice();
    assert(pdfBytes.length > 0, "Synthetic Eicher Proforma Invoice 3-Page PDF generated");

    const testFile = new File([pdfBytes], "Eicher_Proforma_Tax_Invoice.pdf", { type: "application/pdf" });

    const conversionResult = await convertPdfToWordEnterprise(testFile, {
      preset: "financial_fidelity",
      detectionMode: "invoice",
      reconstructionMode: "editable_word",
    });

    assert(conversionResult.bytes instanceof Uint8Array, "Engine produces binary DOCX stream");
    assert(conversionResult.bytes.length > 5000, `DOCX size is substantial (${conversionResult.bytes.length} bytes)`);
    assert(conversionResult.stats.pagesCount === 3, `Page count detected is exactly 3 (got: ${conversionResult.stats.pagesCount})`);
    assert(conversionResult.stats.tablesCount >= 4, `Multi-table detection isolated distinct tables (found: ${conversionResult.stats.tablesCount})`);

    // Verify OpenXML text contents via Mammoth
    const mammothResult = await mammoth.extractRawText({ buffer: Buffer.from(conversionResult.bytes) });
    const textAccum = mammothResult.value;

    assert(textAccum.includes("PROFORMA TAX INVOICE"), "Preserves Proforma Invoice title");
    assert(textAccum.includes("Chassis No") || textAccum.includes("MC2E49B12345"), "Preserves Vehicle Chassis No in metadata");
    assert(textAccum.includes("Filter Engine Oil"), "Preserves Spare Parts Item 1");
    assert(textAccum.includes("Clutch Overhaul"), "Preserves Labour Item 1 (Separate from parts)");
    assert(textAccum.includes("842123") && textAccum.includes("522.00"), "Preserves Page 2 HSN Summary Tax breakdown");
    assert(textAccum.includes("OIL FILTER ASSY") && textAccum.includes("BATTERY 12V"), "Preserves Page 3 11-column Annexure parts");
    assert(textAccum.includes("28,320.00"), "Preserves Grand Total Amount");

    console.log("==========================================================================");
    console.log(`EICHER VERIFICATION COMPLETE:`);
    console.log(`  PASSED:   ${passed}`);
    console.log(`  FAILED:   ${failed}`);
    console.log("==========================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL ERROR in Eicher verification:", err);
    process.exit(1);
  }
}

runEicherVerification();
