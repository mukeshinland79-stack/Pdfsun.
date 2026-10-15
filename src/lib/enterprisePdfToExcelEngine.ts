/**
 * PDFSun Enterprise PDF to Excel (.xlsx / .csv) Data Reconstruction Engine
 * 
 * Complies with Ultimate Master Architect Executive Mandate:
 * 1. Automatic Document Quality Enhancement (Auto-Deskew, Binarization, Contrast Normalization).
 * 2. Multi-Page Layout Splitting & Contextual Multi-Tab Generation (Summary & Tax, Line Items, Customer & Vehicle, Terms).
 * 3. Embedded QR Code & Visual Asset Preservation in Excel cells.
 * 4. Market-Demand Grid Structuring (Dark Slate Headers, Auto-Calculated =SUM() Totals, Currency/Tax Formatting).
 * 5. Spatial grid bounding-box analysis and robust data-type auto-casting.
 */

import * as pdfjsLib from "pdfjs-dist";
import ExcelJS from "exceljs";
import { createWorker } from "tesseract.js";
import { normalizeExcelCell, ensurePaddedMatrix, verifyTableStructure } from "./enterpriseExcelGenerator";
import { enhancePageQualityAndExtractAssets, ExtractedQrCode } from "./documentQualityEnhancer";
import { parseInvoiceStructureFromGrid } from "./invoiceLayoutSplitter";
import { generateEnterpriseMultiTabWorkbook } from "./enterpriseMultiTabExcelGenerator";

// Ensure pdf.js worker is registered
if (typeof window !== "undefined" && !(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

export type PdfToExcelPreset = "auto" | "table" | "fields" | "invoice" | "per-page";

export interface PdfToExcelOptions {
  preset?: PdfToExcelPreset;
  outputFormat?: "xlsx" | "csv";
  enableOcrFallback?: boolean;
  onProgress?: (percent: number, statusMsg: string) => void;
}

export interface SpatialTextToken {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  width: number;
  height: number;
  fontSize: number;
  page: number;
}

export interface ReconstructedGridRow {
  page: number;
  y: number;
  height: number;
  cells: string[];
  isHeader?: boolean;
}

export interface MergedHeaderRegion {
  rowIdx: number;
  startColIdx: number;
  endColIdx: number;
  text: string;
}

/**
 * Non-blocking event loop yield for locked 60 FPS UI
 */
const yieldToEventLoop = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });

/**
 * Enhanced OCR Fallback with Auto-Deskew & Contrast Normalization for scanned PDF pages
 */
async function performEnhancedWasmOcrOnPage(
  page: any,
  viewport: any,
  onProgress?: (msg: string) => void
): Promise<{ tokens: SpatialTextToken[]; qrCodes: ExtractedQrCode[] }> {
  try {
    if (onProgress) onProgress("Running high-accuracy contrast enhancement & auto-deskew...");
    const canvas = document.createElement("canvas");
    const scale = 2.0; // 2x high-resolution rendering for sharp character recognition
    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { tokens: [], qrCodes: [] };

    await (page.render as any)({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;

    // Run Pre-processing: Auto-Deskew, Contrast Normalization & QR Code scanner
    const qualityResult = await enhancePageQualityAndExtractAssets(canvas);

    if (onProgress) onProgress("Executing client-side OCR on enhanced document layer...");
    const worker = await createWorker("eng");
    const ret = await worker.recognize(qualityResult.enhancedCanvas);
    await worker.terminate();

    const tokens: SpatialTextToken[] = [];
    const words = (ret.data as any).words || [];

    for (const w of words) {
      if (!w.text || !w.text.trim()) continue;
      const b = w.bbox || { x0: 0, x1: 0, y0: 0, y1: 0 };
      tokens.push({
        text: w.text.trim(),
        x0: b.x0 / scale,
        x1: b.x1 / scale,
        y0: b.y0 / scale,
        y1: b.y1 / scale,
        width: (b.x1 - b.x0) / scale,
        height: (b.y1 - b.y0) / scale,
        fontSize: (b.y1 - b.y0) / scale,
        page: page.pageNumber || 1,
      });
    }

    return { tokens, qrCodes: qualityResult.qrCodes };
  } catch (err) {
    console.warn("[PDFSun OCR Fallback] Enhanced OCR failed or unavailable:", err);
    return { tokens: [], qrCodes: [] };
  }
}

/**
 * Enterprise PDF to Excel Reconstruction Engine
 */
export async function convertPdfToExcelEnterprise(
  file: File,
  options: PdfToExcelOptions = {}
): Promise<{
  bytes: Uint8Array;
  fileName: string;
  previewRows: string[][];
  totalRows: number;
  totalCols: number;
}> {
  const {
    preset = "auto",
    outputFormat = "xlsx",
    enableOcrFallback = true,
    onProgress,
  } = options;

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "PDFSun_Data_Export";

  if (onProgress) onProgress(10, "Initializing PDF stream & spatial coordinate parser...");
  await yieldToEventLoop();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  }).promise;

  const totalPages = pdf.numPages;
  const allTokens: SpatialTextToken[] = [];
  const detectedQrCodes: ExtractedQrCode[] = [];

  // 1. Spatial Coordinate Extraction across all pages
  for (let pNum = 1; pNum <= totalPages; pNum++) {
    if (onProgress) {
      const pct = 15 + Math.round((pNum / totalPages) * 35);
      onProgress(pct, `Analyzing spatial coordinates on Page ${pNum} of ${totalPages}...`);
    }
    await yieldToEventLoop();

    const page = await pdf.getPage(pNum);
    const viewport = page.getViewport({ scale: 1.0 });

    // Quick visual asset & QR scan on first 2 pages
    if (pNum <= 2 && typeof document !== "undefined") {
      try {
        const qrCanvas = document.createElement("canvas");
        const qrVp = page.getViewport({ scale: 1.5 });
        qrCanvas.width = qrVp.width;
        qrCanvas.height = qrVp.height;
        const qCtx = qrCanvas.getContext("2d", { willReadFrequently: true });
        if (qCtx) {
          await (page.render as any)({ canvasContext: qCtx, viewport: qrVp, canvas: qrCanvas }).promise;
          const enh = await enhancePageQualityAndExtractAssets(qrCanvas);
          if (enh.qrCodes.length > 0) {
            detectedQrCodes.push(...enh.qrCodes);
          }
        }
      } catch (qrScanErr) {
        console.warn("[PDFSun] QR scan notice:", qrScanErr);
      }
    }

    const textContent = await (page.getTextContent as any)({ normalizeWhitespace: true });
    const rawItems = textContent.items as any[];

    let pageTokens: SpatialTextToken[] = [];
    let pageCharCount = 0;

    for (const item of rawItems) {
      if (!item.str || !item.str.trim()) continue;
      const str = item.str.trim();
      pageCharCount += str.length;

      const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
      const x = tx[4];
      const y = viewport.height - tx[5]; // Convert PDF bottom-up coords to top-down
      const w = item.width || Math.max(str.length * 6, 8);
      const h = item.height || Math.abs(tx[3]) || 10;

      pageTokens.push({
        text: str,
        x0: x,
        x1: x + w,
        y0: y - h,
        y1: y,
        width: w,
        height: h,
        fontSize: Math.abs(tx[3]) || 10,
        page: pNum,
      });
    }

    // WASM Table OCR Fallback if page is flat/scanned image
    if (pageCharCount < 25 && enableOcrFallback && typeof window !== "undefined") {
      const ocrResult = await performEnhancedWasmOcrOnPage(page, viewport, (msg) => {
        if (onProgress) onProgress(35, msg);
      });
      if (ocrResult.tokens.length > 0) {
        pageTokens = ocrResult.tokens;
      }
      if (ocrResult.qrCodes.length > 0) {
        detectedQrCodes.push(...ocrResult.qrCodes);
      }
    }

    allTokens.push(...pageTokens);
  }

  if (allTokens.length === 0) {
    throw new Error(`No extractable text or tabular data was detected in "${file.name}".`);
  }

  // 2. Spatial Grid Bounding-Box Analysis (Clustering rows & column corridors)
  if (onProgress) onProgress(55, "Calculating column corridors & multi-line cell alignments...");
  await yieldToEventLoop();

  // Baseline row clustering (tolerance 4.0pt)
  allTokens.sort((a, b) => (a.page !== b.page ? a.page - b.page : a.y0 - b.y0 || a.x0 - b.x0));

  const rawRows: Array<{ page: number; y: number; height: number; tokens: SpatialTextToken[] }> = [];
  const yTolerance = 4.0;

  for (const token of allTokens) {
    let matchedRow = rawRows.find(
      (r) => r.page === token.page && Math.abs(r.y - token.y0) <= yTolerance
    );

    if (matchedRow) {
      matchedRow.tokens.push(token);
      matchedRow.height = Math.max(matchedRow.height, token.height);
    } else {
      rawRows.push({
        page: token.page,
        y: token.y0,
        height: token.height,
        tokens: [token],
      });
    }
  }

  // Sort tokens in each row from left to right
  for (const r of rawRows) {
    r.tokens.sort((a, b) => a.x0 - b.x0);
  }

  // Detect Column Corridors across the document
  interface PdfCellPhrase {
    text: string;
    x0: number;
    x1: number;
  }

  const rowPhrases: Array<{ page: number; y: number; phrases: PdfCellPhrase[] }> = [];
  const xAnchors: number[] = [];

  for (const r of rawRows) {
    const phrases: PdfCellPhrase[] = [];
    let curPhrase: PdfCellPhrase | null = null;

    for (const t of r.tokens) {
      if (!curPhrase) {
        curPhrase = { text: t.text, x0: t.x0, x1: t.x1 };
        continue;
      }

      const gap = t.x0 - curPhrase.x1;
      if (gap <= 14) {
        curPhrase.text += " " + t.text;
        curPhrase.x1 = Math.max(curPhrase.x1, t.x1);
      } else {
        phrases.push(curPhrase);
        curPhrase = { text: t.text, x0: t.x0, x1: t.x1 };
      }
    }
    if (curPhrase) {
      phrases.push(curPhrase);
    }

    rowPhrases.push({ page: r.page, y: r.y, phrases });

    if (phrases.length >= 2 || preset === "table") {
      for (const p of phrases) {
        xAnchors.push(p.x0);
      }
    }
  }

  xAnchors.sort((a, b) => a - b);

  // Cluster x positions into distinct column boundaries (tolerance 18pt)
  const colCorridorTolerance = preset === "fields" ? 28 : 18;
  const colCenters: number[] = [];

  for (const x of xAnchors) {
    const matchIdx = colCenters.findIndex((c) => Math.abs(c - x) <= colCorridorTolerance);
    if (matchIdx === -1) {
      colCenters.push(x);
    } else {
      colCenters[matchIdx] = (colCenters[matchIdx] * 2 + x) / 3;
    }
  }

  colCenters.sort((a, b) => a - b);
  const totalCols = Math.max(colCenters.length, 1);

  const getColIndex = (x: number): number => {
    let bestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < colCenters.length; i++) {
      const diff = Math.abs(colCenters[i] - x);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // 3. Map tokens into 2D Grid Cells & Reconcile Multi-Line Cells
  if (onProgress) onProgress(70, "Reconciling multi-line cells & merged banner headers...");
  await yieldToEventLoop();

  const finalGrid: string[][] = [];
  const mergedHeaders: MergedHeaderRegion[] = [];

  for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
    const r = rawRows[rIdx];
    const rowCells = new Array(totalCols).fill("");

    // Banner header spanning multiple columns
    if (r.tokens.length === 1 && totalCols > 3 && r.tokens[0].text.length > 25) {
      rowCells[0] = r.tokens[0].text;
      mergedHeaders.push({
        rowIdx: finalGrid.length + 1,
        startColIdx: 1,
        endColIdx: totalCols,
        text: r.tokens[0].text,
      });
      finalGrid.push(rowCells);
      continue;
    }

    for (const token of r.tokens) {
      const cIdx = getColIndex(token.x0);
      if (rowCells[cIdx]) {
        rowCells[cIdx] += " " + token.text;
      } else {
        rowCells[cIdx] = token.text;
      }
    }

    // Multi-line cell reconciliation with previous row
    if (
      finalGrid.length > 0 &&
      r.tokens.length <= 2 &&
      rIdx > 0 &&
      rawRows[rIdx - 1].page === r.page &&
      Math.abs(r.y - rawRows[rIdx - 1].y) < 14
    ) {
      const prevRow = finalGrid[finalGrid.length - 1];
      let canReconcile = false;

      for (let c = 0; c < totalCols; c++) {
        if (rowCells[c] && prevRow[c] && !/^[$\u20ac\u00a3\u20b9]?[0-9,]+(\.[0-9]+)?$/.test(rowCells[c])) {
          prevRow[c] += " " + rowCells[c];
          canReconcile = true;
          rowCells[c] = "";
        }
      }

      if (canReconcile && rowCells.every((cell) => !cell)) {
        continue;
      }
    }

    finalGrid.push(rowCells);
  }

  // Ensure matrix is padded and verify structure
  const paddedGrid = ensurePaddedMatrix(finalGrid);
  const audit = verifyTableStructure(paddedGrid);
  if (audit.warnings.length > 0) {
    console.info("[PDFSun PDF to Excel Audit]", audit.warnings);
  }

  // Full document text for smart schema analysis
  const fullDocumentText = allTokens.map((t) => t.text).join(" ");
  const isInvoiceDetected =
    preset === "invoice" ||
    (preset === "auto" &&
      /\b(invoice|tax\s*invoice|bill\s*of\s*supply|gstin|cgst|sgst|igst|hsn|e-?way\s*bill)\b/i.test(
        fullDocumentText
      ));

  // 4. Output Formatting (CSV or Multi-Tab OpenXML XLSX)
  if (outputFormat === "csv") {
    if (onProgress) onProgress(85, "Encoding UTF-8 CSV with universal spreadsheet BOM...");
    await yieldToEventLoop();

    const csvContent = paddedGrid
      .map((row) =>
        row
          .map((cell) => {
            const str = cell === null || cell === undefined ? "" : String(cell);
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      )
      .join("\r\n");

    const encoder = new TextEncoder();
    const csvBytes = encoder.encode("\uFEFF" + csvContent); // UTF-8 BOM

    if (onProgress) onProgress(100, "CSV spreadsheet ready!");

    return {
      bytes: csvBytes,
      fileName: `${baseName}.csv`,
      previewRows: paddedGrid.slice(0, 50),
      totalRows: paddedGrid.length,
      totalCols: paddedGrid[0]?.length || totalCols,
    };
  }

  // 5. Intelligent Multi-Tab Invoice Generation (When Invoice detected or selected)
  if (isInvoiceDetected && outputFormat === "xlsx") {
    if (onProgress) {
      onProgress(85, "Structuring 4-tab corporate workbook (Summary, Line Items, Customer & Vehicle, Terms)...");
    }
    await yieldToEventLoop();

    const invoiceData = parseInvoiceStructureFromGrid(paddedGrid, fullDocumentText);
    const multiTabBytes = await generateEnterpriseMultiTabWorkbook(invoiceData, {
      workbookTitle: `${baseName} - Multi-Tab Excel`,
      creator: "PDFSun.in Enterprise Excel Engine",
      qrCode: detectedQrCodes[0],
      rawGridMatrix: paddedGrid,
    });

    if (onProgress) onProgress(100, "Multi-tab corporate Excel workbook ready!");

    return {
      bytes: multiTabBytes,
      fileName: `${baseName}_MultiTab.xlsx`,
      previewRows: paddedGrid.slice(0, 50),
      totalRows: paddedGrid.length,
      totalCols: paddedGrid[0]?.length || totalCols,
    };
  }

  // 6. Standard Single-Tab / Structured Table Generation with Auto-Calculated =SUM() Totals
  if (onProgress) onProgress(85, "Casting numeric data types, dates & generating OpenXML stream with formula totals...");
  await yieldToEventLoop();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PDFSun.in Ultimate Spreadsheet Engine";
  workbook.lastModifiedBy = "PDFSun.in";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Table_Data", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  // Calculate dynamic column widths
  const colMaxLens = new Array(totalCols).fill(10);
  for (let r = 0; r < Math.min(paddedGrid.length, 300); r++) {
    const row = paddedGrid[r];
    for (let c = 0; c < totalCols; c++) {
      const len = (row[c] || "").length;
      if (len > colMaxLens[c]) {
        colMaxLens[c] = Math.min(len, 45);
      }
    }
  }

  worksheet.columns = colMaxLens.map((len, idx) => ({
    header: undefined,
    key: `col_${idx}`,
    width: Math.max(len + 4, 12),
  }));

  // Track numeric columns to build automated =SUM() formulas
  const numericColumns = new Set<number>();

  // Render Data Rows with Automatic Data-Type Auto-Casting
  for (let rIdx = 0; rIdx < paddedGrid.length; rIdx++) {
    const rowData = paddedGrid[rIdx];
    const isHeaderRow = rIdx === 0;

    const row = worksheet.addRow([]);
    row.height = isHeaderRow ? 26 : 21;

    for (let cIdx = 0; cIdx < totalCols; cIdx++) {
      const rawVal = rowData[cIdx] || "";
      const cell = row.getCell(cIdx + 1);

      if (isHeaderRow) {
        cell.value = rawVal || `Column ${cIdx + 1}`;
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E293B" }, // Navy Dark Slate
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF475569" } },
          left: { style: "thin", color: { argb: "FF475569" } },
          bottom: { style: "medium", color: { argb: "FF0F172A" } },
          right: { style: "thin", color: { argb: "FF475569" } },
        };
      } else {
        const normalized = normalizeExcelCell(rawVal);
        cell.value = normalized.value;

        if (normalized.type === "number") {
          numericColumns.add(cIdx + 1);
        }

        if (normalized.numFmt) {
          cell.numFmt = normalized.numFmt;
        }

        cell.font = {
          name: "Calibri",
          size: 10.5,
          color: { argb: "FF0F172A" },
        };

        cell.alignment = normalized.alignment;

        // Alternating zebra striping
        if (rIdx % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }

        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      }
    }
  }

  // Apply Merged Headers if detected
  for (const merge of mergedHeaders) {
    try {
      if (merge.rowIdx <= paddedGrid.length && merge.startColIdx < merge.endColIdx) {
        worksheet.mergeCells(merge.rowIdx, merge.startColIdx, merge.rowIdx, merge.endColIdx);
      }
    } catch {}
  }

  // Auto-calculated =SUM() Total row for numeric tables
  if (paddedGrid.length > 2 && numericColumns.size > 0) {
    const totalRow = worksheet.addRow([]);
    totalRow.height = 24;
    totalRow.getCell(1).value = "TOTAL";
    totalRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF0F172A" } };

    numericColumns.forEach((colNum) => {
      const colLetter = getExcelColLetter(colNum);
      const cell = totalRow.getCell(colNum);
      cell.value = { formula: `SUM(${colLetter}2:${colLetter}${paddedGrid.length})` };
      cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
      cell.numFmt = "#,##0.00";
    });

    totalRow.eachCell((c) => {
      c.border = {
        top: { style: "thin", color: { argb: "FF0F172A" } },
        bottom: { style: "double", color: { argb: "FF0F172A" } },
      };
    });
  }

  // Embed detected QR code in worksheet if present
  if (detectedQrCodes.length > 0 && detectedQrCodes[0].imageBase64) {
    try {
      const cleanBase64 = detectedQrCodes[0].imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const qrId = workbook.addImage({
        base64: cleanBase64,
        extension: "png",
      });
      worksheet.addImage(qrId, {
        tl: { col: totalCols, row: 1 },
        ext: { width: 120, height: 120 },
      });
    } catch (e) {
      console.warn("Table QR embed notice:", e);
    }
  }

  if (onProgress) onProgress(95, "Packing OpenXML .xlsx binary stream...");
  await yieldToEventLoop();

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);

  // Ephemeral Memory isolation cleanup
  allTokens.length = 0;
  rawRows.length = 0;
  finalGrid.length = 0;

  if (onProgress) onProgress(100, "PDF to Excel reconstruction complete!");

  return {
    bytes,
    fileName: `${baseName}.xlsx`,
    previewRows: paddedGrid.slice(0, 50),
    totalRows: paddedGrid.length,
    totalCols: paddedGrid[0]?.length || totalCols,
  };
}

function getExcelColLetter(colIdx: number): string {
  let letter = "";
  let temp = colIdx;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}
