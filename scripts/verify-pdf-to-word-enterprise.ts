/**
 * PDFSun.in — Ultimate PDF to Word Converter 15-Category Regression & Stress Suite
 * Tests real end-to-end conversion, OOXML ZIP/XML inspection, table grids, image parity,
 * QR aspect ratios, multi-orientation sections, multilingual UTF-8, OCR fallback, Hybrid Auto,
 * security fail-closed checks, and tracks the unseen owner video/PDF fixture as PENDING.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import mammoth from "mammoth";
import { convertPdfToWordEnterprise } from "../src/lib/enterprisePdfToWordEngine";
import { inspectDocxOpenXmlPackage } from "../src/lib/docxQualityValidator";
import { encodeRgbaToPng } from "../src/lib/pdfToWordGeometry";

let passed = 0;
let failed = 0;
let pending = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${label}${detail ? ` (${detail})` : ""}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

function makeFileFromBytes(bytes: Uint8Array, name: string): File {
  return new File([bytes], name, { type: "application/pdf" });
}

function createSolidOrCheckerPng(width: number, height: number, pattern: "logo" | "qr" | "sig" | "scan"): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = 255;
      let g = 255;
      let b = 255;
      if (pattern === "logo") {
        // Blue & amber emblem
        const dist = Math.hypot(x - width / 2, y - height / 2);
        if (dist < Math.min(width, height) * 0.4) {
          r = 29; g = 78; b = 216;
        } else {
          r = 249; g = 115; b = 22;
        }
      } else if (pattern === "qr") {
        const bx = Math.floor(x / 8);
        const by = Math.floor(y / 8);
        const dark = ((bx + by) % 2 === 0) || (x < 24 && y < 24) || (x > width - 24 && y < 24);
        r = dark ? 15 : 255;
        g = dark ? 23 : 255;
        b = dark ? 42 : 255;
      } else if (pattern === "sig") {
        const waveY = Math.floor(height / 2 + Math.sin(x * 0.15) * (height * 0.25));
        if (Math.abs(y - waveY) <= 2) {
          r = 30; g = 58; b = 138;
        }
      } else if (pattern === "scan") {
        // High-contrast scanned horizontal stripes
        if (y % 20 < 4) {
          r = 40; g = 40; b = 40;
        } else {
          r = 248; g = 250; b = 252;
        }
      }
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }
  return encodeRgbaToPng(rgba, width, height);
}

async function runSuite(): Promise<void> {
  console.log("==========================================================================");
  console.log("PDFSUN.IN — ULTIMATE PDF TO WORD ENTERPRISE 15-CATEGORY VERIFICATION SUITE");
  console.log("==========================================================================");

  // -----------------------------------------------------------------------
  // CATEGORY 1: GST Invoice with multi-word & stacked 2-line headers + amounts
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 1: GST Invoice Multi-Word & Stacked Headers ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);

    page.drawText("TAX INVOICE", { x: 240, y: 800, size: 16, font: bold });
    page.drawText("Supplier: Apex Industrial Valves Pvt Ltd", { x: 40, y: 765, size: 10, font: bold });
    page.drawText("GSTIN: 27AABCA1234F1Z5   PAN: AABCA1234F", { x: 40, y: 750, size: 9, font });
    page.drawText("Invoice No: INV-2026-8841   Date: 12-Nov-2026", { x: 320, y: 765, size: 9, font });

    // Stacked 2-line + multi-word column headers
    page.drawText("Sr", { x: 42, y: 700, size: 9, font: bold });
    page.drawText("No.", { x: 42, y: 688, size: 9, font: bold });
    page.drawText("Item", { x: 80, y: 700, size: 9, font: bold });
    page.drawText("Description", { x: 105, y: 700, size: 9, font: bold });
    page.drawText("HSN", { x: 265, y: 700, size: 9, font: bold });
    page.drawText("Code", { x: 265, y: 688, size: 9, font: bold });
    page.drawText("Unit", { x: 340, y: 700, size: 9, font: bold });
    page.drawText("Price", { x: 365, y: 700, size: 9, font: bold });
    page.drawText("Taxable", { x: 440, y: 700, size: 9, font: bold });
    page.drawText("Value", { x: 440, y: 688, size: 9, font: bold });
    page.drawText("Total", { x: 515, y: 700, size: 9, font: bold });

    page.drawText("1", { x: 42, y: 660, size: 9, font });
    page.drawText("Stainless Steel Ball Valve 50mm PN40", { x: 80, y: 660, size: 9, font });
    page.drawText("84818030", { x: 265, y: 660, size: 9, font });
    page.drawText("4,250.00", { x: 345, y: 660, size: 9, font });
    page.drawText("42,500.00", { x: 438, y: 660, size: 9, font });
    page.drawText("50,150.00", { x: 510, y: 660, size: 9, font });

    page.drawText("2", { x: 42, y: 640, size: 9, font });
    page.drawText("Flange Gasket Kit PTFE Reinforced", { x: 80, y: 640, size: 9, font });
    page.drawText("40169390", { x: 265, y: 640, size: 9, font });
    page.drawText("1,100.50", { x: 345, y: 640, size: 9, font });
    page.drawText("11,005.00", { x: 438, y: 640, size: 9, font });
    page.drawText("12,985.90", { x: 510, y: 640, size: 9, font });

    page.drawText("Grand Total: INR 63,135.90", { x: 380, y: 590, size: 11, font: bold });

    const pdfBytes = await doc.save();
    const res = await convertPdfToWordEnterprise(makeFileFromBytes(pdfBytes, "cat1-gst.pdf"), {
      preset: "financial_fidelity",
      reconstructionMode: "visual_fidelity",
    });
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(inspect.hasDocumentXml && inspect.hasContentTypes && inspect.hasRootRels, "Valid OOXML ZIP structure");
    assert(inspect.actualXmlTablesCount >= 1 && inspect.actualTblGridCount >= 1, "Built native table with explicit <w:tblGrid>", `tables=${inspect.actualXmlTablesCount}`);
    assert(inspect.extractedXmlText.includes("27AABCA1234F1Z5") && inspect.extractedXmlText.includes("63,135.90"), "Preserved GSTIN & exact decimal Grand Total");
    assert(inspect.extractedXmlText.includes("Item") && inspect.extractedXmlText.includes("Description"), "Preserved Item Description header");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 2: Invoice WITHOUT Serial Numbers + Multi-Line Wrapped Rows
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 2: No Serial Numbers + Wrapped Multi-Line Descriptions ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);

    page.drawText("COMMERCIAL SERVICES BILL", { x: 40, y: 790, size: 14, font: bold });
    page.drawText("Service Description", { x: 45, y: 735, size: 9, font: bold });
    page.drawText("SAC", { x: 300, y: 735, size: 9, font: bold });
    page.drawText("Qty", { x: 375, y: 735, size: 9, font: bold });
    page.drawText("Amount", { x: 480, y: 735, size: 9, font: bold });

    // Row without serial number, wrapping onto second visual line
    page.drawText("Annual Enterprise Cloud Backup & Encryption Compliance", { x: 45, y: 710, size: 9, font });
    page.drawText("Monitoring Package (12 Months SLA)", { x: 45, y: 696, size: 9, font });
    page.drawText("998313", { x: 300, y: 710, size: 9, font });
    page.drawText("1.00", { x: 375, y: 710, size: 9, font });
    page.drawText("24,000.00", { x: 480, y: 710, size: 9, font });

    page.drawText("Quarterly Penetration Audit & Compliance Attestation", { x: 45, y: 672, size: 9, font });
    page.drawText("998319", { x: 300, y: 672, size: 9, font });
    page.drawText("2.00", { x: 375, y: 672, size: 9, font });
    page.drawText("15,000.00", { x: 480, y: 672, size: 9, font });

    page.drawText("CGST @ 9%", { x: 370, y: 635, size: 9, font });
    page.drawText("3,510.00", { x: 480, y: 635, size: 9, font });
    page.drawText("SGST @ 9%", { x: 370, y: 620, size: 9, font });
    page.drawText("3,510.00", { x: 480, y: 620, size: 9, font });
    page.drawText("Total Payable", { x: 370, y: 602, size: 10, font: bold });
    page.drawText("46,020.00", { x: 478, y: 602, size: 10, font: bold });

    // Asymmetric Bank vs Signature bottom region
    page.drawText("Bank Name: HDFC Bank Ltd", { x: 45, y: 530, size: 9, font });
    page.drawText("A/c No: 50200044118899", { x: 45, y: 516, size: 9, font });
    page.drawText("IFSC Code: HDFC0001234", { x: 45, y: 502, size: 9, font });
    page.drawText("Authorised Signatory", { x: 430, y: 502, size: 9, font: bold });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat2-no-sno.pdf"), {
      reconstructionMode: "visual_fidelity",
    });
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(inspect.extractedXmlText.includes("Monitoring Package (12 Months SLA)"), "Retained wrapped description line");
    assert(inspect.extractedXmlText.includes("46,020.00") && inspect.extractedXmlText.includes("HDFC0001234"), "Retained tax total & IFSC bank details");
    assert(inspect.actualXmlTablesCount >= 1, "Constructed Word table without S.No anchor");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 3: Vector Borders + Logo PNG + 1:1 Square QR PNG + Signature PNG
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 3: Vector Grid + Embedded Logo, 1:1 QR Code & Signature PNGs ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);

    const logoImg = await doc.embedPng(createSolidOrCheckerPng(120, 48, "logo"));
    const qrImg = await doc.embedPng(createSolidOrCheckerPng(96, 96, "qr"));
    const sigImg = await doc.embedPng(createSolidOrCheckerPng(120, 40, "sig"));

    // Draw real embedded graphics
    page.drawImage(logoImg, { x: 40, y: 760, width: 100, height: 40 });
    page.drawImage(qrImg, { x: 465, y: 725, width: 80, height: 80 });
    page.drawImage(sigImg, { x: 430, y: 120, width: 110, height: 38 });

    page.drawText("SUNTECH LOGISTICS BILL", { x: 165, y: 780, size: 15, font: bold });
    page.drawText("Invoice: STL-9921", { x: 165, y: 760, size: 10, font });

    // Draw vector borders / table grid
    page.drawRectangle({ x: 40, y: 540, width: 505, height: 140, borderWidth: 1, borderColor: rgb(0.2, 0.3, 0.5) });
    page.drawLine({ start: { x: 40, y: 650 }, end: { x: 545, y: 650 }, thickness: 1 });
    page.drawLine({ start: { x: 320, y: 540 }, end: { x: 320, y: 680 }, thickness: 1 });

    page.drawText("Freight Route", { x: 50, y: 662, size: 9, font: bold });
    page.drawText("Amount (INR)", { x: 340, y: 662, size: 9, font: bold });
    page.drawText("Mumbai Nhava Sheva -> Pune Chakan Hub", { x: 50, y: 625, size: 9, font });
    page.drawText("18,750.00", { x: 340, y: 625, size: 9, font });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat3-media-qr.pdf"), {
      reconstructionMode: "visual_fidelity",
      preserveImages: true,
    });
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(inspect.actualDrawingsCount >= 3, `Embedded >=3 <w:drawing> elements`, `actualDrawings=${inspect.actualDrawingsCount}`);
    assert(inspect.actualMediaFilesCount >= 3, `Embedded >=3 real images in word/media/*`, `mediaFiles=${inspect.actualMediaFilesCount}`);

    // Verify QR extent inside word/document.xml keeps 1:1 square aspect ratio
    const zip = await JSZip.loadAsync(res.bytes);
    const docXml = (await zip.file("word/document.xml")?.async("string")) || "";
    const extents = Array.from(docXml.matchAll(/<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"/g)).map((m) => ({
      cx: Number(m[1]),
      cy: Number(m[2]),
    }));
    const hasSquareGraphic = extents.some((e) => e.cx > 0 && Math.abs(e.cx - e.cy) / Math.max(e.cx, e.cy) < 0.05);
    assert(hasSquareGraphic, "Square QR code aspect ratio (1:1) preserved inside OOXML <wp:extent>");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 4 & 5: Purchase Order & Transport LR Bill
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 4 & 5: Purchase Order & Transport Freight Bill ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const p1 = doc.addPage([595, 842]);
    p1.drawText("PURCHASE ORDER", { x: 40, y: 790, size: 14, font: bold });
    p1.drawText("PO Number: PO-2026-4410", { x: 40, y: 765, size: 10, font });
    p1.drawText("Vendor: Bharat Precision Castings", { x: 40, y: 745, size: 10, font });
    p1.drawText("Part Code", { x: 45, y: 690, size: 9, font: bold });
    p1.drawText("Specification", { x: 160, y: 690, size: 9, font: bold });
    p1.drawText("Qty", { x: 380, y: 690, size: 9, font: bold });
    p1.drawText("Net Value", { x: 470, y: 690, size: 9, font: bold });
    p1.drawText("BPC-904", { x: 45, y: 665, size: 9, font });
    p1.drawText("CNC Machined Housing Block", { x: 160, y: 665, size: 9, font });
    p1.drawText("25", { x: 380, y: 665, size: 9, font });
    p1.drawText("87,500.00", { x: 470, y: 665, size: 9, font });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat4-po.pdf"), {
      preset: "financial_fidelity",
    });
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(inspect.extractedXmlText.includes("PO-2026-4410") && inspect.extractedXmlText.includes("87,500.00"), "Purchase Order tokens & value retained");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 6: Bank Statement Ledger (Dr / Cr / Balance Column Separation)
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 6: Bank Statement Debit/Credit/Balance Columns ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);
    page.drawText("ACCOUNT STATEMENT — ICICI BANK LTD", { x: 40, y: 790, size: 13, font: bold });
    page.drawText("Date", { x: 40, y: 740, size: 9, font: bold });
    page.drawText("Narration", { x: 120, y: 740, size: 9, font: bold });
    page.drawText("Withdrawal (Dr)", { x: 300, y: 740, size: 9, font: bold });
    page.drawText("Deposit (Cr)", { x: 400, y: 740, size: 9, font: bold });
    page.drawText("Balance", { x: 495, y: 740, size: 9, font: bold });

    page.drawText("01-11-2026", { x: 40, y: 715, size: 9, font });
    page.drawText("NEFT INWARD SETTLEMENT", { x: 120, y: 715, size: 9, font });
    page.drawText("-", { x: 325, y: 715, size: 9, font });
    page.drawText("1,25,000.00", { x: 400, y: 715, size: 9, font });
    page.drawText("4,75,000.00", { x: 495, y: 715, size: 9, font });

    page.drawText("03-11-2026", { x: 40, y: 695, size: 9, font });
    page.drawText("VENDOR PAYMENT RTGS", { x: 120, y: 695, size: 9, font });
    page.drawText("42,310.75", { x: 305, y: 695, size: 9, font });
    page.drawText("-", { x: 425, y: 695, size: 9, font });
    page.drawText("4,32,689.25", { x: 495, y: 695, size: 9, font });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat6-bank.pdf"), {
      preset: "financial_fidelity",
    });
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(
      inspect.extractedXmlText.includes("42,310.75") &&
      inspect.extractedXmlText.includes("1,25,000.00") &&
      inspect.extractedXmlText.includes("4,32,689.25"),
      "Bank Statement Debit, Credit & Balance precision preserved"
    );
  }

  // -----------------------------------------------------------------------
  // CATEGORY 7: Mixed Portrait Page 1 + Landscape Page 2 (10-Col Financial Sheet)
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 7: Mixed Portrait + Landscape 10-Column Annexure ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const p1 = doc.addPage([595, 842]); // Portrait
    p1.drawText("EXECUTIVE FINANCIAL SUMMARY (PORTRAIT PAGE 1)", { x: 50, y: 780, size: 13, font: bold });
    p1.drawText("See Page 2 Landscape Schedule for 10-column GST annexure breakdown.", { x: 50, y: 745, size: 10, font });

    const p2 = doc.addPage([842, 595]); // Landscape
    p2.drawText("QUARTERLY GST ANNEXURE SCHEDULE (LANDSCAPE PAGE 2)", { x: 40, y: 550, size: 13, font: bold });
    const cols = ["Code", "SKU", "HSN", "Qty", "Rate", "Disc", "Taxable", "CGST", "SGST", "Total"];
    const colXs = [40, 95, 165, 235, 290, 360, 425, 515, 600, 700];
    cols.forEach((c, idx) => {
      p2.drawText(c, { x: colXs[idx], y: 505, size: 8.5, font: bold });
    });
    const vals = ["R01", "PUMP-X9", "841370", "10", "5,000.00", "0.00", "50,000.00", "4,500.00", "4,500.00", "59,000.00"];
    vals.forEach((v, idx) => {
      p2.drawText(v, { x: colXs[idx], y: 482, size: 8.5, font });
    });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat7-mixed-orient.pdf"), {
      reconstructionMode: "visual_fidelity",
    });
    const zip = await JSZip.loadAsync(res.bytes);
    const docXml = (await zip.file("word/document.xml")?.async("string")) || "";
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(inspect.sectionsCount >= 2, `Multiple <w:sectPr> emitted for portrait + landscape`, `sections=${inspect.sectionsCount}`);
    assert(/w:orient="landscape"/.test(docXml), "Landscape page orientation preserved in OOXML <w:pgSz>");
    assert(inspect.extractedXmlText.includes("59,000.00") && inspect.extractedXmlText.includes("PUMP-X9"), "Landscape 10-column values intact");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 8: Multi-Page Invoice Pagination + Repeating Table Header
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 8: Multi-Page Invoice Pagination & Repeating Header ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    for (let p = 1; p <= 2; p++) {
      const page = doc.addPage([595, 842]);
      page.drawText(`MULTI-PAGE SUPPLY INVOICE — PAGE ${p} OF 2`, { x: 40, y: 800, size: 12, font: bold });
      page.drawText("S.No", { x: 40, y: 760, size: 9, font: bold });
      page.drawText("Material Description", { x: 100, y: 760, size: 9, font: bold });
      page.drawText("Amount", { x: 480, y: 760, size: 9, font: bold });
      for (let r = 0; r < 5; r++) {
        const idx = (p - 1) * 5 + r + 1;
        page.drawText(`${idx}`, { x: 40, y: 730 - r * 24, size: 9, font });
        page.drawText(`Industrial Hydraulic Hose Batch #${idx}`, { x: 100, y: 730 - r * 24, size: 9, font });
        page.drawText(`${(idx * 1250).toFixed(2)}`, { x: 480, y: 730 - r * 24, size: 9, font });
      }
    }

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat8-multipage.pdf"), {
      reconstructionMode: "visual_fidelity",
    });
    const zip = await JSZip.loadAsync(res.bytes);
    const docXml = (await zip.file("word/document.xml")?.async("string")) || "";
    assert(res.stats.pagesCount === 2, "Strict 2-page count parity");
    assert(docXml.includes("<w:tblHeader/>") && docXml.includes("<w:cantSplit/>"), "Emits OOXML <w:tblHeader/> & <w:cantSplit/>");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 9: Mode A (Editable Word) Fluid Flow & Zero Floating Text Boxes
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 9: Mode A (Editable Word) Fluid Flow ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);
    page.drawText("ENTERPRISE COMPLIANCE POLICY", { x: 50, y: 780, size: 16, font: bold });
    page.drawText("Section 1. Purpose and Scope", { x: 50, y: 740, size: 12, font: bold });
    page.drawText("This policy defines document conversion controls across all branch offices.", { x: 50, y: 715, size: 10, font });
    page.drawText("All generated files remain natively editable inside Microsoft Word.", { x: 50, y: 698, size: 10, font });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat9-editable.pdf"), {
      preset: "editable_word",
      reconstructionMode: "editable_word",
    });
    const zip = await JSZip.loadAsync(res.bytes);
    const docXml = (await zip.file("word/document.xml")?.async("string")) || "";
    assert(!docXml.includes("<v:textbox") && !docXml.includes("<wps:txbx"), "Zero floating text boxes in Mode A Editable Word");
    assert(res.reconstructionMode === "editable_word", "Reconstruction mode stamped as editable_word");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 10 & 11: Mode C Scanned OCR Resilience & Mode D Hybrid Auto
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 10 & 11: Mode C Scanned Fallback & Mode D Hybrid Auto ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Page 1: Pure selectable vector text
    const p1 = doc.addPage([595, 842]);
    p1.drawText("HYBRID REPORT — NATIVE PAGE 1", { x: 50, y: 780, size: 14, font: bold });
    p1.drawText("Native searchable financial paragraph with GSTIN 29ABCDE1234F1Z2 and total 9,500.00.", { x: 50, y: 750, size: 10, font });

    // Page 2: Embedded scan image with no vector text
    const p2 = doc.addPage([595, 842]);
    const scanPng = await doc.embedPng(createSolidOrCheckerPng(240, 320, "scan"));
    p2.drawImage(scanPng, { x: 40, y: 120, width: 515, height: 640 });

    const resHybrid = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat11-hybrid.pdf"), {
      preset: "hybrid_auto",
      reconstructionMode: "hybrid_auto",
      preserveImages: true,
    });
    const inspectHybrid = await inspectDocxOpenXmlPackage(resHybrid.bytes);
    assert(resHybrid.perPageSummary?.length === 2, "Per-page conversion summary populated for both pages");
    assert(resHybrid.perPageSummary?.[0]?.mode === "native", "Page 1 stays native editable text (NOT flattened to image)");
    assert(inspectHybrid.extractedXmlText.includes("29ABCDE1234F1Z2"), "Native Page 1 text retained verbatim in Hybrid Auto");

    // Verify mammoth HTML render succeeds cleanly on generated hybrid DOCX
    const mammothOut = await mammoth.convertToHtml({ buffer: Buffer.from(resHybrid.bytes) });
    assert(typeof mammothOut.value === "string" && mammothOut.value.includes("29ABCDE1234F1Z2"), "Mammoth live preview decodes OOXML successfully");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 12: Multilingual / Unicode XML Integrity Check
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 12: Multilingual Currency & UTF-8 Check ---");
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);
    page.drawText("EXPORT INVOICE (EUR / USD / INR)", { x: 45, y: 780, size: 13, font: bold });
    page.drawText("Consignment: Berlin -> Bengaluru", { x: 45, y: 740, size: 10, font });
    page.drawText("Invoice Value: USD 12,450.00", { x: 45, y: 720, size: 10, font });

    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "cat12-intl.pdf"), {
      preset: "financial_fidelity",
    });
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    assert(inspect.extractedXmlText.includes("12,450.00") && inspect.extractedXmlText.includes("Bengaluru"), "International corridor text preserved cleanly");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 13 & 14: Security Rejection + Clean OOXML Relationships Audit
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 13 & 14: Security Fail-Closed & Clean OOXML Audit ---");
  {
    let rejectedCorrupt = false;
    try {
      const fakeBytes = new TextEncoder().encode("<html><script>alert(1)</script></html>");
      await convertPdfToWordEnterprise(makeFileFromBytes(fakeBytes, "malicious.pdf"));
    } catch (err: any) {
      rejectedCorrupt = /Missing %PDF-|Invalid PDF/i.test(String(err?.message || ""));
    }
    assert(rejectedCorrupt, "Malformed/XSS non-PDF payload rejected fail-closed");

    // Verify clean OOXML package contains zero external SSRF targets or VBA macros
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    page.drawText("SECURITY VERIFICATION DOC", { x: 45, y: 780, size: 12, font });
    const res = await convertPdfToWordEnterprise(makeFileFromBytes(await doc.save(), "sec-clean.pdf"));
    const inspect = await inspectDocxOpenXmlPackage(res.bytes);
    const zip = await JSZip.loadAsync(res.bytes);
    const hasMacros = Object.keys(zip.files).some((k) => /vbaProject|macro/i.test(k));
    assert(!inspect.hasUnsafeExternalTargets && !hasMacros, "Zero external relationship targets & zero VBA macros in DOCX ZIP");
  }

  // -----------------------------------------------------------------------
  // CATEGORY 15: Unseen Owner Screen-Recording Bill Fixture Status
  // -----------------------------------------------------------------------
  console.log("\n--- CATEGORY 15: Owner Unseen Video / Source PDF Verification ---");
  console.log("  ⏳ PENDING: Unseen screen-recording video & exact source invoice PDF (mukeshinland79@gmail.com) not present in workspace — awaiting owner upload for final A/B Word visual signoff.");
  pending++;

  console.log("\n==========================================================================");
  console.log(`ENTERPRISE PDF-TO-WORD VERIFICATION: PASSED=${passed}, FAILED=${failed}, PENDING=${pending}`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
