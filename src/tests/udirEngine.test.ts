/**
 * Automated QA Test Suite for Universal Document Intelligence Engine (UDIR)
 * and Web Worker Mesh — PDFSun.in
 */

import {
  UdirDocument,
  UdirPage,
  UdirTable,
  RawSpatialToken,
  clusterTokensIntoRows,
  detectColumnBoundaries,
  reconstructTableMatrix,
  buildUdirTableFromTokens,
  isProtectedIdentifier,
  parseCellNumeric,
  compileUdirToDocx,
  compileUdirToXlsx,
  compileUdirToMarkdown,
  compileUdirToJson,
  parseJsonToUdir,
} from "../core/udir";
import { documentMeshPool } from "../workers/documentMeshPool";

export interface TestResult {
  test: string;
  passed: boolean;
  message?: string;
}

export async function runUdirEngineTestSuite(): Promise<{
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, message?: string) {
    if (condition) {
      passed++;
      results.push({ test: testName, passed: true, message });
    } else {
      failed++;
      results.push({ test: testName, passed: false, message: message || "Assertion failed" });
    }
  }

  console.log("🧪 Starting UDIR & Worker Mesh Test Suite...");

  // 1. Identifier protection test
  assert(
    isProtectedIdentifier("GSTIN", "27AAAAA0000A1Z5"),
    "isProtectedIdentifier correctly flags Indian GSTIN as text"
  );
  assert(
    isProtectedIdentifier("PAN", "ABCDE1234F"),
    "isProtectedIdentifier correctly flags PAN as text"
  );
  assert(
    isProtectedIdentifier("", "012345"),
    "isProtectedIdentifier preserves leading zeros on numeric strings"
  );
  assert(
    !isProtectedIdentifier("Amount", "1500.50"),
    "isProtectedIdentifier does not flag regular numeric amounts"
  );

  // 2. Numeric and Currency Parsing
  const num1 = parseCellNumeric("₹1,250.50");
  assert(
    num1.isNumeric && num1.numValue === 1250.5 && num1.formatCode === "₹#,##0.00",
    "parseCellNumeric correctly parses INR currency with formatting"
  );
  const num2 = parseCellNumeric("$99.00");
  assert(
    num2.isNumeric && num2.numValue === 99 && num2.formatCode === "$#,##0.00",
    "parseCellNumeric correctly parses USD currency"
  );
  const num3 = parseCellNumeric("INV-2026-001");
  assert(
    !num3.isNumeric,
    "parseCellNumeric rejects invoice alphanumeric identifiers"
  );

  // 3. Spatial Token Clustering & Table Reconstruction
  const sampleTokens: RawSpatialToken[] = [
    // Header row (y ≈ 50)
    { text: "Item Description", x: 40, y: 50, width: 100, height: 12, fontSize: 11, isBold: true },
    { text: "Qty", x: 220, y: 50, width: 30, height: 12, fontSize: 11, isBold: true },
    { text: "Rate", x: 300, y: 50, width: 40, height: 12, fontSize: 11, isBold: true },
    { text: "Total Amount", x: 420, y: 50, width: 70, height: 12, fontSize: 11, isBold: true },

    // Line 1 (y ≈ 80)
    { text: "PDF Enterprise License", x: 40, y: 80, width: 140, height: 10, fontSize: 10 },
    { text: "2", x: 225, y: 80, width: 10, height: 10, fontSize: 10 },
    { text: "₹4,999.00", x: 300, y: 80, width: 50, height: 10, fontSize: 10 },
    { text: "₹9,998.00", x: 420, y: 80, width: 50, height: 10, fontSize: 10 },

    // Line 2 (y ≈ 105)
    { text: "Document Worker Mesh Addon", x: 40, y: 105, width: 160, height: 10, fontSize: 10 },
    { text: "1", x: 225, y: 105, width: 10, height: 10, fontSize: 10 },
    { text: "₹1,499.00", x: 300, y: 105, width: 50, height: 10, fontSize: 10 },
    { text: "₹1,499.00", x: 420, y: 105, width: 50, height: 10, fontSize: 10 },

    // Total Row (y ≈ 135)
    { text: "Grand Total", x: 40, y: 135, width: 80, height: 11, fontSize: 11, isBold: true },
    { text: "", x: 220, y: 135, width: 10, height: 11, fontSize: 11 },
    { text: "", x: 300, y: 135, width: 10, height: 11, fontSize: 11 },
    { text: "₹11,497.00", x: 420, y: 135, width: 60, height: 11, fontSize: 11, isBold: true },
  ];

  const clustered = clusterTokensIntoRows(sampleTokens, 5);
  assert(clustered.length === 4, "clusterTokensIntoRows successfully creates 4 horizontal rows");

  const { boundaries } = detectColumnBoundaries(clustered);
  assert(boundaries.length >= 4, "detectColumnBoundaries detects at least 4 distinct column boundaries");

  const table = buildUdirTableFromTokens(sampleTokens, "table-inv-1", "Invoice Line Items");
  assert(table.rowCount === 4, "buildUdirTableFromTokens creates table with 4 rows");
  assert(table.columnCount >= 3, "buildUdirTableFromTokens produces multi-column matrix");

  // 4. Dynamic Formula Injection Test
  const totalRow = table.rows[3];
  const totalAmountCell = totalRow.cells[totalRow.cells.length - 1];
  assert(
    !!totalAmountCell.formula && totalAmountCell.formula.startsWith("=SUM("),
    "injectDynamicFormulas automatically injects =SUM(...) formula into Grand Total cell",
    `Formula: ${totalAmountCell.formula}`
  );

  // 5. Construct Canonical Mock UDIR Document
  const sampleUdir: UdirDocument = {
    type: "document",
    schemaVersion: "1.0.0",
    metadata: {
      title: "PDFSun Corporate Test Document",
      pageCount: 1,
      sourceFormat: "pdf",
      readingOrder: "ltr",
      processingDurationMs: 42,
    },
    pages: [
      {
        type: "page",
        pageNumber: 1,
        width: 595.28, // A4
        height: 841.89,
        rotation: 0,
        sections: [],
        blocks: [
          {
            type: "heading",
            id: "h1",
            level: 1,
            text: "Tax Invoice & Summary",
            runs: [
              {
                type: "text_run",
                text: "Tax Invoice & Summary",
                bbox: { x: 40, y: 20, width: 200, height: 24 },
                font: { name: "Calibri", size: 20, isBold: true, isItalic: false },
              },
            ],
            bbox: { x: 40, y: 20, width: 200, height: 24 },
            alignment: "left",
          },
          {
            type: "paragraph",
            id: "p1",
            text: "This document was generated using PDFSun Universal Document Intelligence Engine.",
            runs: [
              {
                type: "text_run",
                text: "This document was generated using PDFSun Universal Document Intelligence Engine.",
                bbox: { x: 40, y: 50, width: 450, height: 12 },
                font: { name: "Calibri", size: 10, isBold: false, isItalic: false },
              },
            ],
            bbox: { x: 40, y: 50, width: 450, height: 12 },
            alignment: "left",
          },
          table,
        ],
      },
    ],
    tables: [table],
    fields: { invoiceNumber: "INV-2026-909" },
    stats: {
      totalWords: 35,
      totalCharacters: 210,
      totalTables: 1,
      totalFormulas: 1,
      totalImages: 0,
      totalFormFields: 1,
    },
  };

  // 6. JSON Serialization Roundtrip
  const jsonOutput = compileUdirToJson(sampleUdir);
  const parsedUdir = parseJsonToUdir(jsonOutput);
  assert(
    parsedUdir.schemaVersion === "1.0.0" && parsedUdir.pages.length === 1,
    "UDIR JSON serialization/deserialization maintains full schema fidelity"
  );

  // 7. Markdown Compiler Test
  const markdownOutput = compileUdirToMarkdown(sampleUdir);
  assert(
    markdownOutput.includes("# Tax Invoice & Summary") &&
    markdownOutput.includes("| Item Description |") &&
    markdownOutput.includes("---:"),
    "compileUdirToMarkdown generates valid GitHub Flavored Markdown with aligned tables"
  );

  // 8. DOCX Compiler Test
  const docxBytes = await compileUdirToDocx(sampleUdir);
  // Check OpenXML zip magic header PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  const isDocxZip =
    docxBytes[0] === 0x50 &&
    docxBytes[1] === 0x4b &&
    docxBytes[2] === 0x03 &&
    docxBytes[3] === 0x04;
  assert(
    isDocxZip && docxBytes.byteLength > 2000,
    "compileUdirToDocx compiles valid OpenXML (.docx) binary package",
    `Size: ${docxBytes.byteLength} bytes`
  );

  // 9. XLSX Compiler Test
  const xlsxBytes = await compileUdirToXlsx(sampleUdir);
  const isXlsxZip =
    xlsxBytes[0] === 0x50 &&
    xlsxBytes[1] === 0x4b &&
    xlsxBytes[2] === 0x03 &&
    xlsxBytes[3] === 0x04;
  assert(
    isXlsxZip && xlsxBytes.byteLength > 2000,
    "compileUdirToXlsx compiles valid OpenXML (.xlsx) multi-tab workbook",
    `Size: ${xlsxBytes.byteLength} bytes`
  );

  // 10. Document Worker Mesh Pool Test
  const meshDocxRes = await documentMeshPool.execute<Uint8Array>(
    "COMPILE_UDIR_TO_DOCX",
    { udir: sampleUdir }
  );
  assert(
    meshDocxRes.result instanceof Uint8Array && meshDocxRes.result.byteLength > 2000,
    "DocumentMeshPool successfully executes COMPILE_UDIR_TO_DOCX through resilient pipeline",
    `Duration: ${Math.round(meshDocxRes.durationMs)} ms`
  );

  const meshXlsxRes = await documentMeshPool.execute<Uint8Array>(
    "COMPILE_UDIR_TO_XLSX",
    { udir: sampleUdir }
  );
  assert(
    meshXlsxRes.result instanceof Uint8Array && meshXlsxRes.result.byteLength > 2000,
    "DocumentMeshPool successfully executes COMPILE_UDIR_TO_XLSX through resilient pipeline",
    `Duration: ${Math.round(meshXlsxRes.durationMs)} ms`
  );

  const meshTableRes = await documentMeshPool.execute<UdirTable>(
    "SPATIAL_CLUSTER_TABLE",
    { tokens: sampleTokens, tableId: "mesh-tbl-1" }
  );
  assert(
    meshTableRes.result.rowCount === 4 && meshTableRes.result.columnCount >= 3,
    "DocumentMeshPool successfully performs SPATIAL_CLUSTER_TABLE action"
  );

  return { passed, failed, results };
}
