import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";
import { createWorker } from "tesseract.js";
import * as XLSX from "xlsx";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  HeadingLevel,
} from "docx";
import { jsPDF } from "jspdf";
import mammoth from "mammoth";
import { sanitizeOcrText } from "./pdfEngine";
import { generateEnterpriseExcel, verifyTableStructure, ensurePaddedMatrix } from "./enterpriseExcelGenerator";
import { convertWordToPdfEnterprise } from "./enterpriseWordToPdfEngine";

// Configure pdfjs worker if available in browser
if (typeof window !== "undefined" && !(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export type DetectionMode = "auto" | "table" | "fields";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName?: string;
  isBold?: boolean;
}

export interface DetectedField {
  section?: string;
  label: string;
  value: string;
  x?: number;
  y?: number;
}

export interface DetectedSection {
  title: string;
  level: number;
  y?: number;
  fields: DetectedField[];
  lines: string[];
}

export interface DetectedTable {
  id: string;
  title?: string;
  headers: string[];
  rows: string[][];
  columnCount: number;
  rowCount: number;
  isBordered?: boolean;
  box?: BoundingBox;
}

export interface SmartDocumentAnalysis {
  documentType: "native_text" | "scanned_image" | "mixed" | "form_tabular" | "prose";
  pageCount: number;
  ocrUsed: boolean;
  ocrEngine: "tesseract" | "native_hybrid" | "none";
  sections: DetectedSection[];
  fields: DetectedField[];
  tables: DetectedTable[];
  primaryTableMatrix: string[][];
  summaryMatrix: string[][];
  fullText: string;
  stats: {
    sectionsCount: number;
    fieldsCount: number;
    tablesCount: number;
    columnsCount: number;
    rowsCount: number;
    ocrPagesCount: number;
  };
}

// ---------------------------------------------------------------------------
// IDENTIFIER PROTECTION & DATA TYPE DETECTION
// ---------------------------------------------------------------------------

const IDENTIFIER_LABEL_REGEX =
  /(code|gstin|pan|vat|tin|tax id|inv|invoice|ro\s*no|challan|order|vehicle|reg\s*no|chassis|engine|phone|mobile|contact|aadhaar|uid|ssn|serial|pin\s*code|zip|ifsc|account|acc\s*no|policy|bill\s*no)/i;

const IDENTIFIER_VALUE_REGEX =
  /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|[A-Z]{5}[0-9]{4}[A-Z]{1}|[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{1,4}|0[0-9]{5,}|[A-Z0-9]{8,}|[0-9]{10,12})$/i;

/**
 * Checks if a value or field label represents an identifier that MUST be kept as text
 * to avoid losing leading zeroes or being corrupted by scientific notation.
 */
export function isIdentifierField(label: string = "", value: string = ""): boolean {
  const cleanVal = value.trim();
  const cleanLabel = label.trim();

  if (IDENTIFIER_LABEL_REGEX.test(cleanLabel)) return true;
  if (cleanVal.startsWith("0") && cleanVal.length > 1 && !cleanVal.includes(".")) return true;
  if (IDENTIFIER_VALUE_REGEX.test(cleanVal)) return true;
  if (/[a-zA-Z]/.test(cleanVal) && /[0-9]/.test(cleanVal) && cleanVal.length >= 4) return true;
  if (/^[0-9]{10}$/.test(cleanVal)) return true; // Standard 10-digit phone
  return false;
}

/**
 * Checks if a string is a numeric value suitable for Excel numeric cell typing
 */
export function parseNumericCell(val: string): { isNumeric: boolean; numVal?: number; formatCode?: string } {
  const clean = val.trim();
  if (!clean) return { isNumeric: false };
  if (isIdentifierField("", clean)) return { isNumeric: false };

  // Currency symbols stripping
  const currencyMatch = clean.match(/^([$€£₹¥])\s*([0-9,]+(\.[0-9]+)?)$/);
  if (currencyMatch) {
    const rawNum = Number(currencyMatch[2].replace(/,/g, ""));
    if (!isNaN(rawNum)) {
      const sym = currencyMatch[1];
      const formatCode = sym === "₹" ? "₹#,##0.00" : sym === "$" ? "$#,##0.00" : `${sym}#,##0.00`;
      return { isNumeric: true, numVal: rawNum, formatCode };
    }
  }

  // Pure number or comma-formatted integer/float
  const pureNumStr = clean.replace(/,/g, "");
  if (/^-?[0-9]+(\.[0-9]+)?$/.test(pureNumStr)) {
    const n = Number(pureNumStr);
    if (!isNaN(n)) {
      return {
        isNumeric: true,
        numVal: n,
        formatCode: clean.includes(".") ? "#,##0.00" : "#,##0",
      };
    }
  }

  // Percentage
  const pctMatch = clean.match(/^(-?[0-9]+(\.[0-9]+)?)\s*%$/);
  if (pctMatch) {
    const n = Number(pctMatch[1]) / 100;
    if (!isNaN(n)) {
      return { isNumeric: true, numVal: n, formatCode: "0.00%" };
    }
  }

  return { isNumeric: false };
}

// ---------------------------------------------------------------------------
// DOCUMENT PRE-PROCESSING (Contrast enhancement, deskew / grayscale)
// ---------------------------------------------------------------------------

/**
 * Pre-processes an HTML Canvas image for maximum OCR accuracy.
 * Enhances contrast with percentile stretching, converts to high-definition grayscale,
 * and applies a 3x3 unsharp mask sharpening convolution to restore blurry text from WhatsApp compression.
 */
export function preprocessCanvasForOcr(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Grayscale & luminosity histogram accumulation
  const hist = new Uint32Array(256);
  const gray = new Uint8Array(width * height);

  let p = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[p++] = lum;
    hist[lum]++;
  }

  // 2. Percentile-based contrast stretching (cuts 2% shadows/glare outliers)
  const totalPixels = width * height;
  const lowerThreshold = Math.floor(totalPixels * 0.02);
  const upperThreshold = Math.floor(totalPixels * 0.98);

  let acc = 0;
  let minBrightness = 0;
  let maxBrightness = 255;

  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= lowerThreshold) {
      minBrightness = i;
      break;
    }
  }

  acc = 0;
  for (let i = 255; i >= 0; i--) {
    acc += hist[i];
    if (acc >= totalPixels - upperThreshold) {
      maxBrightness = i;
      break;
    }
  }

  const range = Math.max(1, maxBrightness - minBrightness);

  // 3. Contrast normalization & dynamic thresholding
  p = 0;
  for (let i = 0; i < data.length; i += 4) {
    let lum = gray[p++];
    lum = Math.min(255, Math.max(0, Math.round(((lum - minBrightness) / range) * 255)));

    // Adaptive thresholding: push paper background to clean white, darken ink
    if (lum > 175) {
      lum = 255;
    } else if (lum < 120) {
      lum = Math.round(lum * 0.65);
    }

    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }

  ctx.putImageData(imgData, 0, 0);

  // 4. 3x3 Unsharp Sharpening Convolution pass (only on images larger than 100x100)
  if (width >= 100 && height >= 100) {
    const sharpImgData = ctx.getImageData(0, 0, width, height);
    const src = new Uint8Array(imgData.data);
    const dst = sharpImgData.data;

    // Convolution Kernel: [0, -1, 0; -1, 5, -1; 0, -1, 0]
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const top = ((y - 1) * width + x) * 4;
        const btm = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;

        const sharpVal = Math.min(
          255,
          Math.max(
            0,
            src[idx] * 5 - (src[top] + src[btm] + src[left] + src[right])
          )
        );

        dst[idx] = sharpVal;
        dst[idx + 1] = sharpVal;
        dst[idx + 2] = sharpVal;
      }
    }
    ctx.putImageData(sharpImgData, 0, 0);
  }
}

// ---------------------------------------------------------------------------
// SMART DOCUMENT ANALYSIS ENGINE (Layout + OCR + Tables + Forms)
// ---------------------------------------------------------------------------

const COMMON_SECTION_HEADINGS = [
  "CUSTOMER DETAILS",
  "VEHICLE DETAILS",
  "PRE INVOICE DETAILS",
  "INVOICE DETAILS",
  "BILL TO",
  "SHIP TO",
  "CLIENT INFORMATION",
  "TAX INVOICE",
  "INVOICE PARTICULARS",
  "PARTICULARS",
  "ITEM DESCRIPTION",
  "LABOUR CHARGES",
  "PARTS DETAILS",
  "TERMS & CONDITIONS",
  "TERMS AND CONDITIONS",
  "PAYMENT DETAILS",
  "BANK DETAILS",
  "SUMMARY",
  "TOTAL AMOUNT",
];

export async function analyzeDocumentStructure(
  file: File,
  mode: DetectionMode = "auto",
  onProgress?: (percent: number, msg: string) => void
): Promise<SmartDocumentAnalysis> {
  const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return analyzePdfStructure(file, mode, onProgress);
  } else {
    return analyzeImageStructure(file, mode, onProgress);
  }
}

async function analyzePdfStructure(
  file: File,
  mode: DetectionMode,
  onProgress?: (percent: number, msg: string) => void
): Promise<SmartDocumentAnalysis> {
  if (onProgress) onProgress(15, "Loading document stream & reading pages...");

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  let totalItemsCount = 0;
  let ocrUsed = false;
  let ocrPagesCount = 0;
  let fullText = "";
  const allPageItems: DetectedTextItem[][] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const pageProgress = 15 + Math.round((pageNum / pageCount) * 45);
    if (onProgress) onProgress(pageProgress, `Inspecting page ${pageNum} of ${pageCount}...`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const rawItems = textContent.items as any[];

    let pageTextLength = 0;
    const pageItems: DetectedTextItem[] = [];

    for (const item of rawItems) {
      const str = (item.str || "").trim();
      if (!str) continue;
      pageTextLength += str.length;

      // Coordinates normalization: PDF y=0 is bottom, convert to top-down
      const x = Math.round(item.transform[4]);
      const rawY = item.transform[5];
      const y = Math.round(viewport.height - rawY);
      const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1])) || 10;
      const width = Math.round(item.width || fontSize * str.length * 0.6);
      const height = Math.round(item.height || fontSize);
      const fontName = item.fontName || "";
      const isBold = /bold|black|heavy|semibold/i.test(fontName);

      pageItems.push({
        text: item.str, // preserve original spacing
        x,
        y,
        width,
        height,
        fontSize,
        fontName,
        isBold,
      });
    }

    // SCANNED PAGE CHECK: If text is missing or extremely sparse (< 25 chars), apply OCR
    if (pageItems.length === 0 || pageTextLength < 25) {
      if (onProgress) onProgress(pageProgress + 5, `Page ${pageNum} is scanned: Running OCR layout detection...`);
      ocrUsed = true;
      ocrPagesCount++;

      const ocrItems = await performOcrOnPdfPage(page);
      pageItems.push(...ocrItems);
    }

    allPageItems.push(pageItems);
    totalItemsCount += pageItems.length;

    // Collect fullText
    const pText = pageItems.map((i) => i.text).join(" ");
    fullText += `\n--- Page ${pageNum} ---\n` + pText;
  }

  if (onProgress) onProgress(70, "Analyzing layout headings, columns & table corridors...");

  const flattenedItems = allPageItems.flat();
  const analysis = processItemsToDocumentStructure(flattenedItems, pageCount, ocrUsed, ocrPagesCount, fullText, mode);

  if (onProgress) onProgress(85, "Preserving identifiers & data types...");
  return analysis;
}

async function performOcrOnPdfPage(page: any): Promise<DetectedTextItem[]> {
  const scale = 2.0; // 150-200 DPI crisp rasterization
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;
  preprocessCanvasForOcr(canvas);

  const dataUrl = canvas.toDataURL("image/png");

  // Tier 1: Try AI Vision for high-accuracy tabular extraction
  try {
    const aiResp = await fetch("/api/ai/extract-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: dataUrl,
        mimeType: "image/png",
        fileName: "scanned_page.png",
      }),
    });
    if (aiResp.ok) {
      const aiData = await aiResp.json();
      if (aiData.success && Array.isArray(aiData.primaryMatrix) && aiData.primaryMatrix.length > 0) {
        const matrix: string[][] = aiData.primaryMatrix;
        const ocrItems: DetectedTextItem[] = [];
        const rowHeight = Math.round(viewport.height / Math.max(matrix.length, 10));
        const colWidth = Math.round(viewport.width / Math.max(...matrix.map((r) => r.length), 4));

        matrix.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            const cellText = String(cell || "").trim();
            if (!cellText) return;
            ocrItems.push({
              text: cellText,
              x: Math.round(cIdx * colWidth),
              y: Math.round(rIdx * rowHeight),
              width: colWidth - 10,
              height: rowHeight - 6,
              fontSize: rIdx === 0 ? 12 : 10,
              isBold: rIdx === 0,
            });
          });
        });

        if (ocrItems.length > 0) return ocrItems;
      }
    }
  } catch (e) {
    // Fall back silently to local Tesseract OCR
  }

  // Tier 2: Local Tesseract OCR
  const worker = await createWorker("eng");
  const ret = await worker.recognize(dataUrl);
  await worker.terminate();

  const ocrItems: DetectedTextItem[] = [];
  const lines = (ret.data as any)?.lines || [];

  for (const line of lines) {
    const text = (line.text || "").trim();
    if (!text) continue;
    const box = line.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
    const x = Math.round(box.x0 / scale);
    const y = Math.round(box.y0 / scale);
    const width = Math.round((box.x1 - box.x0) / scale);
    const height = Math.round((box.y1 - box.y0) / scale);
    const fontSize = Math.max(10, Math.round(height * 0.8));

    ocrItems.push({
      text,
      x,
      y,
      width,
      height,
      fontSize,
      isBold: /^[A-Z0-9\s:_-]+$/.test(text) && text.length < 50,
    });
  }

  return ocrItems;
}

async function analyzeImageStructure(
  file: File,
  mode: DetectionMode,
  onProgress?: (percent: number, msg: string) => void
): Promise<SmartDocumentAnalysis> {
  if (onProgress) onProgress(15, "Enhancing image resolution & sharpening edges...");

  const imgBitmap = await createImageBitmap(file);

  // 2x upscaling for low-res or mobile photos to prevent missing characters
  const minDimension = Math.min(imgBitmap.width, imgBitmap.height);
  const upscaleFactor = minDimension < 1000 ? Math.min(2.5, 1400 / minDimension) : 1.0;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imgBitmap.width * upscaleFactor);
  canvas.height = Math.round(imgBitmap.height * upscaleFactor);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
    preprocessCanvasForOcr(canvas);
  }

  const dataUrl = canvas.toDataURL("image/png");

  // Tier 1: Multimodal Vision Table Extraction (Gemini)
  if (onProgress) onProgress(35, "Scanning document table matrix with AI Vision...");
  try {
    const aiResp = await fetch("/api/ai/extract-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: dataUrl,
        mimeType: "image/png",
        fileName: file.name,
      }),
    });

    if (aiResp.ok) {
      const aiData = await aiResp.json();
      if (aiData.success && Array.isArray(aiData.primaryMatrix) && aiData.primaryMatrix.length > 0) {
        if (onProgress) onProgress(85, "Structuring multi-column tables & auto-fitting...");
        const matrix: string[][] = aiData.primaryMatrix;
        const detectedTables: DetectedTable[] = (aiData.tables && aiData.tables.length > 0)
          ? aiData.tables.map((t: any, idx: number) => ({
              id: `table_${idx + 1}`,
              title: t.title || undefined,
              headers: t.headers || matrix[0] || [],
              rows: t.rows || matrix.slice(1) || [],
              columnCount: (t.headers || matrix[0] || []).length,
              rowCount: (t.rows || matrix.slice(1) || []).length,
              isBordered: true,
            }))
          : [
              {
                id: "table_1",
                title: "Extracted Table",
                headers: matrix[0] || [],
                rows: matrix.slice(1) || [],
                columnCount: (matrix[0] || []).length,
                rowCount: Math.max(0, matrix.length - 1),
                isBordered: true,
              },
            ];

        const detectedFields: DetectedField[] = (aiData.keyValueFields || []).map((kv: any) => ({
          section: "Document Summary",
          label: kv.label || "Field",
          value: kv.value || "",
        }));

        return {
          documentType: "form_tabular",
          pageCount: 1,
          ocrUsed: true,
          ocrEngine: aiData.modelUsed || "gemini-vision",
          sections: [
            {
              title: "Table Data",
              level: 1,
              fields: detectedFields,
              lines: matrix.map((r) => r.join("  ")),
            },
          ],
          fields: detectedFields,
          tables: detectedTables,
          primaryTableMatrix: matrix,
          summaryMatrix: constructSummaryFieldsMatrix([], detectedFields),
          fullText: matrix.map((r) => r.join("  ")).join("\n"),
          stats: {
            sectionsCount: 1,
            fieldsCount: detectedFields.length,
            tablesCount: detectedTables.length,
            columnsCount: Math.max(...matrix.map((r) => r.length), 1),
            rowsCount: matrix.length,
            ocrPagesCount: 1,
          },
        };
      }
    }
  } catch (e) {
    console.warn("[analyzeImageStructure] Server AI extraction fallback to optical OCR:", e);
  }

  // Tier 2: Local Optical OCR (Tesseract) with Bounding Boxes & Dynamic Corridors
  if (onProgress) onProgress(50, "Executing precision OCR layout & bounding box analysis...");
  const worker = await createWorker("eng");
  const ret = await worker.recognize(dataUrl);
  await worker.terminate();

  const ocrItems: DetectedTextItem[] = [];
  const lines = (ret.data as any)?.lines || [];

  for (const line of lines) {
    const text = (line.text || "").trim();
    if (!text) continue;
    const box = line.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
    const x = Math.round(box.x0 / upscaleFactor);
    const y = Math.round(box.y0 / upscaleFactor);
    const width = Math.round((box.x1 - box.x0) / upscaleFactor);
    const height = Math.round((box.y1 - box.y0) / upscaleFactor);
    const fontSize = Math.max(10, Math.round(height * 0.8));

    ocrItems.push({
      text,
      x,
      y,
      width,
      height,
      fontSize,
      isBold: /^[A-Z0-9\s:_-]+$/.test(text) && text.length < 50,
    });
  }

  const fullText = ret.data.text || "";
  return processItemsToDocumentStructure(ocrItems, 1, true, 1, fullText, mode);
}

// ---------------------------------------------------------------------------
// SPATIAL GROUPING & HEADING / FIELD / TABLE PARSER
// ---------------------------------------------------------------------------

function processItemsToDocumentStructure(
  items: DetectedTextItem[],
  pageCount: number,
  ocrUsed: boolean,
  ocrPagesCount: number,
  fullText: string,
  mode: DetectionMode
): SmartDocumentAnalysis {
  if (items.length === 0) {
    return createEmptyAnalysis(pageCount, ocrUsed, fullText);
  }

  // 1. Calculate median font size for relative heading thresholding
  const fontSizes = items.map((i) => i.fontSize).filter((s) => s > 0).sort((a, b) => a - b);
  const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 11;

  // 2. Line clustering: group items that sit on roughly the same horizontal baseline
  items.sort((a, b) => a.y - b.y || a.x - b.x);

  interface ClusteredLine {
    y: number;
    items: DetectedTextItem[];
    text: string;
    isHeadingCandidate: boolean;
  }

  const lines: ClusteredLine[] = [];
  let currentLine: ClusteredLine | null = null;
  const yTolerance = 5; // tolerance for baseline alignment

  for (const item of items) {
    if (!currentLine || Math.abs(item.y - currentLine.y) > yTolerance) {
      if (currentLine) {
        currentLine.items.sort((a, b) => a.x - b.x);
        currentLine.text = currentLine.items.map((i) => i.text.trim()).filter(Boolean).join("  ");
        lines.push(currentLine);
      }
      currentLine = {
        y: item.y,
        items: [item],
        text: item.text,
        isHeadingCandidate: false,
      };
    } else {
      currentLine.items.push(item);
    }
  }

  if (currentLine) {
    currentLine.items.sort((a, b) => a.x - b.x);
    currentLine.text = currentLine.items.map((i) => i.text.trim()).filter(Boolean).join("  ");
    lines.push(currentLine);
  }

  // 3. Classify lines: Heading vs Table Row vs Form Key-Values vs Prose
  const sections: DetectedSection[] = [];
  const allFields: DetectedField[] = [];
  const detectedTables: DetectedTable[] = [];

  let currentSectionTitle = "General Information";
  let currentSectionFields: DetectedField[] = [];
  let currentSectionLines: string[] = [];

  // Table buffering
  interface TableRowCandidate {
    y: number;
    items: DetectedTextItem[];
    rawText: string;
  }
  let bufferedTableRows: TableRowCandidate[] = [];

  const flushBufferedTable = () => {
    if (bufferedTableRows.length >= 2) {
      // 1. Detect dynamic column corridors using precision X coordinate mapping
      const colStarts = calculatePrecisionColumnCorridors(bufferedTableRows);

      if (colStarts.length >= 2) {
        const mappedRows: string[][] = [];
        for (const r of bufferedTableRows) {
          mappedRows.push(mapItemsToColumnCorridors(r.items, colStarts));
        }

        const headers = mappedRows[0];
        const dataRows = mappedRows.slice(1);

        detectedTables.push({
          id: `table_${detectedTables.length + 1}`,
          title: currentSectionTitle !== "General Information" ? `${currentSectionTitle} Table` : undefined,
          headers,
          rows: dataRows,
          columnCount: colStarts.length,
          rowCount: dataRows.length,
          isBordered: true,
        });
      } else {
        // Stream table fallback: split on whitespace/tab/pipe delimiters
        const parsedRows = bufferedTableRows.map((r) => splitStreamLine(r.rawText));
        const maxCols = Math.max(...parsedRows.map((pr) => pr.length), 1);
        if (maxCols >= 2) {
          const paddedRows = parsedRows.map((r) => {
            const rowCopy = [...r];
            while (rowCopy.length < maxCols) rowCopy.push("");
            return rowCopy;
          });
          detectedTables.push({
            id: `table_${detectedTables.length + 1}`,
            title: currentSectionTitle !== "General Information" ? `${currentSectionTitle} Table` : undefined,
            headers: paddedRows[0],
            rows: paddedRows.slice(1),
            columnCount: maxCols,
            rowCount: paddedRows.length - 1,
            isBordered: true,
          });
        }
      }
    }
    bufferedTableRows = [];
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineText = line.text.trim();
    if (!lineText) continue;

    // Check if line matches a major Section Heading
    const isHeading =
      COMMON_SECTION_HEADINGS.some((h) => lineText.toUpperCase().includes(h)) ||
      (line.items[0]?.fontSize > medianFontSize * 1.2 && lineText.length < 60) ||
      (line.items[0]?.isBold && /^[A-Z0-9\s:_-]{3,50}$/.test(lineText));

    if (isHeading && !lineText.includes(" : ") && !lineText.endsWith(":")) {
      flushBufferedTable();

      // Save previous section
      if (currentSectionFields.length > 0 || currentSectionLines.length > 0) {
        sections.push({
          title: currentSectionTitle,
          level: 1,
          fields: [...currentSectionFields],
          lines: [...currentSectionLines],
        });
      }

      currentSectionTitle = lineText.replace(/[:_-]+$/, "").trim();
      currentSectionFields = [];
      currentSectionLines = [];
      continue;
    }

    // Check for Tabular Row pattern (multiple items with horizontal spacing or delimiters)
    const isTabularRow = checkIfTabularRow(line);

    if (isTabularRow && (mode === "auto" || mode === "table")) {
      bufferedTableRows.push({ y: line.y, items: line.items, rawText: lineText });
      continue;
    } else {
      flushBufferedTable();
    }

    // Check for Key-Value Form Fields (e.g. "Customer Code : 1002", "GSTIN : 24AAAAA...")
    const fieldsOnLine = extractFieldsFromLine(line, currentSectionTitle);
    if (fieldsOnLine.length > 0 && (mode === "auto" || mode === "fields")) {
      for (const field of fieldsOnLine) {
        currentSectionFields.push(field);
        allFields.push(field);
      }
      currentSectionLines.push(lineText);
    } else {
      currentSectionLines.push(lineText);
    }
  }

  flushBufferedTable();

  // Save trailing section
  if (currentSectionFields.length > 0 || currentSectionLines.length > 0) {
    sections.push({
      title: currentSectionTitle,
      level: 1,
      fields: currentSectionFields,
      lines: currentSectionLines,
    });
  }

  // 4. Build Primary Table Matrix for instant preview & spreadsheet export
  const primaryTableMatrix = constructPrimaryTableMatrix(sections, detectedTables, allFields);
  const summaryMatrix = constructSummaryFieldsMatrix(sections, allFields);

  const documentType =
    detectedTables.length > 0 && allFields.length > 0
      ? "form_tabular"
      : detectedTables.length > 0
      ? "form_tabular"
      : ocrUsed
      ? "scanned_image"
      : "native_text";

  const totalCols = Math.max(
    ...primaryTableMatrix.map((r) => r.length),
    detectedTables[0]?.columnCount || 1
  );
  const totalRows = primaryTableMatrix.length;

  return {
    documentType,
    pageCount,
    ocrUsed,
    ocrEngine: ocrUsed ? "tesseract" : "none",
    sections,
    fields: allFields,
    tables: detectedTables,
    primaryTableMatrix,
    summaryMatrix,
    fullText: sanitizeOcrText(fullText),
    stats: {
      sectionsCount: sections.length,
      fieldsCount: allFields.length,
      tablesCount: detectedTables.length,
      columnsCount: totalCols,
      rowsCount: totalRows,
      ocrPagesCount,
    },
  };
}

// ---------------------------------------------------------------------------
// PARSER HELPERS: TABULAR & KEY-VALUE DETECTION
// ---------------------------------------------------------------------------

function checkIfTabularRow(line: { items: DetectedTextItem[]; text: string }): boolean {
  if (line.items.length >= 2) {
    let distinctXCount = 0;
    for (let i = 1; i < line.items.length; i++) {
      if (line.items[i].x - line.items[i - 1].x > 28) {
        distinctXCount++;
      }
    }
    if (distinctXCount >= 1) return true;
  }

  // Check tab, pipe, or 2+ whitespace delimiter
  const parts = splitStreamLine(line.text);
  return parts.length >= 2 && !line.text.includes(" : ");
}

function calculatePrecisionColumnCorridors(rows: { items: DetectedTextItem[] }[]): number[] {
  const allX = rows.flatMap((r) => r.items.map((it) => it.x)).sort((a, b) => a - b);
  if (allX.length === 0) return [];

  const corridors: number[] = [];
  const clusterTolerance = 22;

  for (const x of allX) {
    const existingIdx = corridors.findIndex((c) => Math.abs(c - x) <= clusterTolerance);
    if (existingIdx === -1) {
      corridors.push(x);
    } else {
      corridors[existingIdx] = Math.min(corridors[existingIdx], x);
    }
  }

  return corridors.sort((a, b) => a - b);
}

function mapItemsToColumnCorridors(items: DetectedTextItem[], colStarts: number[]): string[] {
  const cells: string[] = new Array(colStarts.length).fill("");
  if (colStarts.length === 0) return cells;

  const sortedItems = [...items].sort((a, b) => a.x - b.x);

  for (const it of sortedItems) {
    const text = it.text.trim();
    if (!text) continue;

    // Find best corridor (rightmost whose start <= it.x + tolerance)
    let bestCol = 0;
    for (let c = colStarts.length - 1; c >= 0; c--) {
      if (it.x >= colStarts[c] - 12) {
        bestCol = c;
        break;
      }
    }

    cells[bestCol] = cells[bestCol] ? `${cells[bestCol]} ${text}` : text;
  }

  return cells;
}

function splitStreamLine(text: string): string[] {
  if (text.includes("\t")) {
    return text.split("\t").map((s) => s.trim());
  }
  if (text.includes("|")) {
    return text
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return text
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extracts key-value field pairs from a line (handles multi-column layout on same row)
 */
function extractFieldsFromLine(
  line: { items: DetectedTextItem[]; text: string; y: number },
  currentSectionTitle: string
): DetectedField[] {
  const text = line.text;
  const fields: DetectedField[] = [];

  // 1. Split on colon pairs (e.g. "Customer Code : 1029    Vehicle No : MH04AB1234")
  if (text.includes(":")) {
    const colonSegments = text.split(/\s{2,}/);
    for (const seg of colonSegments) {
      if (seg.includes(":")) {
        const [label, ...valParts] = seg.split(":");
        const cleanLabel = label.trim();
        const cleanVal = valParts.join(":").trim();
        if (cleanLabel.length >= 2 && cleanLabel.length <= 40) {
          fields.push({
            section: currentSectionTitle,
            label: cleanLabel,
            value: cleanVal,
            y: line.y,
          });
        }
      }
    }
    if (fields.length > 0) return fields;
  }

  // 2. Check for known label prefixes (e.g. "GSTIN 24AAAA...", "PAN ABCDE1234F")
  const knownPrefixes = ["GSTIN", "PAN", "RO NO", "DATE", "INV NO", "INVOICE NO", "MOBILE", "PHONE"];
  for (const prefix of knownPrefixes) {
    const regex = new RegExp(`\\b(${prefix})\\s*[:\\-]?\\s*([A-Z0-9\\/-]+)`, "i");
    const m = text.match(regex);
    if (m) {
      fields.push({
        section: currentSectionTitle,
        label: m[1].toUpperCase(),
        value: m[2],
        y: line.y,
      });
    }
  }

  return fields;
}

function constructPrimaryTableMatrix(
  sections: DetectedSection[],
  tables: DetectedTable[],
  fields: DetectedField[]
): string[][] {
  // If detected tables exist, place primary table as the centerpiece!
  if (tables.length > 0) {
    const mainTable = tables[0];
    const matrix: string[][] = [mainTable.headers, ...mainTable.rows];
    return ensurePaddedMatrix(matrix);
  }

  // If we have rich sections & fields (e.g. Invoicing / Customer form without large line items)
  if (fields.length > 0) {
    const matrix: string[][] = [["Section", "Field Label", "Detected Value"]];
    for (const field of fields) {
      matrix.push([field.section || "General Details", field.label, field.value]);
    }
    return matrix;
  }

  // If sections have structured lines, parse lines into multi-column table
  const lineRows: string[][] = [];
  for (const sec of sections) {
    for (const l of sec.lines) {
      const parts = splitStreamLine(l);
      if (parts.length >= 2) {
        lineRows.push(parts);
      } else if (l.trim()) {
        lineRows.push([sec.title || "Content", l.trim()]);
      }
    }
  }

  if (lineRows.length > 0) {
    const maxCols = Math.max(...lineRows.map((r) => r.length));
    const padded = lineRows.map((r) => {
      const rowCopy = [...r];
      while (rowCopy.length < maxCols) rowCopy.push("");
      return rowCopy;
    });
    // Create header row
    const headers = Array.from({ length: maxCols }, (_, i) => `Column ${String.fromCharCode(65 + i)}`);
    return ensurePaddedMatrix([headers, ...padded]);
  }

  return [["Document Item", "Processing Status", "Details"], ["Document Upload", "Completed", "Processed with Document Analysis Engine"]];
}

function constructSummaryFieldsMatrix(sections: DetectedSection[], fields: DetectedField[]): string[][] {
  const matrix: string[][] = [["Section / Category", "Label / Identifier", "Extracted Value"]];
  for (const f of fields) {
    matrix.push([f.section || "General Details", f.label, f.value]);
  }
  return matrix;
}

function createEmptyAnalysis(pageCount: number, ocrUsed: boolean, fullText: string): SmartDocumentAnalysis {
  return {
    documentType: "prose",
    pageCount,
    ocrUsed,
    ocrEngine: ocrUsed ? "tesseract" : "none",
    sections: [],
    fields: [],
    tables: [],
    primaryTableMatrix: [["Document Item", "Processing Status", "Details"], ["Document Upload", "Completed", "Document parsed successfully"]],
    summaryMatrix: [["Category", "Label", "Value"]],
    fullText: sanitizeOcrText(fullText),
    stats: {
      sectionsCount: 0,
      fieldsCount: 0,
      tablesCount: 0,
      columnsCount: 3,
      rowsCount: 2,
      ocrPagesCount: ocrUsed ? 1 : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// EXCEL (.XLSX) CONVERSION WITH DATA TYPE & IDENTIFIER PRESERVATION
// ---------------------------------------------------------------------------

export async function convertToSmartExcel(
  analysis: SmartDocumentAnalysis,
  fileName: string,
  outputFormat: "xlsx" | "csv" = "xlsx"
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "PDFSun_Converted_Data";
  const mainGrid = ensurePaddedMatrix(analysis.primaryTableMatrix);

  // Optional audit warning
  const verification = verifyTableStructure(mainGrid);
  if (verification.warnings.length > 0) {
    console.warn("[PDFSun Document Engine] Table layout warning:", verification.warnings);
  }

  if (outputFormat === "csv") {
    const csvContent = mainGrid
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
    return {
      bytes: encoder.encode("\uFEFF" + csvContent), // UTF-8 BOM for universal Excel compatibility
      fileName: `${baseName}.csv`,
    };
  }

  // Enterprise OpenXML .xlsx generation with exceljs
  const additionalSheets: Array<{ sheetName: string; matrix: any[][] }> = [];
  if (analysis.tables.length > 1) {
    for (let i = 1; i < analysis.tables.length; i++) {
      const tbl = analysis.tables[i];
      const sheetName = (tbl.title || `Table_${i + 1}`).slice(0, 31).replace(/[:\/\\?*\[\]]/g, "_");
      additionalSheets.push({
        sheetName,
        matrix: ensurePaddedMatrix([tbl.headers, ...tbl.rows]),
      });
    }
  } else if (analysis.tables.length > 0 && analysis.fields.length > 0) {
    additionalSheets.push({
      sheetName: "Form_Details_Summary",
      matrix: ensurePaddedMatrix(analysis.summaryMatrix),
    });
  }

  const bytes = await generateEnterpriseExcel(mainGrid, {
    sheetName: analysis.tables.length > 0 ? "Table_Data" : "Document_Data",
    headerFillColor: "FF1E293B", // Dark Navy Header
    headerTextColor: "FFFFFFFF", // Bold White Text
    fontFamily: "Calibri",
    fontSize: 11,
    showGridLines: true,
    freezeHeader: true,
    additionalSheets,
  });

  return {
    bytes,
    fileName: `${baseName}.xlsx`,
  };
}

// ---------------------------------------------------------------------------
// WORD (.DOCX) CONVERSION WITH REAL HEADINGS, TABLES & STYLED STRUCTURE
// ---------------------------------------------------------------------------

export async function convertToSmartWordDocx(
  analysis: SmartDocumentAnalysis,
  fileName: string
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "PDFSun_Converted_Word";
  const docElements: (Paragraph | DocxTable)[] = [];

  // Document Title Header
  docElements.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: baseName.replace(/_/g, " "),
          bold: true,
          size: 34,
          color: "1E3A8A",
        }),
      ],
      spacing: { after: 240 },
    })
  );

  // Render Sections & Fields
  for (const section of analysis.sections) {
    // Section Heading
    docElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            size: 26,
            color: "0F172A",
          }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );

    // Form fields in this section: render as a clean 2-column or 3-column key-value table
    if (section.fields.length > 0) {
      const fieldRows: TableRow[] = [];

      for (let i = 0; i < section.fields.length; i += 2) {
        const f1 = section.fields[i];
        const f2 = section.fields[i + 1];

        const cells: TableCell[] = [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${f1.label}: `, bold: true, size: 20, color: "334155" }),
                  new TextRun({ text: f1.value, size: 20 }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ];

        if (f2) {
          cells.push(
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${f2.label}: `, bold: true, size: 20, color: "334155" }),
                    new TextRun({ text: f2.value, size: 20 }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            })
          );
        } else {
          cells.push(
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [] })],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            })
          );
        }

        fieldRows.push(new TableRow({ children: cells }));
      }

      docElements.push(
        new DocxTable({
          rows: fieldRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      docElements.push(new Paragraph({ children: [], spacing: { after: 140 } }));
    }

    // Normal paragraph lines in section
    for (const line of section.lines) {
      if (line.length > 0 && !line.includes(" : ")) {
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Render Detected Tables as genuine Word Tables
  for (const table of analysis.tables) {
    if (table.headers.length === 0 && table.rows.length === 0) continue;

    if (table.title) {
      docElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: table.title, bold: true, size: 24, color: "1E40AF" })],
          spacing: { before: 200, after: 100 },
        })
      );
    }

    const tableRows: TableRow[] = [];
    const colCount = Math.max(table.headers.length, 1);
    const colWidthPct = Math.floor(100 / colCount);

    // Header Row with Navy Blue Background and White Text
    const headerCells = table.headers.map(
      (headerText) =>
        new TableCell({
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: "1E3A8A" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: headerText, bold: true, color: "FFFFFF", size: 20 })],
            }),
          ],
        })
    );
    tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

    // Data Rows with subtle alternating colors
    for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
      const rowData = table.rows[rIdx];
      const isAlt = rIdx % 2 === 1;

      const dataCells: TableCell[] = [];
      for (let cIdx = 0; cIdx < colCount; cIdx++) {
        const val = rowData[cIdx] || "";
        dataCells.push(
          new TableCell({
            width: { size: colWidthPct, type: WidthType.PERCENTAGE },
            shading: isAlt ? { type: ShadingType.CLEAR, fill: "F8FAFC" } : undefined,
            children: [
              new Paragraph({
                children: [new TextRun({ text: val, size: 20 })],
              }),
            ],
          })
        );
      }
      tableRows.push(new TableRow({ children: dataCells }));
    }

    docElements.push(
      new DocxTable({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    docElements.push(new Paragraph({ children: [], spacing: { after: 180 } }));
  }

  const docxDoc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: docElements,
      },
    ],
  });

  const blob = await Packer.toBlob(docxDoc);
  const buffer = await blob.arrayBuffer();

  return {
    bytes: new Uint8Array(buffer),
    fileName: `${baseName}.docx`,
  };
}

// ---------------------------------------------------------------------------
// WORD TO PDF (.PDF) CONVERSION
// ---------------------------------------------------------------------------

export async function convertWordToPdfSmart(
  file: File,
  onProgress?: (percent: number, msg: string) => void
): Promise<{ bytes: Uint8Array; fileName: string }> {
  return await convertWordToPdfEnterprise(file, {
    preset: "max_accuracy",
    onProgress: (p, msg) => {
      if (onProgress) onProgress(p, msg);
    },
  });
}

// ---------------------------------------------------------------------------
// EXCEL TO PDF (.PDF) CONVERSION
// ---------------------------------------------------------------------------

export async function convertExcelToPdfSmart(
  file: File,
  onProgress?: (percent: number, msg: string) => void
): Promise<{ bytes: Uint8Array; fileName: string }> {
  if (onProgress) onProgress(20, "Reading Excel workbook worksheets...");

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (workbook.SheetNames.length === 0) {
    throw new Error(`Excel file "${file.name}" has no readable sheets.`);
  }

  if (onProgress) onProgress(50, "Calculating column geometry & auto-fit layout...");

  // Scan first sheet to determine landscape vs portrait
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const firstSheetData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  const maxCols = Math.max(...firstSheetData.map((r) => (r ? r.length : 0)), 1);

  // If more than 5 columns, landscape provides significantly better readability
  const orientation = maxCols > 5 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  const pageWidth = orientation === "landscape" ? 297 : 210;
  const pageHeight = orientation === "landscape" ? 210 : 297;
  const margin = 12;
  const printableWidth = pageWidth - margin * 2;

  let isFirstSheet = true;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length === 0) continue;

    if (!isFirstSheet) {
      doc.addPage();
    }
    isFirstSheet = false;

    let y = 18;

    // Sheet Header Banner
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text(`Sheet: ${sheetName}`, margin, y);
    y += 8;

    const numCols = Math.max(...rows.map((r) => (r ? r.length : 0)), 1);
    const colWidth = Math.max(18, Math.floor(printableWidth / numCols));

    // Render Table
    doc.setFontSize(8);

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx] || [];
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 15;
      }

      const isHeader = rIdx === 0;

      // Row background
      if (isHeader) {
        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y - 4, printableWidth, 6.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
      } else {
        if (rIdx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 4, printableWidth, 6.5, "F");
        }
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "normal");
      }

      for (let cIdx = 0; cIdx < numCols; cIdx++) {
        const val = String(row[cIdx] ?? "").trim();
        const cellX = margin + cIdx * colWidth;
        const truncated = val.length > 25 ? val.substring(0, 23) + "…" : val;
        doc.text(truncated, cellX + 1.5, y);
      }

      y += 6.5;
    }
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "PDFSun_Excel_Sheet";
  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));

  if (onProgress) onProgress(100, "Spreadsheet converted to PDF");

  return {
    bytes: pdfBytes,
    fileName: `${baseName}_Converted.pdf`,
  };
}

// ---------------------------------------------------------------------------
// OUTPUT QUALITY VALIDATOR
// ---------------------------------------------------------------------------

export function validateConversionOutput(
  bytes: Uint8Array | string,
  expectedFormat: "pdf" | "docx" | "xlsx" | "pptx" | "csv" | "txt" | "rtf",
  fileName: string
): { isValid: boolean; byteLength: number; format: string } {
  if (!bytes) {
    throw new Error(`Output validation failed: generated output for ${fileName} is null or empty.`);
  }

  const byteLength =
    bytes instanceof Uint8Array ? bytes.byteLength : typeof bytes === "string" ? bytes.length : 0;

  if (byteLength < 50) {
    throw new Error(`Output validation failed: generated ${expectedFormat.toUpperCase()} file is truncated (${byteLength} bytes).`);
  }

  if (bytes instanceof Uint8Array) {
    // Check PDF Magic Bytes (%PDF-)
    if (expectedFormat === "pdf") {
      const header = String.fromCharCode(...bytes.slice(0, 5));
      if (!header.startsWith("%PDF")) {
        throw new Error(`Output validation failed: output file is not a valid PDF header.`);
      }
    }

    // Check DOCX / XLSX / PPTX Magic Bytes (PK\x03\x04 Zip Archive)
    if (expectedFormat === "docx" || expectedFormat === "xlsx" || expectedFormat === "pptx") {
      const isZipHeader = bytes[0] === 0x50 && bytes[1] === 0x4b;
      if (!isZipHeader) {
        throw new Error(`Output validation failed: output file is not a valid OpenXML ${expectedFormat.toUpperCase()} document.`);
      }
    }

    // Check RTF Magic Header ({\rtf)
    if (expectedFormat === "rtf") {
      const header = String.fromCharCode(...bytes.slice(0, 5));
      if (!header.startsWith("{\\rtf")) {
        throw new Error(`Output validation failed: output file is not a valid RTF document.`);
      }
    }
  }

  return {
    isValid: true,
    byteLength,
    format: expectedFormat,
  };
}
