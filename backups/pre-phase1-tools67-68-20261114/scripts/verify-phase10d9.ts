// Node environment polyfill for pdfjs-dist
if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  };
}

import { PDFDocument, rgb, degrees } from "pdf-lib";
import JSZip from "jszip";


interface VerificationResult {
  category: string;
  test: string;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

function record(category: string, test: string, passed: boolean, details?: string) {
  results.push({ category, test, passed, details });
  console.log(`[${category}] ${passed ? "✓ PASS" : "✗ FAIL"}: ${test}${details ? ` (${details})` : ""}`);
}

async function runPhase10D9Verification() {
  console.log("================================================================================");
  console.log("PDFSun.in — Phase 10D.9 Independent Verification & Acceptance Suite");
  console.log("================================================================================\n");

  const {
    parsePdfToUdir,
    compileUdirToDocx,
    compileUdirToXlsx,
    compileUdirToMarkdown,
    compileUdirToJson,
    parseJsonToUdir,
    buildUdirTableFromTokens,
  } = await import("../src/core/udir");
  const { documentMeshPool } = await import("../src/workers/documentMeshPool");
  type UdirDocument = import("../src/core/udir").UdirDocument;
  type UdirTable = import("../src/core/udir").UdirTable;

  // -------------------------------------------------------------------------
  // 1. Synthetic Multi-Page PDF Generation with pdf-lib
  // -------------------------------------------------------------------------
  console.log("--- Section 1: Synthetic PDF Generation & Ingestion Testing ---");
  const pdfDoc = await PDFDocument.create();

  
  // Page 1: Standard Portrait (600x800) with Heading, Prose, Table
  const page1 = pdfDoc.addPage([600, 800]);
  page1.drawText("Tax Invoice & Settlement Statement", { x: 50, y: 740, size: 20 });
  page1.drawText("PDFSun Technologies Pvt Ltd — Enterprise Document Suite", { x: 50, y: 710, size: 12 });
  
  // Table Rows on Page 1
  // Header
  page1.drawText("Line Item", { x: 50, y: 650, size: 10 });
  page1.drawText("HSN/SAC", { x: 220, y: 650, size: 10 });
  page1.drawText("Taxable (INR)", { x: 340, y: 650, size: 10 });
  page1.drawText("Total (INR)", { x: 460, y: 650, size: 10 });
  // Row 1
  page1.drawText("Universal Mesh Pool Core", { x: 50, y: 620, size: 10 });
  page1.drawText("998313", { x: 220, y: 620, size: 10 });
  page1.drawText("4999.00", { x: 340, y: 620, size: 10 });
  page1.drawText("5898.82", { x: 460, y: 620, size: 10 });
  // Row 2
  page1.drawText("Client-side WASM OCR Engine", { x: 50, y: 590, size: 10 });
  page1.drawText("998314", { x: 220, y: 590, size: 10 });
  page1.drawText("2499.00", { x: 340, y: 590, size: 10 });
  page1.drawText("2948.82", { x: 460, y: 590, size: 10 });
  // Total Row
  page1.drawText("Total Invoice Amount", { x: 50, y: 550, size: 11 });
  page1.drawText("", { x: 220, y: 550, size: 10 });
  page1.drawText("7498.00", { x: 340, y: 550, size: 11 });
  page1.drawText("8847.64", { x: 460, y: 550, size: 11 });

  // Page 2: Rotated 90 degrees Landscape
  const page2 = pdfDoc.addPage([800, 600]);
  page2.setRotation(degrees(90));
  page2.drawText("Appendix A: Security Compliance & Audit Ledger", { x: 60, y: 540, size: 16 });
  page2.drawText("Zero external server uploads confirmed via client Web Worker mesh.", { x: 60, y: 500, size: 11 });

  const generatedPdfBytes = await pdfDoc.save();
  record("PDF Ingestion", "Generated test PDF with pdf-lib (2 pages, table, 90deg rotation)", generatedPdfBytes.byteLength > 0, `${generatedPdfBytes.byteLength} bytes`);

  // Ingestion with UDIR
  const parsedUdir = await parsePdfToUdir(generatedPdfBytes, { detectTables: true });
  record("PDF Ingestion", "parsePdfToUdir parsed document successfully", parsedUdir.type === "document");
  record("PDF Ingestion", "Correct page count extracted (2 pages)", parsedUdir.metadata.pageCount === 2, `Found ${parsedUdir.metadata.pageCount}`);
  record("PDF Ingestion", "Page 2 rotation metadata preserved (90 degrees)", parsedUdir.pages[1].rotation === 90, `Rotation = ${parsedUdir.pages[1].rotation}°`);
  record("PDF Ingestion", "Tabular structures detected on Page 1", parsedUdir.tables.length >= 1, `Found ${parsedUdir.tables.length} table(s)`);
  record("PDF Ingestion", "Document stats accurately tallied words and characters", parsedUdir.stats.totalWords > 20 && parsedUdir.stats.totalCharacters > 100, `Words: ${parsedUdir.stats.totalWords}, Chars: ${parsedUdir.stats.totalCharacters}`);

  // -------------------------------------------------------------------------
  // 2. Unicode, Hindi (Devanagari) & RTL Protection in UDIR Matrix
  // -------------------------------------------------------------------------
  console.log("\n--- Section 2: Unicode, Devanagari & Special Character Integrity ---");
  const hindiUdir: any = {
    type: "document",

    schemaVersion: "1.0.0",
    metadata: {
      pageCount: 1,
      sourceFormat: "pdf",
      readingOrder: "ltr",
      title: "जीएसटी चालान विवरण (GST Invoice Statement)",
    },
    pages: [
      {
        type: "page",
        pageNumber: 1,
        width: 595,
        height: 842,
        rotation: 0,
        sections: [],
        blocks: [
          {
            type: "heading",
            id: "h1",
            level: 1,
            text: "पीडीएफ सन — स्मार्ट दस्तावेज़ साथी (PDFSun)",
            runs: [
              {
                type: "text_run",
                text: "पीडीएफ सन — स्मार्ट दस्तावेज़ साथी (PDFSun)",
                bbox: { x: 40, y: 50, width: 300, height: 24 },
                font: { name: "Mangal", size: 20, isBold: true, isItalic: false },
              },
            ],
            bbox: { x: 40, y: 50, width: 300, height: 24 },
            alignment: "left",
          },
          {
            type: "table",
            id: "table-hi-1",
            title: "कर चालान विवरण (Tax Summary)",
            rowCount: 3,
            columnCount: 4,
            columnWidths: [150, 100, 120, 120],
            hasZebraStriping: true,
            bbox: { x: 40, y: 100, width: 490, height: 120 },
            rows: [
              {
                rowIndex: 0,
                isHeaderRow: true,
                cells: [
                  { text: "सेवा विवरण (Service)", runs: [{ type: "text_run", text: "सेवा विवरण (Service)", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Mangal", size: 10, isBold: true, isItalic: false } }] },
                  { text: "जीएसटीआईएन (GSTIN)", runs: [{ type: "text_run", text: "जीएसटीआईएन (GSTIN)", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Mangal", size: 10, isBold: true, isItalic: false } }] },
                  { text: "कर योग्य मूल्य", runs: [{ type: "text_run", text: "कर योग्य मूल्य", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Mangal", size: 10, isBold: true, isItalic: false } }] },
                  { text: "कुल राशि (Total)", runs: [{ type: "text_run", text: "कुल राशि (Total)", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Mangal", size: 10, isBold: true, isItalic: false } }] },
                ],
              },
              {
                rowIndex: 1,
                cells: [
                  { text: "क्लाउड सदस्यता", runs: [{ type: "text_run", text: "क्लाउड सदस्यता", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Mangal", size: 10, isBold: false, isItalic: false } }] },
                  { text: "27AABCU9603R1ZM", runs: [{ type: "text_run", text: "27AABCU9603R1ZM", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Calibri", size: 10, isBold: false, isItalic: false } }] },
                  { text: "₹1,499.00", isNumeric: true, numValue: 1499.0, formatCode: "₹#,##0.00", runs: [{ type: "text_run", text: "₹1,499.00", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Calibri", size: 10, isBold: false, isItalic: false } }] },
                  { text: "₹1,768.82", isNumeric: true, numValue: 1768.82, formatCode: "₹#,##0.00", runs: [{ type: "text_run", text: "₹1,768.82", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Calibri", size: 10, isBold: false, isItalic: false } }] },
                ],
              },
              {
                rowIndex: 2,
                cells: [
                  { text: "कुल योग (Grand Total)", isHeader: true, runs: [{ type: "text_run", text: "कुल योग (Grand Total)", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Mangal", size: 10, isBold: true, isItalic: false } }] },
                  { text: "", runs: [] },
                  { text: "₹1,499.00", formula: "=SUM(C2:C2)", numValue: 1499.0, runs: [{ type: "text_run", text: "₹1,499.00", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Calibri", size: 10, isBold: true, isItalic: false } }] },
                  { text: "₹1,768.82", formula: "=SUM(D2:D2)", numValue: 1768.82, runs: [{ type: "text_run", text: "₹1,768.82", bbox: { x: 0, y: 0, width: 0, height: 0 }, font: { name: "Calibri", size: 10, isBold: true, isItalic: false } }] },
                ],
              },
            ],
          },

        ],
      },
    ],
    tables: [],
    fields: {},
    stats: { totalWords: 30, totalCharacters: 180, totalTables: 1, totalFormulas: 2, totalImages: 0, totalFormFields: 0 },
  };

  hindiUdir.tables = [hindiUdir.pages[0].blocks[1] as UdirTable];

  // -------------------------------------------------------------------------
  // 3. OpenXML DOCX Compilation & Package Deep Inspection
  // -------------------------------------------------------------------------
  console.log("\n--- Section 3: OpenXML DOCX Package Validation ---");
  const docxBytes = await compileUdirToDocx(hindiUdir);
  record("DOCX Compilation", "compileUdirToDocx generated binary output", docxBytes.byteLength > 2000, `${docxBytes.byteLength} bytes`);

  const docxZip = await JSZip.loadAsync(docxBytes);
  const docxFiles = Object.keys(docxZip.files);
  record("DOCX OpenXML", "ZIP archive contains [Content_Types].xml", docxFiles.includes("[Content_Types].xml"));
  record("DOCX OpenXML", "ZIP archive contains word/document.xml", docxFiles.includes("word/document.xml"));
  record("DOCX OpenXML", "ZIP archive contains _rels/.rels", docxFiles.includes("_rels/.rels"));

  const documentXml = await docxZip.file("word/document.xml")?.async("string");
  const hasWordTable = !!documentXml && documentXml.includes("<w:tbl");
  const hasWordRow = !!documentXml && documentXml.includes("<w:tr");
  const hasWordCell = !!documentXml && documentXml.includes("<w:tc");
  const hasHindiWordText = !!documentXml && documentXml.includes("पीडीएफ सन");
  const hasGstinInWord = !!documentXml && documentXml.includes("27AABCU9603R1ZM");

  record("DOCX OpenXML", "Native OpenXML table elements present (<w:tbl, <w:tr, <w:tc)", hasWordTable && hasWordRow && hasWordCell);
  record("DOCX OpenXML", "Devanagari Hindi text preserved in word/document.xml", hasHindiWordText);
  record("DOCX OpenXML", "Indian GSTIN string preserved in word/document.xml", hasGstinInWord);

  // -------------------------------------------------------------------------
  // 4. OpenXML XLSX Compilation & Multi-Tab Inspection
  // -------------------------------------------------------------------------
  console.log("\n--- Section 4: OpenXML XLSX Package Validation ---");
  const xlsxBytes = await compileUdirToXlsx(hindiUdir);
  record("XLSX Compilation", "compileUdirToXlsx generated binary output", xlsxBytes.byteLength > 2000, `${xlsxBytes.byteLength} bytes`);

  const xlsxZip = await JSZip.loadAsync(xlsxBytes);
  const xlsxFiles = Object.keys(xlsxZip.files);
  record("XLSX OpenXML", "ZIP archive contains [Content_Types].xml", xlsxFiles.includes("[Content_Types].xml"));
  record("XLSX OpenXML", "ZIP archive contains xl/workbook.xml", xlsxFiles.includes("xl/workbook.xml"));
  record("XLSX OpenXML", "Multi-tab sheets present (sheet1, sheet2, sheet3)", 
    xlsxFiles.includes("xl/worksheets/sheet1.xml") &&
    xlsxFiles.includes("xl/worksheets/sheet2.xml") &&
    xlsxFiles.includes("xl/worksheets/sheet3.xml")
  );

  const workbookXml = await xlsxZip.file("xl/workbook.xml")?.async("string");
  const hasOverviewSheet = !!workbookXml && workbookXml.includes('name="Document Overview"');
  const hasTablesSheet = !!workbookXml && workbookXml.includes('name="Structured Tables"');
  const hasFlowSheet = !!workbookXml && workbookXml.includes('name="Raw Content Flow"');
  record("XLSX OpenXML", "All 3 required worksheet names present in xl/workbook.xml", hasOverviewSheet && hasTablesSheet && hasFlowSheet);

  // Check Sheet 2 (Structured Tables) for Formulas and Strings
  const sheet2Xml = await xlsxZip.file("xl/worksheets/sheet2.xml")?.async("string");
  const sharedStringsXml = await xlsxZip.file("xl/sharedStrings.xml")?.async("string");
  const combinedXlsxText = (sheet2Xml || "") + (sharedStringsXml || "");

  const hasFormulaTag = !!sheet2Xml && sheet2Xml.includes("<f");
  const hasPreservedGstinInXlsx = combinedXlsxText.includes("27AABCU9603R1ZM");
  const hasHindiInXlsx = combinedXlsxText.includes("सेवा विवरण");

  record("XLSX OpenXML", "Native dynamic Excel formula element (<f>) preserved", hasFormulaTag);
  record("XLSX OpenXML", "Indian GSTIN preserved as text without scientific notation corruption", hasPreservedGstinInXlsx);
  record("XLSX OpenXML", "Devanagari Unicode text preserved in Excel XML structure", hasHindiInXlsx);

  // -------------------------------------------------------------------------
  // 5. Worker Mesh Pool Execution & Resiliency
  // -------------------------------------------------------------------------
  console.log("\n--- Section 5: Document Worker Mesh Pool & Execution Resilience ---");
  const meshDocxRes = await documentMeshPool.compileDocxWithMemoryGuard(hindiUdir);
  record("Worker Mesh Pool", "documentMeshPool.compileDocxWithMemoryGuard returned valid buffer", meshDocxRes.bytes.byteLength > 1000, `${meshDocxRes.bytes.byteLength} bytes`);

  const meshXlsxRes = await documentMeshPool.compileXlsxWithMemoryGuard(hindiUdir);
  record("Worker Mesh Pool", "documentMeshPool.compileXlsxWithMemoryGuard returned valid buffer", meshXlsxRes.bytes.byteLength > 1000, `${meshXlsxRes.bytes.byteLength} bytes`);

  const meshMdRes = await documentMeshPool.execute<string>("COMPILE_UDIR_TO_MARKDOWN", { udir: hindiUdir });
  const meshMd = meshMdRes.result;
  record("Worker Mesh Pool", "documentMeshPool executes COMPILE_UDIR_TO_MARKDOWN with aligned table", meshMd.includes("|") && meshMd.includes("जीएसटीआईएन"), `${meshMd.length} chars`);


  // Fallback resilience: passing malformed / empty input
  let caughtEmptyError = false;
  try {
    await parsePdfToUdir(new Uint8Array(0));
  } catch (err: any) {
    caughtEmptyError = true;
  }
  record("Fault Resilience", "parsePdfToUdir gracefully catches and rejects 0-byte input", caughtEmptyError);

  // Malformed token table builder
  const emptyTable = buildUdirTableFromTokens([], "empty-1");
  record("Fault Resilience", "buildUdirTableFromTokens handles empty tokens gracefully without crashing", emptyTable.rowCount === 0 && emptyTable.columnCount === 0);

  // -------------------------------------------------------------------------
  // 6. JSON Roundtrip Fidelity
  // -------------------------------------------------------------------------
  console.log("\n--- Section 6: JSON Serialization Fidelity & Schema Compliance ---");
  const jsonStr = compileUdirToJson(hindiUdir);
  const reParsedUdir = parseJsonToUdir(jsonStr);
  record("JSON Serialization", "compileUdirToJson produces valid JSON string", typeof jsonStr === "string" && jsonStr.length > 500);
  record("JSON Serialization", "parseJsonToUdir restores schemaVersion and document structure", reParsedUdir.schemaVersion === "1.0.0" && reParsedUdir.tables.length === 1);
  record("JSON Serialization", "GSTIN and Hindi characters exact match after roundtrip", reParsedUdir.metadata.title === hindiUdir.metadata.title && reParsedUdir.tables[0].rows[1].cells[1].text === "27AABCU9603R1ZM");

  // -------------------------------------------------------------------------
  // Final Tally
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  console.log(`Phase 10D.9 Verification Complete: ${totalPassed} Passed, ${totalFailed} Failed (${results.length} total tests)`);
  console.log("================================================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase10D9Verification().catch((err) => {
  console.error("FATAL in verifyPhase10D9:", err);
  process.exit(1);
});
