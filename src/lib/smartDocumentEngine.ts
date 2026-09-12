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
 * Enhances contrast, converts to high-definition grayscale, and suppresses faint scanning noise.
 */
export function preprocessCanvasForOcr(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Grayscale & contrast stretch
  let minBrightness = 255;
  let maxBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
    if (lum < minBrightness) minBrightness = lum;
    if (lum > maxBrightness) maxBrightness = lum;
  }

  const range = Math.max(1, maxBrightness - minBrightness);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let lum = (0.299 * r + 0.587 * g + 0.114 * b) | 0;

    // Contrast stretching
    lum = Math.min(255, Math.max(0, (((lum - minBrightness) / range) * 255) | 0));

    // Dynamic thresholding: push faint background towards white, darken dark text
    if (lum > 185) {
      lum = 255;
    } else if (lum < 110) {
      lum = (lum * 0.7) | 0;
    }

    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }

  ctx.putImageData(imgData, 0, 0);
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
  if (onProgress) onProgress(20, "Preprocessing image & running OCR detection...");

  const imgBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = imgBitmap.width;
  canvas.height = imgBitmap.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(imgBitmap, 0, 0);
    preprocessCanvasForOcr(canvas);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const worker = await createWorker("eng");
  const ret = await worker.recognize(dataUrl);
  await worker.terminate();

  const ocrItems: DetectedTextItem[] = [];
  const lines = (ret.data as any)?.lines || [];

  for (const line of lines) {
    const text = (line.text || "").trim();
    if (!text) continue;
    const box = line.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
    const x = Math.round(box.x0);
    const y = Math.round(box.y0);
    const width = Math.round(box.x1 - box.x0);
    const height = Math.round(box.y1 - box.y0);
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
    cells: string[];
    xPositions: number[];
  }
  let bufferedTableRows: TableRowCandidate[] = [];

  const flushBufferedTable = () => {
    if (bufferedTableRows.length >= 2) {
      // We have at least 2 rows of aligned tabular data
      const colCorridors = calculateColumnCorridors(bufferedTableRows);
      const headers = bufferedTableRows[0].cells;
      const rows = bufferedTableRows.slice(1).map((r) => r.cells);

      detectedTables.push({
        id: `table_${detectedTables.length + 1}`,
        title: currentSectionTitle !== "General Information" ? `${currentSectionTitle} Table` : undefined,
        headers,
        rows,
        columnCount: colCorridors.length || headers.length,
        rowCount: rows.length,
        isBordered: true,
      });
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

    // Check for Tabular Row pattern (multiple items with substantial horizontal spacing)
    const isTabularRow = checkIfTabularRow(line);

    if (isTabularRow && (mode === "auto" || mode === "table")) {
      // Line is part of a table
      const cells = extractLineCells(line);
      const xPositions = line.items.map((i) => i.x);
      bufferedTableRows.push({ y: line.y, cells, xPositions });
      continue;
    } else {
      flushBufferedTable();
    }

    // Check for Key-Value Form Fields (e.g. "Customer Code : 1002", "GSTIN : 24AAAAA...")
    // In multi-column invoice forms, there could be multiple pairs on the same line!
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
  if (line.items.length >= 3) {
    // Check if items have meaningful X spacing
    let distinctXCount = 0;
    for (let i = 1; i < line.items.length; i++) {
      if (line.items[i].x - line.items[i - 1].x > 35) {
        distinctXCount++;
      }
    }
    if (distinctXCount >= 2) return true;
  }

  // Check tab or 2+ whitespace delimiter
  const parts = line.text.split(/\s{2,}|\t|\|/);
  return parts.length >= 3 && !line.text.includes(" : ");
}

function extractLineCells(line: { items: DetectedTextItem[]; text: string }): string[] {
  if (line.items.length >= 2) {
    // Cluster close items within cell, separate on large gap
    const cells: string[] = [];
    let currentCellStr = "";
    let lastXEnd = -1;

    for (const it of line.items) {
      const itText = it.text.trim();
      if (!itText) continue;

      if (lastXEnd >= 0 && it.x - lastXEnd > 24) {
        if (currentCellStr) cells.push(currentCellStr.trim());
        currentCellStr = itText;
      } else {
        currentCellStr += (currentCellStr ? " " : "") + itText;
      }
      lastXEnd = it.x + it.width;
    }
    if (currentCellStr) cells.push(currentCellStr.trim());
    if (cells.length >= 2) return cells;
  }

  // Fallback to split on pipe, tab, or double space
  return line.text
    .split(/\s{2,}|\t|\|/)
    .map((c) => c.trim())
    .filter(Boolean);
}

function calculateColumnCorridors(rows: { xPositions: number[] }[]): number[] {
  const allX = rows.flatMap((r) => r.xPositions).sort((a, b) => a - b);
  const corridors: number[] = [];
  const clusterTolerance = 25;

  for (const x of allX) {
    const existing = corridors.find((c) => Math.abs(c - x) <= clusterTolerance);
    if (!existing) {
      corridors.push(x);
    }
  }

  return corridors.sort((a, b) => a - b);
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
  const matrix: string[][] = [];

  // If a detected table exists, place it as the centerpiece!
  if (tables.length > 0) {
    const mainTable = tables[0];
    matrix.push(mainTable.headers);
    for (const row of mainTable.rows) {
      matrix.push(row);
    }
    return matrix;
  }

  // If we have rich sections & fields (e.g. Invoicing / Customer form without large line items)
  if (fields.length > 0) {
    matrix.push(["Section", "Field Label", "Detected Value"]);
    for (const field of fields) {
      matrix.push([field.section || "General", field.label, field.value]);
    }
    return matrix;
  }

  // Fallback: structured lines
  return [["Document Content"], ["No structured tabular rows detected."]];
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
    primaryTableMatrix: [["Document Content"], ["Document contains no readable text."]],
    summaryMatrix: [["Category", "Label", "Value"]],
    fullText: sanitizeOcrText(fullText),
    stats: {
      sectionsCount: 0,
      fieldsCount: 0,
      tablesCount: 0,
      columnsCount: 1,
      rowsCount: 1,
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
  const wb = XLSX.utils.book_new();
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "PDFSun_Converted_Data";

  // Sheet 1: Main Tabular Data
  const mainGrid = analysis.primaryTableMatrix;
  const wsMain = createSafeFormattedWorksheet(mainGrid);
  const mainSheetName = analysis.tables.length > 0 ? "Table_Data" : "Document_Fields";
  XLSX.utils.book_append_sheet(wb, wsMain, mainSheetName);

  // Sheet 2: If we have structured key-value fields AND a table, provide the Form Fields Summary sheet
  if (analysis.tables.length > 0 && analysis.fields.length > 0) {
    const wsSummary = createSafeFormattedWorksheet(analysis.summaryMatrix);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Form_Details_Summary");
  }

  const bookType = outputFormat === "csv" ? "csv" : "xlsx";
  const outBuffer = XLSX.write(wb, { bookType, type: "array" });
  const finalName = `${baseName}.${outputFormat}`;

  return {
    bytes: new Uint8Array(outBuffer),
    fileName: finalName,
  };
}

function createSafeFormattedWorksheet(grid: string[][]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  if (!grid || grid.length === 0) return ws;

  const numRows = grid.length;
  const numCols = Math.max(...grid.map((r) => r.length), 1);
  const colMaxLengths: number[] = new Array(numCols).fill(12);

  for (let r = 0; r < numRows; r++) {
    const row = grid[r] || [];
    for (let c = 0; c < numCols; c++) {
      const rawVal = (row[c] || "").trim();
      const cellRef = XLSX.utils.encode_cell({ r, c });

      // Column width tracking
      if (rawVal.length > colMaxLengths[c]) {
        colMaxLengths[c] = Math.min(rawVal.length, 65);
      }

      // Check for Header row (r === 0): always keep as string
      if (r === 0) {
        ws[cellRef] = { t: "s", v: rawVal };
        continue;
      }

      // Safe Data Type Conversion:
      // Protect identifiers (GSTIN, PAN, Phone, Codes) from number loss
      const numericCheck = parseNumericCell(rawVal);

      if (numericCheck.isNumeric && numericCheck.numVal !== undefined) {
        ws[cellRef] = {
          t: "n",
          v: numericCheck.numVal,
          z: numericCheck.formatCode,
        };
      } else {
        ws[cellRef] = {
          t: "s",
          v: rawVal,
        };
      }
    }
  }

  // Bounding range
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: numRows - 1, c: numCols - 1 } });

  // Column auto-fit width padding
  ws["!cols"] = colMaxLengths.map((len) => ({ wch: Math.max(12, len + 3) }));

  // Enable visible gridlines and freeze top row
  ws["!views"] = [
    {
      showGridLines: true,
      state: "frozen",
      ySplit: 1,
      topLeftCell: "A2",
      activeCell: "A2",
    },
  ];

  return ws;
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
  if (onProgress) onProgress(20, "Extracting Word document text & structure...");

  const arrayBuffer = await file.arrayBuffer();
  let text = "";

  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value || "";
  } catch (err) {
    console.warn("Mammoth extraction fallback:", err);
    text = await file.text();
  }

  if (!text.trim()) {
    throw new Error(`The Word document "${file.name}" contains no readable text content.`);
  }

  if (onProgress) onProgress(60, "Formatting clean PDF layout & vector pages...");

  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const lines = text.split("\n");
  let y = 20;
  const pageHeight = 280;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text(file.name.replace(/\.[^/.]+$/, ""), 15, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 4;
      continue;
    }

    if (y > pageHeight) {
      doc.addPage();
      y = 20;
    }

    const isHeading =
      trimmed.length < 50 && (/^[A-Z0-9\s:_-]+$/.test(trimmed) || COMMON_SECTION_HEADINGS.some((h) => trimmed.toUpperCase().includes(h)));

    if (isHeading) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(trimmed, 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    } else {
      // Word wrap
      const wrapped = doc.splitTextToSize(trimmed, 180);
      for (const wLine of wrapped) {
        if (y > pageHeight) {
          doc.addPage();
          y = 20;
        }
        doc.text(wLine, 15, y);
        y += 5;
      }
    }
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "PDFSun_Word_Doc";
  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));

  if (onProgress) onProgress(100, "PDF conversion complete");

  return {
    bytes: pdfBytes,
    fileName: `${baseName}_Converted.pdf`,
  };
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
  expectedFormat: "pdf" | "docx" | "xlsx" | "csv" | "txt",
  fileName: string
): { isValid: boolean; byteLength: number; format: string } {
  if (!bytes) {
    throw new Error(`Output validation failed: generated output for ${fileName} is null or empty.`);
  }

  const byteLength =
    bytes instanceof Uint8Array ? bytes.byteLength : typeof bytes === "string" ? bytes.length : 0;

  if (byteLength < 100) {
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

    // Check DOCX / XLSX Magic Bytes (PK\x03\x04 Zip Archive)
    if (expectedFormat === "docx" || expectedFormat === "xlsx") {
      const isZipHeader = bytes[0] === 0x50 && bytes[1] === 0x4b;
      if (!isZipHeader) {
        throw new Error(`Output validation failed: output file is not a valid OpenXML ${expectedFormat.toUpperCase()} document.`);
      }
    }
  }

  return {
    isValid: true,
    byteLength,
    format: expectedFormat,
  };
}
