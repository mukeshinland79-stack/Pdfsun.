/**
 * PDFSun Enterprise PDF to Excel (.xlsx / .csv) Data Reconstruction Engine
 * 
 * Complies with Ultimate Master Architect Executive Mandate:
 * - Module 2: Ultimate PDF to Excel Data Reconstruction Engine
 *   1. Spatial grid bounding-box analysis (AI-Assisted structure parsing).
 *   2. Automatic data-type casting engine (Currency, Float/Int, Dates, %, Protected IDs).
 *   3. WASM Table OCR fallback for scanned statements, bills & invoices.
 * - Module 3: Expanded UI Presets & Zero-Knowledge Ephemeral Memory Isolation.
 */

import * as pdfjsLib from "pdfjs-dist";
import ExcelJS from "exceljs";
import { createWorker } from "tesseract.js";
import { normalizeExcelCell, ensurePaddedMatrix, verifyTableStructure } from "./enterpriseExcelGenerator";

// Ensure pdf.js worker is registered
if (typeof window !== "undefined" && !(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

export type PdfToExcelPreset = "auto" | "table" | "fields";

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
 * OCR Fallback for scanned/rasterized PDF pages
 */
async function performWasmOcrOnPage(
  page: any,
  viewport: any,
  onProgress?: (msg: string) => void
): Promise<SpatialTextToken[]> {
  try {
    if (onProgress) onProgress("Running client-side WASM OCR on scanned page...");
    const canvas = document.createElement("canvas");
    const scale = 2.0; // 2x high-resolution rendering for sharp character recognition
    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

    // Grayscale & contrast enhancement
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const contrast = gray > 140 ? 255 : gray < 80 ? 0 : gray;
      d[i] = contrast;
      d[i + 1] = contrast;
      d[i + 2] = contrast;
    }
    ctx.putImageData(imgData, 0, 0);

    const worker = await createWorker("eng");
    const ret = await worker.recognize(canvas);
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

    return tokens;
  } catch (err) {
    console.warn("[PDFSun OCR Fallback] OCR failed or unavailable:", err);
    return [];
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

  // 1. Spatial Coordinate Extraction across all pages
  for (let pNum = 1; pNum <= totalPages; pNum++) {
    if (onProgress) {
      const pct = 15 + Math.round((pNum / totalPages) * 35);
      onProgress(pct, `Analyzing spatial coordinates on Page ${pNum} of ${totalPages}...`);
    }
    await yieldToEventLoop();

    const page = await pdf.getPage(pNum);
    const viewport = page.getViewport({ scale: 1.0 });
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
      const ocrTokens = await performWasmOcrOnPage(page, viewport, (msg) => {
        if (onProgress) onProgress(35, msg);
      });
      if (ocrTokens.length > 0) {
        pageTokens = ocrTokens;
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

  // Baseline row clustering (tolerance 3.5pt)
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
  // Collect x0 coordinates of tokens
  const xAnchors: number[] = [];
  for (const r of rawRows) {
    // Only consider rows that have at least 2 tokens to avoid single-line titles skewing column detection
    if (r.tokens.length >= 2 || preset === "table") {
      for (const t of r.tokens) {
        xAnchors.push(t.x0);
      }
    }
  }

  xAnchors.sort((a, b) => a - b);

  // Cluster x positions into distinct column boundaries (tolerance 18pt)
  const colCorridorTolerance = preset === "fields" ? 28 : 16;
  const colCenters: number[] = [];

  for (const x of xAnchors) {
    const existing = colCenters.find((c) => Math.abs(c - x) <= colCorridorTolerance);
    if (existing !== undefined) {
      // update running average
      const idx = colCenters.indexOf(existing);
      colCenters[idx] = (existing + x) / 2;
    } else {
      colCenters.push(x);
    }
  }

  colCenters.sort((a, b) => a - b);
  const totalCols = Math.max(colCenters.length, 1);

  // Find column index for a given x position
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

    // Check if this row is a banner header spanning multiple columns
    if (r.tokens.length === 1 && totalCols > 3 && r.tokens[0].text.length > 25) {
      rowCells[0] = r.tokens[0].text;
      mergedHeaders.push({
        rowIdx: finalGrid.length + 1, // 1-indexed for ExcelJS
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

    // Check multi-line cell reconciliation with previous row
    // If current row has content in only 1 or 2 columns and is immediately under the previous row
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

      // If all content was absorbed, don't push duplicate row
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

  // 4. Output Formatting (CSV or OpenXML XLSX)
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
    const csvBytes = encoder.encode("\uFEFF" + csvContent); // UTF-8 BOM for universal Excel compatibility

    if (onProgress) onProgress(100, "CSV spreadsheet ready!");

    return {
      bytes: csvBytes,
      fileName: `${baseName}.csv`,
      previewRows: paddedGrid.slice(0, 50),
      totalRows: paddedGrid.length,
      totalCols: paddedGrid[0]?.length || totalCols,
    };
  }

  // 5. Native OpenXML Excel (.xlsx) Generation with Dynamic Type Casting
  if (onProgress) onProgress(85, "Casting numeric data types, dates & generating OpenXML stream...");
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
        // Styled Navy Blue Header with Bold White Text
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
        // Automatic Data-Type Casting Engine
        const normalized = normalizeExcelCell(rawVal);
        cell.value = normalized.value;

        if (normalized.numFmt) {
          cell.numFmt = normalized.numFmt;
        }

        cell.font = {
          name: "Calibri",
          size: 10.5,
          color: { argb: "FF0F172A" },
        };

        cell.alignment = normalized.alignment;

        // Alternating row background
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
    } catch {
      // Ignore boundary merge clashes
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
