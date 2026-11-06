/**
 * Diagnostic Script: Reproduce and inspect real-world Tax Invoice PDF to Word layout flaws
 */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import mammoth from "mammoth";

// Polyfills for Node.js
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

async function diagnoseInvoice() {
  console.log("=== Creating Realistic Complex Tax Invoice PDF ===");

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4: 595 x 842 pt

  // 1. Header
  page.drawText("TAX INVOICE", { x: 250, y: 810, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText("Original for Recipient", { x: 460, y: 810, size: 9, font });

  // 2. Two-Column Party Info (Seller on left, Buyer & Invoice details on right)
  // Left: Supplier details (5 lines)
  page.drawText("Sold By / Supplier Details:", { x: 40, y: 780, size: 10, font: fontBold });
  page.drawText("ACME CLOUD SOLUTIONS PVT LTD", { x: 40, y: 765, size: 10, font: fontBold });
  page.drawText("Plot 42, Cyber City, Phase 2, Gurugram, HR - 122002", { x: 40, y: 750, size: 9, font });
  page.drawText("GSTIN: 06AABCA1234F1Z5 | PAN: AABCA1234F", { x: 40, y: 735, size: 9, font });
  page.drawText("State: Haryana (Code: 06)", { x: 40, y: 720, size: 9, font });

  // Right: Invoice & Buyer Details (different line Y heights!)
  page.drawText("Invoice Details & Billed To:", { x: 320, y: 780, size: 10, font: fontBold });
  page.drawText("Invoice No: INV-2026-8841", { x: 320, y: 763, size: 9, font: fontBold });
  page.drawText("Invoice Date: 12-May-2026 | Due: 26-May-2026", { x: 320, y: 748, size: 9, font });
  page.drawText("Billed To: TECHCORP ENTERPRISES INDIA LTD", { x: 320, y: 733, size: 9, font: fontBold });
  page.drawText("GSTIN: 27AAGCT9876Q1Z9 | State: Maharashtra (27)", { x: 320, y: 718, size: 9, font });
  page.drawText("Place of Supply: Maharashtra | Reverse Charge: No", { x: 320, y: 703, size: 9, font });

  // 3. Multi-line Line Items Table
  // Headers at Y = 670
  page.drawText("S.No", { x: 40, y: 670, size: 9, font: fontBold });
  page.drawText("Item Description", { x: 75, y: 670, size: 9, font: fontBold });
  page.drawText("HSN/SAC", { x: 260, y: 670, size: 9, font: fontBold });
  page.drawText("Qty", { x: 325, y: 670, size: 9, font: fontBold });
  page.drawText("Rate", { x: 360, y: 670, size: 9, font: fontBold });
  page.drawText("Taxable", { x: 430, y: 670, size: 9, font: fontBold });
  page.drawText("IGST (18%)", { x: 505, y: 670, size: 9, font: fontBold });

  // Item 1: Multi-line description!
  page.drawText("1", { x: 40, y: 645, size: 9, font });
  page.drawText("Enterprise Cloud Migration & Architecture", { x: 75, y: 645, size: 9, font });
  page.drawText("998313", { x: 260, y: 645, size: 9, font });
  page.drawText("1.00", { x: 325, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 360, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 430, y: 645, size: 9, font });
  page.drawText("13,500.00", { x: 505, y: 645, size: 9, font });

  // Sub-description lines (only text in description column!)
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

  // 4. Totals & Bank details
  // Left: Bank Details
  page.drawText("Bank Account Details:", { x: 40, y: 530, size: 9, font: fontBold });
  page.drawText("Bank Name: HDFC Bank Ltd | A/c No: 50200012345678", { x: 40, y: 515, size: 8, font });
  page.drawText("IFSC Code: HDFC0000240 | Branch: Cyber City Gurugram", { x: 40, y: 500, size: 8, font });
  page.drawText("Amount in Words: One Lakh Thirty-Five Thousand Seven Hundred Only", { x: 40, y: 480, size: 8, font: fontBold });

  // Right: Summary calculation
  page.drawText("Total Taxable Value:", { x: 360, y: 530, size: 9, font });
  page.drawText("1,15,000.00", { x: 485, y: 530, size: 9, font: fontBold });
  page.drawText("Integrated Tax (IGST 18%):", { x: 360, y: 512, size: 9, font });
  page.drawText("20,700.00", { x: 485, y: 512, size: 9, font });
  page.drawText("Invoice Total (INR):", { x: 360, y: 490, size: 10, font: fontBold });
  page.drawText("1,35,700.00", { x: 485, y: 490, size: 10, font: fontBold });

  const pdfBytes = await pdfDoc.save();
  const testPdfFile = new File([pdfBytes], "Realistic_GST_Invoice.pdf", { type: "application/pdf" });

  console.log("=== Running convertPdfToWordEnterprise ===");
  const { convertPdfToWordEnterprise } = await import("../src/lib/enterprisePdfToWordEngine");
  const result = await convertPdfToWordEnterprise(testPdfFile, {
    preset: "financial_fidelity",
  });

  console.log(`Generated DOCX: ${result.bytes.length} bytes`);
  console.log("Stats:", result.stats);

  const mammothRes = await mammoth.extractRawText({
    buffer: Buffer.from(result.bytes.buffer, result.bytes.byteOffset, result.bytes.byteLength),
  });
  console.log("\n--- Mammoth Extracted Text Output ---");
  console.log(mammothRes.value);

  const htmlRes = await mammoth.convertToHtml({
    buffer: Buffer.from(result.bytes.buffer, result.bytes.byteOffset, result.bytes.byteLength),
  });
  console.log("\n--- Mammoth Converted HTML Structure ---");
  console.log(htmlRes.value);
}

diagnoseInvoice().catch(console.error);
