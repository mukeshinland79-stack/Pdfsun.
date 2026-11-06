/**
 * PDFSun.in — PHASE 19 AUTOMATED VERIFICATION & BENCHMARK SUITE
 * Universal Global Document Intelligence & Reconstruction Engine
 * 
 * Verifies:
 * 1. All 25 Global Document Categories classified with high fidelity
 * 2. 6 Technical PDF Structural Classes (Digital, Scanned, Hybrid, Table-Heavy, Interactive Form, Multilingual)
 * 3. Eicher 3-Page Proforma Tax Invoice Multi-Table Reconstruction & 1:1 Page Parity
 * 4. Independent DOCX Quality Assurance Engine (OpenXML signature, text retention, numeric integrity)
 * 5. Full backwards compatibility with single-page invoices and banking statements
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
  classifyGlobalDocument,
  GLOBAL_DOCUMENT_CATEGORIES,
  GlobalCategoryKey,
} from "../src/lib/globalDocumentClassifier";
import {
  analyzePdfTechnicalStructure,
  detectScriptsAndDirection,
} from "../src/lib/documentStructureAnalyzer";
import { validateDocxQuality } from "../src/lib/docxQualityValidator";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function runPhase19Verification() {
  console.log("==========================================================================");
  console.log("PDFSun.in — PHASE 19 AUTOMATED VERIFICATION & CERTIFICATION SUITE");
  console.log("Global Document Intelligence & Universal Reconstruction Engine");
  console.log("==========================================================================");

  // ---------------------------------------------------------------------------
  // SUITE 1: 25 GLOBAL DOCUMENT CATEGORIES CLASSIFICATION BENCHMARK
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 1: 25 Global Document Categories Classification Benchmark ---");

  const categorySamples: Record<GlobalCategoryKey, string> = {
    government_public_admin: "Gazette Notification No 441 Government of India Ministry of Finance Aadhaar pan card revenue department circular",
    industrial_manufacturing: "Bill of Materials BOM Work Order Assembly Line QC Inspection Drawing No Rev 02 ISO 9001 SOP raw material batch",
    business_commercial_invoices: "Tax Invoice Invoice No INV-2026-881 Sold By Billed To GSTIN 07AAACE1234F1Z8 Subtotal Taxable Value Amount in Words Grand Total",
    banking_finance_accounting: "Bank Statement Statement of Account Account No 50200012345678 IFSC HDFC0001234 Withdrawal Deposit Running Balance Debit Credit Cheque",
    legal_judicial: "In the High Court of Judicature Petitioner Versus Respondent Plaintiff Defendant Suit No Legal Notice Power of Attorney Affidavit Notary",
    healthcare_medical: "Apollo Hospital Patient Name Rx Prescription Diagnosis Pathology Report Haemoglobin Reference Range Dr Sharma Discharge Summary",
    education_research: "University Board of Secondary Education Bachelor of Technology Semester Marksheet Transcript Roll No Credits Grade Dissertation",
    construction_real_estate: "Bill of Quantities BOQ Built-up Area Carpet Area Sq Ft Architectural Structural Engineer Valuation Plot No Excavation Concrete",
    logistics_transport_supply_chain: "Bill of Lading Consignment Note LR No Shipper Consignee Port of Loading Container No Gross Weight Freight Carrier Manifest",
    human_resources_employment: "Salary Pay Slip Employee ID Basic Salary HRA CTC Deductions Provident Fund Appointment Letter Offer Letter Date of Joining",
    insurance: "Insurance Policy Schedule Policy No Sum Insured Premium Amount Insured Person Nominee Health TPA Coverage Endorsement",
    agriculture: "Soil Test Report Khasra Khatauni Land Record APMC Mandi Receipt Crop Cultivation Nitrogen Phosphorus Potassium Fertilizer Hectare",
    energy_utilities: "Electricity Bill Power Distribution Discom Consumer No Meter No kWh Units Consumed Tariff Connected Load Due Date",
    telecom_it: "Broadband Telecom Internet Bill Speed Data Usage IP Address Bandwidth Cloud Server AWS Hosting Uptime SLA Circuit ID",
    aviation: "Aircraft Flight Log Flight No DGCA Airworthiness Certificate Tail No Avionics Runway Fuel Burn Airspeed Pilot in Command",
    automotive: "Eicher Pro 2049 Chassis No MC2E49B12345 Engine No E483-CD98765 Reg No DL-1AA-9812 Job Card Odometer Workshop Dealership",
    science_laboratory: "Chemical Analysis Certificate Spectroscopy Chromatography Sample ID Reagent Molecular Formula Assay Purity Viscosity",
    research_statistics: "Statistical Study Standard Deviation P-Value Sample Size Confidence Interval Variance Regression Survey Respondents Demographic",
    marketing_media: "Press Release For Immediate Release Product Catalog Brochure Campaign Branding Target Audience Impressions ROI PR Contact",
    personal_individual: "Curriculum Vitae Resume Work Experience Skills Education Summary Career Objective Personal Profile Projects Achievements",
    hospitality_tourism: "Hotel Guest Folio Room No Check-in Check-out Flight Ticket Boarding Pass PNR Booking Reference Tour Itinerary Departure",
    environment: "Environmental Impact Assessment EIA Air Quality Index AQI Pollution Control Effluent PM2.5 PM10 Monitoring Station Carbon Footprint",
    defence_public_safety: "Fire Safety Clearance Certificate Incident Report Emergency Protocol Hazard Inspection Officer Evacuation Risk Assessment",
    nonprofit_ngo: "Charitable Trust Grant Proposal Utilization Certificate Donor Receipt Section 80G Beneficiaries CSR Project Fund NGO",
    international_trade: "Certificate of Origin Letter of Credit LC Incoterms FOB CIF Import Export Code IEC HS Code Customs Tariff Port of Entry",
    general_unclassified: "Random document notes without distinctive keywords",
  };

  for (const [catKey, sampleText] of Object.entries(categorySamples)) {
    const tokens = sampleText.split(" ").map((w) => ({ text: w }));
    const result = classifyGlobalDocument(tokens, 1);
    if (catKey === "general_unclassified") {
      assert(result.primaryCategory.key === "general_unclassified", "Classifies General Unclassified correctly");
    } else {
      const isMatch = result.primaryCategory.key === catKey;
      assert(isMatch, `Classifies ${GLOBAL_DOCUMENT_CATEGORIES[catKey as GlobalCategoryKey].name} -> ${result.primaryCategory.badgeLabel}`, `Got: ${result.primaryCategory.key}`);
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: 6 TECHNICAL PDF STRUCTURAL CLASSES BENCHMARK
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 2: 6 Technical PDF Structural Classes Benchmark ---");

  // 1. Digital text
  const digitalTokens = Array.from({ length: 150 }, (_, i) => ({
    text: `Token_${i}`,
    x: 50 + (i % 5) * 80,
    y: 100 + Math.floor(i / 5) * 15,
  }));
  const structDigital = analyzePdfTechnicalStructure(digitalTokens, 1, [{ width: 595, height: 842 }], 0, false);
  assert(structDigital.structuralClass === "digital", "Detects 'digital' structural class for selectable text PDF");

  // 2. Scanned text (low text, high image)
  const scannedTokens = [{ text: "Scan", x: 100, y: 100 }];
  const structScanned = analyzePdfTechnicalStructure(scannedTokens, 1, [{ width: 595, height: 842 }], 1, false);
  assert(structScanned.structuralClass === "scanned", "Detects 'scanned' structural class when text is low and image present");

  // 3. Table-heavy text
  const tableTokens = [
    { text: "Item Description", x: 50, y: 100 },
    { text: "HSN", x: 200, y: 100 },
    { text: "Qty", x: 280, y: 100 },
    { text: "Rate", x: 350, y: 100 },
    { text: "Taxable", x: 420, y: 100 },
    { text: "Amount", x: 500, y: 100 },
    { text: "Filter Oil", x: 50, y: 120 },
    { text: "842123", x: 200, y: 120 },
    { text: "2", x: 280, y: 120 },
    { text: "1450.00", x: 350, y: 120 },
    { text: "2900.00", x: 420, y: 120 },
    { text: "2900.00", x: 500, y: 120 },
  ];
  const structTable = analyzePdfTechnicalStructure(tableTokens, 1, [{ width: 595, height: 842 }], 0, false);
  assert(structTable.isTableHeavy, "Detects table-heavy PDF structure with aligned columns");

  // 4. Interactive Form
  const formTokens = [
    { text: "Name: ____________________", x: 50, y: 100 },
    { text: "[ ] Married [ ] Single", x: 50, y: 130 },
    { text: "Signature of Applicant: ______", x: 50, y: 160 },
  ];
  const structForm = analyzePdfTechnicalStructure(formTokens, 1, [{ width: 595, height: 842 }], 0, true);
  assert(structForm.isInteractiveForm, "Detects interactive fillable form structure");

  // 5. Multilingual & Script Direction
  const scriptTest = detectScriptsAndDirection("Invoice बिल विवरण فاتورة ضريبية");
  assert(scriptTest.hasLatin && scriptTest.hasDevanagari && scriptTest.hasArabic, "Detects mixed scripts (Latin, Devanagari, Arabic)");
  assert(scriptTest.isRightToLeft, "Detects RTL writing direction for Arabic text");

  // ---------------------------------------------------------------------------
  // SUITE 3: EICHER PROFORMA INVOICE MULTI-TABLE & 1:1 PAGE PARITY
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Eicher Proforma Invoice Multi-Table & 1:1 Page Parity ---");

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const p1 = pdfDoc.addPage([595.28, 841.89]);
  p1.drawText("EICHER COMMERCIAL VEHICLES DEALERSHIP", { x: 50, y: 800, size: 14, font: fontBold, color: rgb(0.12, 0.23, 0.54) });
  p1.drawText("PROFORMA TAX INVOICE", { x: 220, y: 780, size: 16, font: fontBold });
  p1.drawText("Sold By: Inland Motors Ltd. | GSTIN: 07AAACE1234F1Z8", { x: 50, y: 750, size: 9, font: fontRegular });
  p1.drawText("Billed To: Translog India Logistics | GSTIN: 08AABCT5678Q1Z2", { x: 300, y: 750, size: 9, font: fontRegular });
  p1.drawText("Chassis No: MC2E49B12345 | Engine No: E483-CD98765 | Model: Pro 2049 | Reg No: DL-1AA-9812", { x: 50, y: 720, size: 9, font: fontBold });
  p1.drawText("Sr.  Part No      Description            HSN      Qty   Rate      Amount", { x: 50, y: 680, size: 9, font: fontBold });
  p1.drawText("1    ED00142      Filter Engine Oil      842123   2     1450.00   2900.00", { x: 50, y: 660, size: 8.5, font: fontRegular });
  p1.drawText("Sr.  Labour Description             SAC      Rate      Amount", { x: 50, y: 620, size: 9, font: fontBold });
  p1.drawText("1    Clutch Overhaul & Setting      998714   3500.00   3500.00", { x: 50, y: 600, size: 8.5, font: fontRegular });
  p1.drawText("Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234", { x: 50, y: 550, size: 8.5, font: fontRegular });
  p1.drawText("Invoice Total: INR 28,320.00", { x: 380, y: 550, size: 10, font: fontBold });

  // Page 2
  const p2 = pdfDoc.addPage([595.28, 841.89]);
  p2.drawText("HSN/SAC TAX SUMMARY BREAKDOWN", { x: 50, y: 800, size: 12, font: fontBold });
  p2.drawText("HSN/SAC   Taxable Value   CGST Rate   CGST Amount   SGST Rate   SGST Amount   Total Tax", { x: 50, y: 770, size: 8.5, font: fontBold });
  p2.drawText("842123    2900.00         9.0%        261.00        9.0%        261.00        522.00", { x: 50, y: 750, size: 8, font: fontRegular });
  p2.drawText("TERMS AND CONDITIONS", { x: 50, y: 700, size: 11, font: fontBold });
  p2.drawText("Warranty on spare parts is strictly as per manufacturer terms.", { x: 50, y: 680, size: 8.5, font: fontRegular });
  p2.drawText("For Inland Motors Ltd: Authorized Signatory", { x: 350, y: 640, size: 9, font: fontBold });

  // Page 3
  const p3 = pdfDoc.addPage([595.28, 841.89]);
  p3.drawText("ANNEXURE - DETAILED ESTIMATED PARTS & CONSUMABLES BREAKDOWN", { x: 50, y: 800, size: 11, font: fontBold });
  p3.drawText("Sr  PartNo   Description       Qty  MRP     Disc%  DiscAmt  Taxable  CGSTAmt  SGSTAmt  Total", { x: 40, y: 770, size: 8, font: fontBold });
  p3.drawText("1   ED001    OIL FILTER ASSY   2    1450.0  5.0%   145.00   2755.00  247.95   247.95   3250.90", { x: 40, y: 750, size: 7.5, font: fontRegular });
  p3.drawText("2   ED002    CLUTCH DISC       1    7800.0  0.0%   0.00     7800.00  1092.00  1092.00  9984.00", { x: 40, y: 735, size: 7.5, font: fontRegular });
  p3.drawText("Total Estimated Value Annexure: INR 55,227.70", { x: 350, y: 680, size: 9, font: fontBold });

  const eicherPdfBytes = await pdfDoc.save();
  const testFile = new File([eicherPdfBytes], "Eicher_Proforma_Tax_Invoice.pdf", { type: "application/pdf" });

  const { convertPdfToWordEnterprise } = await import("../src/lib/enterprisePdfToWordEngine");
  const conversionResult = await convertPdfToWordEnterprise(testFile, {
    preset: "financial_fidelity",
    detectionMode: "invoice",
    reconstructionMode: "editable_word",
  });

  assert(conversionResult.bytes instanceof Uint8Array, "Engine generates valid binary DOCX stream");
  assert(conversionResult.stats.pagesCount === 3, `Strict 1:1 page parity: 3 PDF pages -> exactly 3 DOCX pages (got: ${conversionResult.stats.pagesCount})`);
  assert(conversionResult.stats.globalCategory === "automotive" || conversionResult.stats.globalCategory === "business_commercial_invoices", `Classified as ${conversionResult.stats.globalCategoryName}`);
  assert(conversionResult.stats.structuralClass === "table_heavy", `Structure classified as ${conversionResult.stats.structuralClass}`);
  assert(conversionResult.stats.tablesCount >= 4, `Multi-table isolated distinct tables without collision (found: ${conversionResult.stats.tablesCount})`);

  // ---------------------------------------------------------------------------
  // SUITE 4: INDEPENDENT DOCX QUALITY ASSURANCE ENGINE
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Independent DOCX Quality Assurance Engine ---");

  const mammothResult = await mammoth.extractRawText({ buffer: Buffer.from(conversionResult.bytes) });
  const docxText = mammothResult.value;

  assert(docxText.includes("PROFORMA TAX INVOICE"), "Preserves document title in OpenXML body");
  assert(docxText.includes("Chassis No") && docxText.includes("MC2E49B12345"), "Preserves vehicle chassis number in metadata");
  assert(docxText.includes("Filter Engine Oil") && docxText.includes("Clutch Overhaul"), "Preserves Spare Parts and Labour independently");
  assert(docxText.includes("842123") && docxText.includes("522.00"), "Preserves HSN Tax Summary breakdown intact");
  assert(docxText.includes("OIL FILTER ASSY") && docxText.includes("CLUTCH DISC"), "Preserves 11-column Annexure parts without wrapping loss");
  assert(docxText.includes("28,320.00"), "Preserves Grand Total Amount with precision");

  const qaReport = conversionResult.docxQualityReport;
  assert(qaReport !== undefined, "Engine returns independent DOCX Quality Report");
  if (qaReport) {
    assert(qaReport.overallStatus === "PASS", `QA overall status is PASS (got: ${qaReport.overallStatus})`);
    assert(qaReport.confidenceScore >= 85, `QA confidence score is high (got: ${qaReport.confidenceScore}%)`);
    assert(qaReport.textPreservationPct >= 90, `Text preservation percentage is >= 90% (got: ${qaReport.textPreservationPct}%)`);
    assert(qaReport.openXmlPackageValid, "OpenXML binary ZIP package integrity verified");
    assert(qaReport.pageCountParity.isPageParityPreserved, "Page count parity verified (zero cascading inflation)");
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`PHASE 19 GLOBAL ENGINE VERIFICATION COMPLETE:`);
  console.log(`  PASSED:   ${passed}`);
  console.log(`  FAILED:   ${failed}`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase19Verification();
