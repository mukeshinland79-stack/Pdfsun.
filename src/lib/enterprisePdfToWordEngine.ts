/**
 * PDFSun Enterprise PDF to Word (.docx) Reconstruction Engine
 *
 * Enterprise Architecture & Reconstruction Pipeline:
 * 1. Text, Vector & Media Extraction Engine (pdf.js + 2D Affine CTM):
 *    - Extracts text tokens with coordinates, fonts, weights, and splits fixed-space multi-column strings.
 *    - Extracts PDF vector horizontal/vertical table rules, borders & header fill shading boxes.
 *    - Extracts ALL positioned images (logos, e-invoice/UPI QR codes, signatures, stamps) preserving real aspect ratio.
 * 2. 4 Intelligent Reconstruction Modes:
 *    - Mode A (High-Fidelity Editable DOCX): Genuine editable Word text, headings, native tables, headers/footers.
 *    - Mode B (Advanced Layout & Financial Precision): Fixed-grid OOXML table widths, borders, vector box shading.
 *    - Mode C (Scanned Document OCR): WASM OCR with preprocessing, table recovery, confidence scoring & warnings.
 *    - Mode D (Hybrid Auto): Per-page/per-region native + OCR fusion without flattening native text pages into images.
 * 3. Universal Table & Invoice Reconstruction:
 *    - Vector-rule + data-corridor column solver, stacked 2-line & multi-word header merging, universal row grouping,
 *      numeric right-alignment, <w:tblGrid> explicit column widths, cantSplit & tableHeader pagination repeat.
 * 4. Real Post-Conversion OOXML Verification & Self-Correction Retry:
 *    - Inspects compiled ZIP/XML parts via validateDocxPackageDeep; audits REAL extracted <w:t> XML text
 *      and automatically retries fallback layout strategy if critical defects occur.
 */

import * as pdfjsLib from "pdfjs-dist";
import { ensurePdfJsWorkerConfigured } from "./pdfjsWorkerSetup";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow,
  TableCell,
  TableLayoutType,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  HeadingLevel,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  VerticalAlign,
  PageOrientation,
} from "docx";
import { createWorker } from "tesseract.js";
import { createSafeCanvas } from "./enterpriseImageOcrEngine";
import {
  detectDocumentProfile,
  classifyTableSemantics,
  DocumentClassificationResult,
  DocumentProfileKey,
  DOCUMENT_PROFILES,
} from "./financialDocumentIntelligence";
import {
  auditFinancialDocxIntegrity,
  FinancialQualityAuditReport,
} from "./financialDataIntegrityEngine";
import {
  classifyGlobalDocument,
  GlobalClassificationResult,
  GlobalCategoryKey,
} from "./globalDocumentClassifier";
import {
  analyzePdfTechnicalStructure,
  TechnicalStructureAnalysis,
  PdfStructuralClass,
} from "./documentStructureAnalyzer";
import {
  validateDocxPackageDeep,
  DocxQualityAuditReport,
} from "./docxQualityValidator";
import {
  extractPageVectorAndMedia,
  findOptimalVerticalGutter,
  ExtractedPdfImage,
  HorizontalRule,
  PageVectorAndMedia,
  VerticalRule,
} from "./pdfToWordGeometry";

// ---------------------------------------------------------------------------
// SAFE RUNTIME SHIMS FOR PDFJS-DIST v6+ ACROSS BROWSERS, WORKERS & NODE
// ---------------------------------------------------------------------------

if (typeof (Promise as any).try !== "function") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      try {
        resolve(fn(...args));
      } catch (err) {
        reject(err);
      }
    });
  };
}

if (typeof (Uint8Array.prototype as any).toHex !== "function") {
  (Uint8Array.prototype as any).toHex = function (this: Uint8Array) {
    let hex = "";
    for (let i = 0; i < this.length; i++) {
      hex += this[i].toString(16).padStart(2, "0");
    }
    return hex;
  };
}

if (typeof (Map.prototype as any).getOrInsertComputed !== "function") {
  (Map.prototype as any).getOrInsertComputed = function <K, V>(
    this: Map<K, V>,
    key: K,
    callbackFn: (key: K) => V
  ): V {
    if (this.has(key)) return this.get(key) as V;
    const value = callbackFn(key);
    this.set(key, value);
    return value;
  };
}

if (typeof (WeakMap.prototype as any).getOrInsertComputed !== "function") {
  (WeakMap.prototype as any).getOrInsertComputed = function <K extends object, V>(
    this: WeakMap<K, V>,
    key: K,
    callbackFn: (key: K) => V
  ): V {
    if (this.has(key)) return this.get(key) as V;
    const value = callbackFn(key);
    this.set(key, value);
    return value;
  };
}

// Configure local Vite-bundled pdf.js worker in browser & Web Worker (no CDN dependency)
ensurePdfJsWorkerConfigured(pdfjsLib);

export type ReconstructionMode =
  | "editable_word"
  | "visual_fidelity"
  | "advanced_layout"
  | "scanned_ocr"
  | "hybrid_auto";

export type PdfToWordPreset =
  | "editable_word"
  | "financial_fidelity"
  | "visual_fidelity"
  | "advanced_layout"
  | "scanned_ocr"
  | "hybrid_auto"
  | "max_accuracy"
  | "high_speed"
  | "compact_vector"
  | "semantic_layout"
  | "vector_flow"
  | "compact_document";

export type LayoutDetectionMode = "auto" | "table" | "flow" | "invoice" | "fields";

export interface PdfToWordOptions {
  preset?: PdfToWordPreset;
  reconstructionMode?: ReconstructionMode;
  documentProfile?: DocumentProfileKey;
  detectionMode?: LayoutDetectionMode;
  preserveTables?: boolean;
  preserveImages?: boolean;
  enableOcrFallback?: boolean;
  dpiQuality?: 150 | 300;
  onProgress?: (percent: number, statusMsg: string) => void;
}

export interface SpatialTextToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  page: number;
}

export interface ReconstructedLine {
  y: number;
  xStart: number;
  xEnd: number;
  tokens: SpatialTextToken[];
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  page: number;
  columnIdx?: number;
}

export type HeadingLevelType = (typeof HeadingLevel)[keyof typeof HeadingLevel];
export type AlignmentTypeValue = (typeof AlignmentType)[keyof typeof AlignmentType];

export interface ReconstructedParagraph {
  type: "heading" | "body" | "bullet" | "numbered" | "table" | "header_footer" | "image";
  level?: HeadingLevelType;
  lines: ReconstructedLine[];
  text: string;
  isBold: boolean;
  fontSize: number;
  alignment: AlignmentTypeValue;
  page: number;
  image?: ExtractedPdfImage;
  tableData?: {
    headers: string[];
    rows: string[][];
    colWidthsPct: number[];
    colRightAligned?: boolean[];
    isBorderless?: boolean;
    headerStyle?: "navy" | "clean" | "borderless";
    headerFillHex?: string;
    borderColorHex?: string;
  };
}

export interface PerPageConversionSummary {
  pageNumber: number;
  mode: "native" | "ocr" | "hybrid";
  ocrConfidence?: number;
  imagesExtracted: number;
  tablesDetected: number;
  widthPt: number;
  heightPt: number;
  orientation: "portrait" | "landscape";
}

export interface PdfToWordResult {
  bytes: Uint8Array;
  fileName: string;
  stats: {
    pagesCount: number;
    wordCount: number;
    paragraphsCount: number;
    tablesCount: number;
    headingsCount: number;
    ocrPagesCount: number;
    imagesCount?: number;
    detectedTitle: string;
    previewSnippet: string;
    reconstructionMode?: ReconstructionMode;
    layoutFidelityScore?: number;
    isInvoiceDetected?: boolean;
    globalCategory?: GlobalCategoryKey;
    globalCategoryName?: string;
    structuralClass?: PdfStructuralClass;
  };
  classification?: DocumentClassificationResult;
  globalClassification?: GlobalClassificationResult;
  technicalStructure?: TechnicalStructureAnalysis;
  qualityAudit?: FinancialQualityAuditReport;
  docxQualityReport?: DocxQualityAuditReport;
  reconstructionMode?: ReconstructionMode;
  perPageSummary?: PerPageConversionSummary[];
  warnings?: string[];
}

interface PageExtractedData {
  pageNum: number;
  width: number;
  height: number;
  tokens: SpatialTextToken[];
  vectorMedia: PageVectorAndMedia;
  modeUsed: "native" | "ocr" | "hybrid";
  ocrConfidence?: number;
}

// ---------------------------------------------------------------------------
// SECURITY & PDF HEADER VALIDATION
// ---------------------------------------------------------------------------

function validatePdfBinaryInput(buffer: ArrayBuffer): void {
  if (!buffer || buffer.byteLength < 16) {
    throw new Error("Invalid PDF input: File is empty or too small to be a valid PDF document.");
  }
  const probe = new Uint8Array(buffer, 0, Math.min(1024, buffer.byteLength));
  const headerStr = new TextDecoder("latin1").decode(probe);
  if (!headerStr.includes("%PDF-")) {
    throw new Error("Invalid PDF format: Missing %PDF- binary file signature.");
  }
}

/**
 * Checks if extracted tokens represent an invoice, bill, receipt or commercial financial statement
 */
export function checkIfTokensRepresentInvoice(tokens: SpatialTextToken[]): boolean {
  if (tokens.length < 4) return false;
  const fullText = tokens.map((t) => t.text).join(" ").toLowerCase();
  const invoiceKeywords = [
    "tax invoice",
    "invoice no",
    "invoice number",
    "invoice date",
    "billed to",
    "bill to",
    "sold by",
    "supplier",
    "gstin",
    "pan",
    "hsn",
    "sac",
    "taxable value",
    "subtotal",
    "amount in words",
    "total amount",
    "grand total",
    "place of supply",
    "bank details",
    "bank name",
    "ifsc",
    "purchase order",
    "commercial invoice",
    "retail invoice",
    "proforma",
    "debit note",
    "credit note",
    "challan",
    "withdrawal",
    "closing balance",
    "statement of account",
  ];
  let matches = 0;
  for (const kw of invoiceKeywords) {
    if (fullText.includes(kw)) matches++;
  }
  return matches >= 2;
}

/**
 * Splits fixed-width multi-space strings emitted as a single PDF text run into clean column tokens,
 * while leaving regular single-spaced prose intact.
 */
function normalizePdfTextItems(
  rawItems: any[],
  viewportHeight: number,
  pageNum: number
): SpatialTextToken[] {
  const pageTokens: SpatialTextToken[] = [];

  for (const item of rawItems) {
    const rawStr = typeof item?.str === "string" ? item.str : "";
    if (!rawStr.trim()) continue;

    const baseX = Math.round(item.transform?.[4] || 0);
    const rawY = item.transform?.[5] || 0;
    const y = Math.round(viewportHeight - rawY);
    const fontSize = Math.max(6, Math.round(Math.hypot(item.transform?.[0] || 0, item.transform?.[1] || 0)) || 10);
    const totalWidth = Math.max(4, Math.round(item.width || fontSize * rawStr.length * 0.55));
    const height = Math.max(6, Math.round(item.height || fontSize));
    const fontName = item.fontName || "";
    const isBold = /bold|black|heavy|semibold|demi|700|800|900/i.test(fontName);
    const isItalic = /italic|oblique/i.test(fontName);

    // Split ONLY when 2+ consecutive spaces act as column alignment tabs inside one string
    const multiSpaceParts = rawStr.split(/(\s{2,})/);
    if (multiSpaceParts.length >= 3 && rawStr.trim().length > 4) {
      let charCursor = 0;
      const totalChars = Math.max(1, rawStr.length);
      let emittedParts = 0;

      for (const seg of multiSpaceParts) {
        if (seg.trim().length > 0 && !/^\s+$/.test(seg)) {
          const trimLead = seg.length - seg.trimStart().length;
          const clean = seg.trim();
          const startIdx = charCursor + trimLead;
          const segX = Math.round(baseX + (startIdx / totalChars) * totalWidth);
          const segW = Math.max(6, Math.round((clean.length / totalChars) * totalWidth));

          pageTokens.push({
            text: clean,
            x: segX,
            y,
            width: segW,
            height,
            fontSize,
            fontName,
            isBold,
            isItalic,
            page: pageNum,
          });
          emittedParts++;
        }
        charCursor += seg.length;
      }

      if (emittedParts > 0) continue;
    }

    pageTokens.push({
      text: rawStr,
      x: baseX,
      y,
      width: totalWidth,
      height,
      fontSize,
      fontName,
      isBold,
      isItalic,
      page: pageNum,
    });
  }

  return pageTokens;
}

// ---------------------------------------------------------------------------
// ZONE-BASED INVOICE & FINANCIAL DOCUMENT RECONSTRUCTOR
// ---------------------------------------------------------------------------

function mergeAdjacentTokensForColumnHeaders(
  rawHeaderTokens: SpatialTextToken[],
  verticalLines: VerticalRule[],
  headerY: number
): SpatialTextToken[] {
  const sorted = [...rawHeaderTokens].sort((a, b) => a.x - b.x);
  if (sorted.length <= 1) return sorted;

  const activeVerts = verticalLines
    .filter((v) => headerY >= v.y1 - 8 && headerY <= v.y2 + 8)
    .map((v) => v.x);

  const merged: SpatialTextToken[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    const prevRight = prev.x + prev.width;
    const gap = curr.x - prevRight;

    const separatedByRule = activeVerts.some((vx) => vx > prevRight - 2 && vx < curr.x + 2);
    const maxJoinGap = Math.max(7, Math.min(11, (prev.fontSize || 9) * 0.85));

    if (!separatedByRule && gap <= maxJoinGap) {
      prev.text = `${prev.text} ${curr.text}`.replace(/\s+/g, " ").trim();
      prev.width = Math.max(prev.width, curr.x + curr.width - prev.x);
      prev.isBold = prev.isBold || curr.isBold;
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}

/**
 * Checks whether line[1] is actually the second line of a stacked column header (e.g. "Taxable\nValue")
 */
function isStackedHeaderContinuation(
  headerLine: ReconstructedLine,
  candidateLine: ReconstructedLine
): boolean {
  const dy = candidateLine.y - headerLine.y;
  if (dy <= 0 || dy > Math.max(18, headerLine.fontSize * 1.65)) return false;

  const text = candidateLine.text.trim();
  if (!text) return false;

  // Reject if candidate starts with a serial number or contains currency amounts or HSN codes
  if (/^[0-9]+[.)]?\s/.test(text) || /^[0-9]+$/.test(candidateLine.tokens[0]?.text || "")) return false;
  if (/[0-9]+\.[0-9]{2}/.test(text)) return false;
  if (/\b(?:84|85|87|99)[0-9]{4}\b/.test(text)) return false;

  const headerSubWords =
    /^(?:value|amount|amt|price|rate|no\.?|number|code|name|date|tax|%|inr|usd|qty|units|total|particulars|description|desc|\(%\)|\(inr\)|\(rs\)|cgst|sgst|igst|sac|hsn|disc)$/i;

  const matchingTokens = candidateLine.tokens.filter((t) =>
    t.text
      .split(/\s+/)
      .every((w) => headerSubWords.test(w.replace(/[:()]/g, "")) || w.length <= 4)
  );

  return (
    (candidateLine.isBold || matchingTokens.length >= candidateLine.tokens.length * 0.7) &&
    candidateLine.tokens.length <= Math.max(headerLine.tokens.length + 1, 6)
  );
}

/**
 * Intelligent Zone-Based Multi-Table Invoice Layout Reconstructor
 */
export function reconstructInvoicePageLayout(
  tokens: SpatialTextToken[],
  pageWidth: number,
  pageHeight: number,
  pageNum: number,
  options: PdfToWordOptions,
  pageImages: ExtractedPdfImage[] | { data: Uint8Array; width: number; height: number; x: number; y: number }[] = [],
  vectorGeometry?: { horizontalLines: HorizontalRule[]; verticalLines: VerticalRule[]; rects: any[] }
): (Paragraph | DocxTable)[] {
  const elements: (Paragraph | DocxTable)[] = [];
  const isVisualMode =
    options.preset === "visual_fidelity" ||
    options.preset === "advanced_layout" ||
    options.reconstructionMode === "visual_fidelity" ||
    options.reconstructionMode === "advanced_layout";

  const printableWidthDxa = Math.max(7200, Math.round(pageWidth * 20) - 1440); // 0.5in left+right margins
  const horizontalLines = vectorGeometry?.horizontalLines || [];
  const verticalLines = vectorGeometry?.verticalLines || [];

  const sortedTokens = [...tokens].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = clusterTokensIntoSimpleLines(sortedTokens, pageNum);

  if (lines.length === 0) return elements;

  // Normalize incoming image array cleanly for backward-compatible callers
  const normalizedImages: ExtractedPdfImage[] = (pageImages || []).map((img: any) => ({
    data: img.data,
    width: img.width || 100,
    height: img.height || 60,
    widthPt: img.widthPt || img.width || 100,
    heightPt: img.heightPt || img.height || 60,
    pixelWidth: img.pixelWidth || img.width || 100,
    pixelHeight: img.pixelHeight || img.height || 60,
    x: img.x ?? 0,
    y: img.y ?? 0,
    role: img.role || "logo",
    areaRatio: img.areaRatio || 0,
  })).filter((img) => img.role !== "full_page_scan" || tokens.length < 15);

  const headerImages = normalizedImages.filter((im) => im.role === "logo" || (im.role === "qr_or_seal" && im.y < pageHeight * 0.42));
  const summaryImages = normalizedImages.filter((im) => im.role === "qr_or_seal" && im.y >= pageHeight * 0.42 && im.y <= pageHeight * 0.80);
  const footerImages = normalizedImages.filter((im) => im.role === "signature_or_stamp" || (im.role === "qr_or_seal" && im.y > pageHeight * 0.80));
  const bodyImages = normalizedImages.filter(
    (im) => !headerImages.includes(im) && !summaryImages.includes(im) && !footerImages.includes(im)
  );

  // 1. Detect ALL Table Headers on the Page (Multi-Table Awareness + stacked header skip)
  const tableHeaderIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (isLineInvoiceTableHeader(l, pageWidth)) {
      if (tableHeaderIndices.length === 0 || i > tableHeaderIndices[tableHeaderIndices.length - 1] + 1) {
        tableHeaderIndices.push(i);
        if (i + 1 < lines.length && isStackedHeaderContinuation(l, lines[i + 1])) {
          i++; // skip second line of stacked header from triggering another header
        }
      }
    }
  }

  // 2. Locate Summary Start Line (Amount in words, Bank details, Grand Total)
  let summaryStartLineIdx = -1;
  const lastHeaderIdx = tableHeaderIndices.length > 0 ? tableHeaderIndices[tableHeaderIndices.length - 1] : -1;
  const searchStart = lastHeaderIdx !== -1 ? lastHeaderIdx + 1 : 0;

  for (let i = searchStart; i < lines.length; i++) {
    const l = lines[i];
    const textLower = l.text.toLowerCase();
    const isTableSummaryMarker =
      (textLower.includes("bank") &&
        (textLower.includes("account") || textLower.includes("details") || textLower.includes("name") || textLower.includes("ifsc") || textLower.includes("a/c"))) ||
      textLower.includes("amount in words") ||
      textLower.includes("total taxable") ||
      textLower.includes("grand total") ||
      textLower.includes("invoice total") ||
      textLower.includes("net amount") ||
      textLower.includes("total estimated value") ||
      (textLower.includes("subtotal") && l.tokens.length <= 4 && !/cgst|sgst|igst/i.test(textLower));

    if (isTableSummaryMarker) {
      summaryStartLineIdx = i;
      break;
    }
  }

  // 3. Partition Content Zones
  const headerLines: ReconstructedLine[] = [];
  const partyTokens: SpatialTextToken[] = [];
  const vehicleLines: ReconstructedLine[] = [];
  const summaryTokens: SpatialTextToken[] = [];
  const footerLines: ReconstructedLine[] = [];

  interface TableBlock {
    titleLine?: ReconstructedLine;
    lines: ReconstructedLine[];
  }
  const tableBlocks: TableBlock[] = [];

  const firstHeaderIdx = tableHeaderIndices.length > 0 ? tableHeaderIndices[0] : -1;

  if (firstHeaderIdx !== -1) {
    for (let i = 0; i < firstHeaderIdx; i++) {
      const l = lines[i];
      const isHeaderTitle =
        i <= 1 &&
        (/tax invoice|bill of supply|commercial invoice|retail invoice|proforma|annexure|quotation|purchase order|statement|credit note|debit note|receipt/i.test(l.text) ||
          (l.fontSize >= 13 && !/sold by|billed to|supplier|details|gstin/i.test(l.text)));

      if (isHeaderTitle && !/gstin|sold by|billed to/i.test(l.text.toLowerCase())) {
        headerLines.push(l);
      } else if (isVehicleMetadataLine(l)) {
        vehicleLines.push(l);
      } else {
        partyTokens.push(...l.tokens);
      }
    }

    for (let t = 0; t < tableHeaderIndices.length; t++) {
      const hIdx = tableHeaderIndices[t];
      const nextHIdx = t < tableHeaderIndices.length - 1 ? tableHeaderIndices[t + 1] : -1;
      const endLimit = nextHIdx !== -1 ? nextHIdx : summaryStartLineIdx !== -1 ? summaryStartLineIdx : lines.length;

      let titleLine: ReconstructedLine | undefined;
      if (hIdx > 0 && hIdx - 1 > (t > 0 ? tableHeaderIndices[t - 1] : firstHeaderIdx - 1)) {
        const prevLine = lines[hIdx - 1];
        if (
          prevLine.tokens.length <= 5 &&
          /labour|spare|parts|services|hsn|tax summary|consumables|annexure|charges|particulars/i.test(prevLine.text)
        ) {
          titleLine = prevLine;
        }
      }

      const tLines: ReconstructedLine[] = [];
      for (let i = hIdx; i < endLimit; i++) {
        const l = lines[i];
        if (nextHIdx !== -1 && i === nextHIdx - 1 && l.tokens.length <= 5 && /labour|parts|services|charges/i.test(l.text)) {
          continue;
        }
        // Check if this post-table line is actually Terms/Signatory footer even without a summary keyword match
        if (
          summaryStartLineIdx === -1 &&
          i > hIdx + 1 &&
          l.tokens.length <= 3 &&
          l.y > pageHeight * 0.72 &&
          /authorized signatory|declaration|terms & conditions|terms and conditions|customer acceptance/i.test(l.text)
        ) {
          footerLines.push(l);
          continue;
        }
        tLines.push(l);
      }

      if (tLines.length > 0) {
        tableBlocks.push({ titleLine, lines: tLines });
      }
    }

    if (summaryStartLineIdx !== -1) {
      for (let i = summaryStartLineIdx; i < lines.length; i++) {
        const l = lines[i];
        const isFooterCandidate =
          (/authorized signatory|declaration|terms & conditions|customer acceptance|signature/i.test(l.text) &&
            l.y > pageHeight * 0.68) ||
          /terms and conditions|loyalty acknowledgement|^for\s+[a-z0-9]/i.test(l.text);

        if (isFooterCandidate) {
          footerLines.push(l);
        } else {
          summaryTokens.push(...l.tokens);
        }
      }
    }
  } else {
    const candidateTableLines: ReconstructedLine[] = [];
    for (const l of lines) {
      const isFooter =
        (/authorized signatory|declaration|terms & conditions|terms and conditions/i.test(l.text) &&
          l.y > pageHeight * 0.74) ||
        /for\s+[a-z0-9].*(signatory|signature)/i.test(l.text);
      const isHeader = l.y < pageHeight * 0.16 && (l.fontSize >= 13 || /invoice|bill|statement|receipt|challan/i.test(l.text));

      if (isHeader && !/account no|gstin/i.test(l.text.toLowerCase())) {
        headerLines.push(l);
      } else if (isFooter) {
        footerLines.push(l);
      } else if (isVehicleMetadataLine(l)) {
        vehicleLines.push(l);
      } else if (l.tokens.length >= 3) {
        candidateTableLines.push(l);
      } else if (l.y > pageHeight * 0.65) {
        summaryTokens.push(...l.tokens);
      } else {
        partyTokens.push(...l.tokens);
      }
    }

    if (candidateTableLines.length >= 2) {
      tableBlocks.push({ lines: candidateTableLines });
    }
  }

  // ZONE 1: RECONSTRUCT HEADER (Logos, Title, Date, Top QR)
  if (headerImages.length > 0 || (headerLines.length > 0 && headerImages.length > 0)) {
    const leftLogos = headerImages.filter((im) => im.x < pageWidth * 0.55);
    const rightQrs = headerImages.filter((im) => im.x >= pageWidth * 0.55);

    if (leftLogos.length > 0 && rightQrs.length > 0) {
      // Side-by-side borderless header band preserving Logo left + QR right
      const halfW = Math.floor(printableWidthDxa / 2);
      elements.push(
        new DocxTable({
          layout: TableLayoutType.FIXED,
          columnWidths: [halfW, printableWidthDxa - halfW],
          width: { size: printableWidthDxa, type: WidthType.DXA },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: halfW, type: WidthType.DXA },
                  borders: borderNone(),
                  margins: { top: 0, bottom: 40, left: 0, right: 40 },
                  children: leftLogos.map(
                    (im) =>
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 20 },
                        children: [
                          new ImageRun({
                            data: im.data,
                            type: "png",
                            transformation: { width: im.width, height: im.height },
                          }),
                        ],
                      })
                  ),
                }),
                new TableCell({
                  width: { size: printableWidthDxa - halfW, type: WidthType.DXA },
                  borders: borderNone(),
                  margins: { top: 0, bottom: 40, left: 40, right: 0 },
                  children: rightQrs.map(
                    (im) =>
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 0, after: 20 },
                        children: [
                          new ImageRun({
                            data: im.data,
                            type: "png",
                            transformation: { width: im.width, height: im.height },
                          }),
                        ],
                      })
                  ),
                }),
              ],
            }),
          ],
        })
      );
    } else {
      for (const im of headerImages) {
        const align = im.x >= pageWidth * 0.55 ? AlignmentType.RIGHT : AlignmentType.LEFT;
        elements.push(
          new Paragraph({
            alignment: align,
            spacing: { before: 0, after: 40 },
            children: [
              new ImageRun({
                data: im.data,
                type: "png",
                transformation: { width: im.width, height: im.height },
              }),
            ],
          })
        );
      }
    }
  }

  for (const hl of headerLines) {
    const isTitle =
      hl.fontSize >= 12 || /tax invoice|proforma|invoice|annexure|statement|receipt|purchase order|quotation/i.test(hl.text);
    const lineCenter = (hl.xStart + hl.xEnd) / 2;
    const align =
      Math.abs(lineCenter - pageWidth / 2) < pageWidth * 0.16
        ? AlignmentType.CENTER
        : hl.xStart > pageWidth * 0.52
        ? AlignmentType.RIGHT
        : AlignmentType.LEFT;

    elements.push(
      new Paragraph({
        alignment: align,
        keepNext: true,
        spacing: { before: isTitle ? 30 : 0, after: 35 },
        children: [
          new TextRun({
            text: hl.text,
            bold: isTitle || hl.isBold,
            size: isTitle ? Math.max(22, Math.min(30, hl.fontSize * 2)) : 18,
            color: isTitle ? "1E3A8A" : "475569",
            font: detectOptimalFont(hl.text),
          }),
        ],
      })
    );
  }

  // ZONE 2: RECONSTRUCT TWO-COLUMN PARTY TABLE (Adaptive Whitespace Gutter!)
  if (partyTokens.length > 0) {
    const gutterX = findOptimalVerticalGutter(partyTokens, pageWidth, 0.34, 0.68);
    const partyLinesRaw = clusterTokensIntoSimpleLines(partyTokens, pageNum);

    const sellerTokens: SpatialTextToken[] = [];
    const buyerTokens: SpatialTextToken[] = [];

    for (const line of partyLinesRaw) {
      const leftPart = line.tokens.filter((t) => t.x + t.width * 0.35 < gutterX);
      const rightPart = line.tokens.filter((t) => t.x + t.width * 0.35 >= gutterX);

      if (leftPart.length > 0 && rightPart.length > 0) {
        sellerTokens.push(...leftPart);
        buyerTokens.push(...rightPart);
      } else if (line.tokens[0] && line.tokens[0].x >= gutterX) {
        buyerTokens.push(...line.tokens);
      } else {
        sellerTokens.push(...line.tokens);
      }
    }

    const sellerLines = clusterTokensIntoSimpleLines(sellerTokens, pageNum);
    const buyerLines = clusterTokensIntoSimpleLines(buyerTokens, pageNum);

    if (sellerLines.length > 0 && buyerLines.length > 0) {
      const leftRatio = Math.max(0.38, Math.min(0.62, gutterX / Math.max(1, pageWidth)));
      const leftColDxa = Math.round(printableWidthDxa * leftRatio);
      const rightColDxa = printableWidthDxa - leftColDxa;

      const partyTable = new DocxTable({
        layout: TableLayoutType.FIXED,
        columnWidths: [leftColDxa, rightColDxa],
        width: { size: printableWidthDxa, type: WidthType.DXA },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: leftColDxa, type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: isVisualMode ? "F8FAFC" : "FFFFFF" },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                },
                margins: { top: 55, bottom: 55, left: 90, right: 90 },
                children: sellerLines.map((sl, idx) => {
                  const isSectionHeader = idx === 0 || /sold by|supplier|from/i.test(sl.text);
                  const isCompanyName = idx === 1 || sl.isBold;
                  return new Paragraph({
                    spacing: { before: idx === 0 ? 0 : 8, after: 8, line: 220 },
                    children: [
                      new TextRun({
                        text: sl.text,
                        bold: isSectionHeader || isCompanyName || /gstin|pan|state|phone|email/i.test(sl.text),
                        size: isCompanyName ? 19 : 17,
                        color: isCompanyName ? "0F172A" : "334155",
                        font: detectOptimalFont(sl.text),
                      }),
                    ],
                  });
                }),
              }),
              new TableCell({
                width: { size: rightColDxa, type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: isVisualMode ? "F8FAFC" : "FFFFFF" },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                },
                margins: { top: 55, bottom: 55, left: 90, right: 90 },
                children: buyerLines.map((bl, idx) => {
                  const isSectionHeader = idx === 0 || /billed to|invoice details|buyer|recipient/i.test(bl.text);
                  const isKey = /invoice no|invoice date|due date|billed to|gstin|place of supply|reverse charge|p\.o\./i.test(bl.text);
                  return new Paragraph({
                    spacing: { before: idx === 0 ? 0 : 8, after: 8, line: 220 },
                    children: [
                      new TextRun({
                        text: bl.text,
                        bold: isSectionHeader || isKey || bl.isBold,
                        size: isSectionHeader || /billed to/i.test(bl.text) ? 19 : 17,
                        color: isSectionHeader ? "0F172A" : "334155",
                        font: detectOptimalFont(bl.text),
                      }),
                    ],
                  });
                }),
              }),
            ],
          }),
        ],
      });

      elements.push(partyTable);
    } else {
      // Single-column account/header metadata block (clean paragraphs, no fake empty column)
      const singleLines = sellerLines.length > 0 ? sellerLines : buyerLines;
      for (const sl of singleLines) {
        elements.push(
          new Paragraph({
            spacing: { before: 8, after: 12 },
            children: [
              new TextRun({
                text: sl.text,
                bold: sl.isBold || /account|gstin|ifsc|invoice no/i.test(sl.text),
                size: 18,
                color: "1E293B",
                font: detectOptimalFont(sl.text),
              }),
            ],
          })
        );
      }
    }
  }

  // ZONE 2B: VEHICLE & JOB CARD METADATA CARD TABLE
  if (vehicleLines.length > 0) {
    const vehicleTable = buildVehicleMetadataTable(vehicleLines, isVisualMode, printableWidthDxa);
    if (vehicleTable) {
      elements.push(vehicleTable);
    }
  }

  // ZONE 3: RECONSTRUCT ALL DETECTED TABLE BLOCKS
  for (const block of tableBlocks) {
    if (block.titleLine) {
      elements.push(
        new Paragraph({
          keepNext: true,
          spacing: { before: 45, after: 20 },
          children: [
            new TextRun({
              text: block.titleLine.text,
              bold: true,
              size: 20,
              color: "1E3A8A",
              font: detectOptimalFont(block.titleLine.text),
            }),
          ],
        })
      );
    }

    if (block.lines.length >= 2) {
      const gridTable = buildUnifiedInvoiceGridTable(
        block.lines,
        isVisualMode,
        printableWidthDxa,
        horizontalLines,
        verticalLines
      );
      if (gridTable) {
        elements.push(gridTable);
      }
    }
  }

  // Any inline body images inside invoice/body flow
  for (const im of bodyImages) {
    elements.push(
      new Paragraph({
        alignment: im.x > pageWidth * 0.55 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: 30, after: 30 },
        children: [
          new ImageRun({
            data: im.data,
            type: "png",
            transformation: { width: im.width, height: im.height },
          }),
        ],
      })
    );
  }

  // ZONE 4: RECONSTRUCT SUMMARY, BANK DETAILS & TOTALS (Line-aware & non-tearing)
  if (summaryTokens.length > 0 || summaryImages.length > 0) {
    const summaryRawLines = clusterTokensIntoSimpleLines(summaryTokens, pageNum);
    const gutterX = findOptimalVerticalGutter(summaryTokens, pageWidth, 0.35, 0.65);

    const bankTokens: SpatialTextToken[] = [];
    const totalTokens: SpatialTextToken[] = [];

    for (const sLine of summaryRawLines) {
      const lineLower = sLine.text.toLowerCase();
      const leftHalf = sLine.tokens.filter((t) => t.x < gutterX);
      const rightHalf = sLine.tokens.filter((t) => t.x >= gutterX);

      // If BOTH left (e.g. Bank details / Amount in words) and right (Subtotal / Grand Total) co-exist on same Y row
      if (leftHalf.length > 0 && rightHalf.length > 0) {
        const leftText = leftHalf.map((t) => t.text).join(" ").toLowerCase();
        const rightHasMoney = rightHalf.some((t) => /[0-9,]+\.[0-9]{2}/.test(t.text));
        const leftIsBankOrWords = /bank|ifsc|account|a\/c|branch|words|terms|conditions|notes|upi/i.test(leftText);
        const wholeLineIsSingleTotalPair =
          !leftIsBankOrWords &&
          rightHasMoney &&
          /subtotal|taxable|cgst|sgst|igst|grand total|invoice total|net amount|total|round off|discount|freight/i.test(leftText);

        if (wholeLineIsSingleTotalPair) {
          // Keep label + amount together on the Totals side!
          totalTokens.push(...sLine.tokens);
        } else {
          bankTokens.push(...leftHalf);
          totalTokens.push(...rightHalf);
        }
      } else if (/bank|ifsc|account|a\/c|branch|words|terms|conditions|notes/i.test(lineLower) || sLine.xStart < pageWidth * 0.35) {
        bankTokens.push(...sLine.tokens);
      } else {
        totalTokens.push(...sLine.tokens);
      }
    }

    const bankLines = clusterTokensIntoSimpleLines(bankTokens, pageNum);
    const totalLines = clusterTokensIntoSimpleLines(totalTokens, pageNum);

    if (bankLines.length > 0 || totalLines.length > 0 || summaryImages.length > 0) {
      const bankCellDxa = Math.round(printableWidthDxa * 0.55);
      const totalCellDxa = printableWidthDxa - bankCellDxa;

      const leftCellChildren: Paragraph[] = bankLines.map((bl, idx) => {
        const isTitle = idx === 0 || /bank|amount in words/i.test(bl.text);
        return new Paragraph({
          spacing: { before: 8, after: 8, line: 220 },
          children: [
            new TextRun({
              text: bl.text,
              bold: isTitle || bl.isBold,
              size: 17,
              color: "1E293B",
              font: detectOptimalFont(bl.text),
            }),
          ],
        });
      });

      for (const qImg of summaryImages) {
        leftCellChildren.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 30, after: 10 },
            children: [
              new ImageRun({
                data: qImg.data,
                type: "png",
                transformation: { width: qImg.width, height: qImg.height },
              }),
            ],
          })
        );
      }

      if (leftCellChildren.length === 0) {
        leftCellChildren.push(new Paragraph({ children: [new TextRun({ text: " ", size: 17 })] }));
      }

      const rightCellChildren: Paragraph[] =
        totalLines.length > 0
          ? totalLines.map((tl) => {
              const isGrandTotal = /invoice total|grand total|total amount|net payable|total payable/i.test(tl.text);
              return new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 8, after: 8, line: 220 },
                children: [
                  new TextRun({
                    text: tl.text,
                    bold: isGrandTotal || tl.isBold || /total|taxable|igst|cgst|sgst/i.test(tl.text),
                    size: isGrandTotal ? 20 : 17,
                    color: isGrandTotal ? "0F172A" : "334155",
                    font: detectOptimalFont(tl.text, true),
                  }),
                ],
              });
            })
          : [new Paragraph({ children: [new TextRun({ text: " ", size: 17 })] })];

      const summaryTable = new DocxTable({
        layout: TableLayoutType.FIXED,
        columnWidths: [bankCellDxa, totalCellDxa],
        width: { size: printableWidthDxa, type: WidthType.DXA },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: bankCellDxa, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                },
                margins: { top: 55, bottom: 55, left: 80, right: 80 },
                children: leftCellChildren,
              }),
              new TableCell({
                width: { size: totalCellDxa, type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: isVisualMode ? "F1F5F9" : "FFFFFF" },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                },
                margins: { top: 55, bottom: 55, left: 80, right: 80 },
                children: rightCellChildren,
              }),
            ],
          }),
        ],
      });

      elements.push(summaryTable);
    }
  }

  // ZONE 5: SIGNATURE IMAGES & FOOTER LINES
  for (const sImg of footerImages) {
    elements.push(
      new Paragraph({
        alignment: sImg.x >= pageWidth * 0.5 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: 30, after: 15 },
        children: [
          new ImageRun({
            data: sImg.data,
            type: "png",
            transformation: { width: sImg.width, height: sImg.height },
          }),
        ],
      })
    );
  }

  for (const fl of footerLines) {
    const isSignatory = /signatory|signature/i.test(fl.text);
    const isTermsHeading = /terms & conditions|terms and conditions|declaration/i.test(fl.text);

    elements.push(
      new Paragraph({
        alignment: isSignatory || fl.xStart > pageWidth * 0.5 ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: isTermsHeading ? 25 : 10, after: 12 },
        children: [
          new TextRun({
            text: fl.text,
            bold: fl.isBold || isSignatory || isTermsHeading,
            size: isTermsHeading ? 18 : 16,
            color: isTermsHeading ? "0F172A" : "475569",
            font: detectOptimalFont(fl.text),
          }),
        ],
      })
    );
  }

  return elements;
}

function borderNone() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
}

function isLineInvoiceTableHeader(l: ReconstructedLine, pageWidth: number): boolean {
  if (l.tokens.length < 3) return false;
  const textLower = l.text.toLowerCase();

  // Pattern A: Standard Parts / Goods / Products / Items
  const hasItemWord =
    textLower.includes("desc") ||
    textLower.includes("item") ||
    textLower.includes("particular") ||
    textLower.includes("part no") ||
    textLower.includes("partno") ||
    textLower.includes("part number") ||
    textLower.includes("product") ||
    textLower.includes("material") ||
    textLower.includes("narration");
  const hasMetricWord =
    textLower.includes("qty") ||
    textLower.includes("quantity") ||
    textLower.includes("rate") ||
    textLower.includes("tax") ||
    textLower.includes("hsn") ||
    textLower.includes("amount") ||
    textLower.includes("s.no") ||
    textLower.includes("sr.") ||
    textLower.includes("price") ||
    textLower.includes("mrp") ||
    textLower.includes("disc") ||
    textLower.includes("debit") ||
    textLower.includes("credit") ||
    textLower.includes("withdrawal") ||
    textLower.includes("deposit") ||
    textLower.includes("balance");

  if (hasItemWord && hasMetricWord) return true;

  // Pattern B: Labour / Services / Operations
  const hasLabourWord =
    textLower.includes("labour") ||
    textLower.includes("labor") ||
    textLower.includes("service") ||
    textLower.includes("operation") ||
    textLower.includes("work desc");
  const hasLabourMetric =
    textLower.includes("rate") ||
    textLower.includes("amount") ||
    textLower.includes("sac") ||
    textLower.includes("hrs") ||
    textLower.includes("tax") ||
    textLower.includes("total");

  if (hasLabourWord && hasLabourMetric) return true;

  // Pattern C: Tax Summary / HSN / SAC Breakdown Table
  const hasHsnWord = textLower.includes("hsn") || textLower.includes("sac");
  const hasTaxSummaryMetric =
    textLower.includes("taxable") ||
    textLower.includes("cgst") ||
    textLower.includes("sgst") ||
    textLower.includes("igst") ||
    (textLower.includes("rate") && (textLower.includes("tax") || textLower.includes("total")));

  if (hasHsnWord && hasTaxSummaryMetric) return true;

  // Pattern D: Bank ledger headers
  if (
    textLower.includes("date") &&
    (textLower.includes("balance") || textLower.includes("debit") || textLower.includes("withdrawal"))
  ) {
    return true;
  }

  // Pattern E: Wide Annexure / Multi-column detail table
  const spread = l.xEnd - l.xStart;
  if (l.tokens.length >= 4 && spread >= pageWidth * 0.45) {
    let kwHits = 0;
    const kwList = ["part", "no", "desc", "qty", "mrp", "rate", "disc", "taxable", "cgst", "sgst", "total", "amount", "hsn", "sac", "date", "balance"];
    for (const kw of kwList) {
      if (textLower.includes(kw)) kwHits++;
    }
    if (kwHits >= 3) return true;
  }

  return false;
}

function isVehicleMetadataLine(l: ReconstructedLine): boolean {
  const textLower = l.text.toLowerCase();
  const vehicleKeywords = [
    "chassis",
    "engine no",
    "engine number",
    "reg no",
    "reg. no",
    "registration",
    "model",
    "odometer",
    "km reading",
    "job card",
    "vin no",
    "vehicle no",
    "fuel type",
    "chassis no",
  ];
  let matches = 0;
  for (const kw of vehicleKeywords) {
    if (textLower.includes(kw)) matches++;
  }
  return matches >= 1;
}

function buildVehicleMetadataTable(
  lines: ReconstructedLine[],
  isVisualMode: boolean,
  printableWidthDxa: number
): DocxTable | null {
  if (lines.length === 0) return null;

  const tableRows: TableRow[] = [];
  let maxPairsPerRow = 1;

  const parsedLinesPairs = lines.map((line) => {
    const pairs: { key: string; val: string }[] = [];
    const tokens = [...line.tokens].sort((a, b) => a.x - b.x);
    let curKey = "";
    let curVal = "";
    let isReadingVal = false;

    for (const t of tokens) {
      if (t.text.includes(":") && !t.text.endsWith(":") && t.text.split(":").length === 2) {
        if (curKey) pairs.push({ key: curKey.trim(), val: curVal.trim() });
        const [k, v] = t.text.split(":");
        curKey = `${k.trim()}:`;
        curVal = v.trim();
        isReadingVal = true;
      } else if (t.text.endsWith(":") || /^[A-Z][a-z0-9\s/.-]+:$/.test(t.text)) {
        if (curKey && curVal) {
          pairs.push({ key: curKey.trim(), val: curVal.trim() });
          curKey = "";
          curVal = "";
        }
        curKey = t.text;
        isReadingVal = true;
      } else if (isReadingVal) {
        curVal += " " + t.text;
      } else {
        curKey += " " + t.text;
      }
    }
    if (curKey) pairs.push({ key: curKey.trim(), val: curVal.trim() });
    if (pairs.length >= 2) maxPairsPerRow = 2;
    return { line, pairs };
  });

  const colWidths =
    maxPairsPerRow === 2
      ? [
          Math.round(printableWidthDxa * 0.2),
          Math.round(printableWidthDxa * 0.3),
          Math.round(printableWidthDxa * 0.2),
          printableWidthDxa - Math.round(printableWidthDxa * 0.7),
        ]
      : [Math.round(printableWidthDxa * 0.3), printableWidthDxa - Math.round(printableWidthDxa * 0.3)];

  for (const { line, pairs } of parsedLinesPairs) {
    if (maxPairsPerRow === 2) {
      const p1 = pairs[0] || { key: line.text, val: "" };
      const p2 = pairs[1] || { key: " ", val: " " };
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: colWidths[0], type: WidthType.DXA },
              shading: isVisualMode ? { type: ShadingType.CLEAR, fill: "F1F5F9" } : undefined,
              margins: { top: 35, bottom: 35, left: 60, right: 60 },
              borders: thinGridBorder("E2E8F0"),
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: p1.key, bold: true, size: 17, color: "334155" })] })],
            }),
            new TableCell({
              width: { size: colWidths[1], type: WidthType.DXA },
              margins: { top: 35, bottom: 35, left: 60, right: 60 },
              borders: thinGridBorder("E2E8F0"),
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: p1.val || " ", size: 17, color: "0F172A" })] })],
            }),
            new TableCell({
              width: { size: colWidths[2], type: WidthType.DXA },
              shading: isVisualMode ? { type: ShadingType.CLEAR, fill: "F1F5F9" } : undefined,
              margins: { top: 35, bottom: 35, left: 60, right: 60 },
              borders: thinGridBorder("E2E8F0"),
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: p2.key, bold: true, size: 17, color: "334155" })] })],
            }),
            new TableCell({
              width: { size: colWidths[3], type: WidthType.DXA },
              margins: { top: 35, bottom: 35, left: 60, right: 60 },
              borders: thinGridBorder("E2E8F0"),
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: p2.val || " ", size: 17, color: "0F172A" })] })],
            }),
          ],
        })
      );
    } else {
      const p1 = pairs[0] || { key: line.text, val: "" };
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: colWidths[0], type: WidthType.DXA },
              shading: isVisualMode ? { type: ShadingType.CLEAR, fill: "F1F5F9" } : undefined,
              margins: { top: 35, bottom: 35, left: 60, right: 60 },
              borders: thinGridBorder("E2E8F0"),
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: p1.key, bold: true, size: 17, color: "334155" })] })],
            }),
            new TableCell({
              width: { size: colWidths[1], type: WidthType.DXA },
              margins: { top: 35, bottom: 35, left: 60, right: 60 },
              borders: thinGridBorder("E2E8F0"),
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: p1.val || " ", size: 17, color: "0F172A" })] })],
            }),
          ],
        })
      );
    }
  }

  return new DocxTable({
    layout: TableLayoutType.FIXED,
    columnWidths: colWidths,
    width: { size: printableWidthDxa, type: WidthType.DXA },
    rows: tableRows,
  });
}

function thinGridBorder(color: string) {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color },
    bottom: { style: BorderStyle.SINGLE, size: 1, color },
    left: { style: BorderStyle.SINGLE, size: 1, color },
    right: { style: BorderStyle.SINGLE, size: 1, color },
  };
}

/**
 * Reconstructs any invoice / ledger / tax summary / annexure grid with:
 * - Merged multi-word & stacked 2-line column headers
 * - Vector vertical & horizontal rule awareness
 * - Principled multi-signal row segmentation (works WITH or WITHOUT S.No.!)
 * - Explicit OOXML <w:tblGrid> DXA column widths & cantSplit pagination protection
 */
function buildUnifiedInvoiceGridTable(
  lines: ReconstructedLine[],
  isVisualMode: boolean,
  printableWidthDxa: number,
  horizontalLines: HorizontalRule[] = [],
  verticalLines: VerticalRule[] = []
): DocxTable | null {
  if (lines.length < 2) return null;

  const primaryHeaderLine = lines[0];
  let mergedHeaderTokens = mergeAdjacentTokensForColumnHeaders(
    primaryHeaderLine.tokens,
    verticalLines,
    primaryHeaderLine.y
  );

  // Check if line[1] is stacked second row of column headers
  let dataStartIdx = 1;
  if (lines.length >= 3 && isStackedHeaderContinuation(primaryHeaderLine, lines[1])) {
    const secondTokens = mergeAdjacentTokensForColumnHeaders(lines[1].tokens, verticalLines, lines[1].y);
    for (const st of secondTokens) {
      let bestCol = 0;
      let minDist = Infinity;
      const stCenter = st.x + st.width / 2;
      for (let c = 0; c < mergedHeaderTokens.length; c++) {
        const hcCenter = mergedHeaderTokens[c].x + mergedHeaderTokens[c].width / 2;
        const d = Math.abs(stCenter - hcCenter);
        if (d < minDist) {
          minDist = d;
          bestCol = c;
        }
      }
      if (minDist < 55) {
        mergedHeaderTokens[bestCol].text = `${mergedHeaderTokens[bestCol].text} ${st.text}`.trim();
        mergedHeaderTokens[bestCol].x = Math.min(mergedHeaderTokens[bestCol].x, st.x);
        mergedHeaderTokens[bestCol].width = Math.max(
          mergedHeaderTokens[bestCol].width,
          st.x + st.width - mergedHeaderTokens[bestCol].x
        );
      }
    }
    dataStartIdx = 2;
  }

  if (dataStartIdx >= lines.length) return null;

  const colCount = mergedHeaderTokens.length;
  const colStarts = mergedHeaderTokens.map((t) => t.x);
  const colEnds = mergedHeaderTokens.map((t) => t.x + Math.max(12, t.width));
  const headerTitles = mergedHeaderTokens.map((t) => t.text);

  // Deduce column interval corridors [boundLeft[c], boundRight[c]] using vertical vector rules or header midpoints
  const tableMinY = primaryHeaderLine.y - 6;
  const tableMaxY = lines[lines.length - 1].y + 12;
  const tableVertRules = verticalLines
    .filter((v) => v.y2 >= tableMinY && v.y1 <= tableMaxY && v.y2 - v.y1 >= 18)
    .map((v) => v.x)
    .sort((a, b) => a - b);

  // Filter strictly internal column divider rules between headers
  const internalDividers: number[] = [];
  for (let c = 0; c < colCount - 1; c++) {
    const hGapLeft = colStarts[c];
    const hGapRight = colStarts[c + 1];
    const matchingRule = tableVertRules.find((vx) => vx > hGapLeft + 4 && vx < hGapRight + 4);
    if (matchingRule !== undefined) {
      internalDividers.push(matchingRule);
    } else {
      // Midpoint between right edge of header C (or slight shift for right-aligned numbers) and left edge of header C+1
      const cMid = (colEnds[c] + colStarts[c + 1]) / 2;
      const startMid = (colStarts[c] + colStarts[c + 1]) / 2;
      internalDividers.push(Math.min(colStarts[c + 1] - 4, Math.max(cMid, startMid * 0.35 + cMid * 0.65)));
    }
  }

  const colBoundsLeft = colStarts.map((_, c) => (c === 0 ? -9999 : internalDividers[c - 1]));
  const colBoundsRight = colStarts.map((_, c) => (c === colCount - 1 ? 999999 : internalDividers[c]));

  // Refine right-aligned numeric column widths vs text columns
  const isWideAnnexure = colCount >= 8;
  const cellTopBottomPadding = isWideAnnexure ? 24 : 38;
  const cellLeftRightPadding = isWideAnnexure ? 32 : 55;
  const dataFontSize = isWideAnnexure ? 15 : 18;
  const headerFontSize = isWideAnnexure ? 16 : 18;
  const minColPct = isWideAnnexure ? 4 : 5;

  const rawWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    if (c < colCount - 1) {
      rawWidths.push(Math.max(18, colStarts[c + 1] - colStarts[c]));
    } else {
      rawWidths.push(Math.max(35, mergedHeaderTokens[c].width + 26));
    }
  }
  const totalRawWidth = Math.max(1, rawWidths.reduce((a, b) => a + b, 0));
  const colWidthsDxa = rawWidths.map((w) =>
    Math.max(Math.round((printableWidthDxa * minColPct) / 100), Math.round((w / totalRawWidth) * printableWidthDxa))
  );
  const sumDxa = colWidthsDxa.reduce((a, b) => a + b, 0);
  if (sumDxa !== printableWidthDxa && colWidthsDxa.length > 0) {
    // Adjust widest description column (or last) cleanly so sum matches printableWidthDxa to the exact twip
    let widestIdx = 0;
    for (let c = 1; c < colWidthsDxa.length; c++) {
      if (colWidthsDxa[c] > colWidthsDxa[widestIdx]) widestIdx = c;
    }
    colWidthsDxa[widestIdx] += printableWidthDxa - sumDxa;
  }

  const colIsNumeric = headerTitles.map((hTitle) =>
    /qty|quantity|rate|tax|total|amount|mrp|disc|value|debit|credit|withdrawal|deposit|balance|price|cgst|sgst|igst/i.test(
      hTitle
    )
  );

  const tableRows: TableRow[] = [];

  // Header row (repeats on multi-page overflow via tableHeader: true)
  tableRows.push(
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: headerTitles.map((hTitle, cIdx) => {
        const isNum = colIsNumeric[cIdx];
        return new TableCell({
          width: { size: colWidthsDxa[cIdx], type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          shading: isVisualMode ? { type: ShadingType.CLEAR, fill: "1E3A8A" } : { type: ShadingType.CLEAR, fill: "F1F5F9" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: isVisualMode ? "1E3A8A" : "CBD5E1" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: isVisualMode ? "1E3A8A" : "CBD5E1" },
            left: { style: BorderStyle.SINGLE, size: 1, color: isVisualMode ? "3B82F6" : "E2E8F0" },
            right: { style: BorderStyle.SINGLE, size: 1, color: isVisualMode ? "3B82F6" : "E2E8F0" },
          },
          margins: {
            top: cellTopBottomPadding,
            bottom: cellTopBottomPadding,
            left: cellLeftRightPadding,
            right: cellLeftRightPadding,
          },
          children: [
            new Paragraph({
              alignment: isNum ? AlignmentType.RIGHT : AlignmentType.LEFT,
              spacing: { before: 0, after: isWideAnnexure ? 0 : 4 },
              children: [
                new TextRun({
                  text: hTitle,
                  bold: true,
                  size: headerFontSize,
                  color: isVisualMode ? "FFFFFF" : "0F172A",
                  font: detectOptimalFont(hTitle, isNum),
                }),
              ],
            }),
          ],
        });
      }),
    })
  );

  // Estimate typical line leading among data lines
  const leadings: number[] = [];
  for (let i = dataStartIdx + 1; i < lines.length; i++) {
    const dy = lines[i].y - lines[i - 1].y;
    if (dy > 2 && dy < 45) leadings.push(dy);
  }
  leadings.sort((a, b) => a - b);
  const medianLeading = leadings.length > 0 ? leadings[Math.floor(leadings.length * 0.35)] : 14;

  let currentItemCells: string[][] = [];
  let hasItem = false;
  let currentRowHasNumericAmounts = false;

  function initEmptyRow(): string[][] {
    return Array.from({ length: colCount }, () => []);
  }

  function flushCurrentItem(rowIdx: number) {
    if (!hasItem) return;
    const isSummaryRow = currentItemCells.some((cLines) =>
      /\b(?:sub\s*total|cgst|sgst|igst|round\s*off|total\s*tax|freight|discount)\b/i.test(cLines.join(" "))
    );
    const isAlt = isVisualMode && rowIdx % 2 === 1 && !isSummaryRow;

    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: currentItemCells.map((cellLines, cIdx) => {
          const isNumCol = colIsNumeric[cIdx];
          const joined = cellLines.join(" ").trim();
          const cellLooksNum = /^[₹$€£-]?\s*[0-9,]+(\.[0-9]+)?%?$/.test(joined);
          const rightAlign = isNumCol || cellLooksNum;

          return new TableCell({
            width: { size: colWidthsDxa[cIdx], type: WidthType.DXA },
            shading: isSummaryRow
              ? { type: ShadingType.CLEAR, fill: "F1F5F9" }
              : isAlt
              ? { type: ShadingType.CLEAR, fill: "F8FAFC" }
              : undefined,
            borders: thinGridBorder("E2E8F0"),
            margins: {
              top: cellTopBottomPadding,
              bottom: cellTopBottomPadding,
              left: cellLeftRightPadding,
              right: cellLeftRightPadding,
            },
            children:
              cellLines.length > 0
                ? cellLines.map(
                    (lText, lIdx) =>
                      new Paragraph({
                        alignment: rightAlign ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        spacing: { before: 0, after: isWideAnnexure ? 0 : 4, line: isWideAnnexure ? 200 : 225 },
                        children: [
                          new TextRun({
                            text: lText,
                            bold: isSummaryRow,
                            size: lIdx === 0 ? dataFontSize : Math.max(14, dataFontSize - 1),
                            color: lIdx === 0 || isSummaryRow ? "0F172A" : "64748B",
                            font: detectOptimalFont(lText, rightAlign),
                          }),
                        ],
                      })
                  )
                : [new Paragraph({ children: [new TextRun({ text: " ", size: dataFontSize })] })],
          });
        }),
      })
    );
  }

  let rowCounter = 0;
  const lastLineIdxPerCol: number[] = new Array(colCount).fill(-1);

  for (let lIdx = dataStartIdx; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    const prevLine = lIdx > dataStartIdx ? lines[lIdx - 1] : null;
    const firstToken = line.tokens[0];

    const hasHorizDivider =
      prevLine !== null &&
      horizontalLines.some(
        (h) => h.y > prevLine.y + 1 && h.y < line.y - 1 && h.x2 - h.x1 >= 100
      );

    // Map tokens of this line onto columns to inspect column occupancy
    const matchedCols: number[] = line.tokens.map((t) => {
      const tCenter = t.x + Math.min(t.width, 28) * 0.45;
      for (let c = 0; c < colCount; c++) {
        if (tCenter >= colBoundsLeft[c] && tCenter < colBoundsRight[c]) return c;
      }
      let best = 0;
      let minDiff = Infinity;
      for (let c = 0; c < colCount; c++) {
        const diff = Math.abs(t.x - colStarts[c]);
        if (diff < minDiff) {
          minDiff = diff;
          best = c;
        }
      }
      return best;
    });

    const uniqueCols = new Set(matchedCols);
    const hasNumericOnLine = line.tokens.some((t, idx) => colIsNumeric[matchedCols[idx]] && /[0-9]/.test(t.text));
    const isSerialNum = firstToken && /^[0-9]{1,4}[.)]?$/.test(firstToken.text) && matchedCols[0] === 0;
    const isPartOrDateStart =
      firstToken &&
      matchedCols[0] === 0 &&
      (/^[A-Z0-9_-]{3,20}$/.test(firstToken.text) || /^[0-9]{1,2}[/-][0-9A-Za-z]{2,3}[/-][0-9]{2,4}$/.test(firstToken.text));
    const isMultiColumnLine = uniqueCols.size >= 2;
    const isExplicitTaxOrTotalLine =
      hasNumericOnLine &&
      /\b(?:sub\s*total|cgst|sgst|igst|utgst|cess|freight|discount|round\s*off|total)\b/i.test(line.text);
    const dyFromPrev = prevLine ? line.y - prevLine.y : 0;
    const hasRowGapJump = prevLine !== null && dyFromPrev > Math.max(18, medianLeading * 1.45) && currentRowHasNumericAmounts;

    // Wrapped continuation lines ONLY populate 1 text column with tight leading and no new numeric amount on a filled row
    const isWrappedContinuation =
      hasItem &&
      !hasHorizDivider &&
      !isSerialNum &&
      !isExplicitTaxOrTotalLine &&
      !hasRowGapJump &&
      !(isMultiColumnLine && hasNumericOnLine && currentRowHasNumericAmounts) &&
      uniqueCols.size === 1 &&
      !colIsNumeric[matchedCols[0]];

    const isNewItemStart =
      !hasItem ||
      (!isWrappedContinuation &&
        (hasHorizDivider ||
          isSerialNum ||
          isPartOrDateStart ||
          isExplicitTaxOrTotalLine ||
          (isMultiColumnLine && hasNumericOnLine) ||
          hasRowGapJump));

    if (isNewItemStart) {
      if (hasItem) {
        flushCurrentItem(rowCounter++);
      }
      currentItemCells = initEmptyRow();
      lastLineIdxPerCol.fill(-1);
      hasItem = true;
      currentRowHasNumericAmounts = false;
    }

    if (hasNumericOnLine) {
      currentRowHasNumericAmounts = true;
    }

    for (let ti = 0; ti < line.tokens.length; ti++) {
      const t = line.tokens[ti];
      const targetCol = matchedCols[ti];

      if (currentItemCells[targetCol]) {
        if (lastLineIdxPerCol[targetCol] === lIdx && currentItemCells[targetCol].length > 0) {
          currentItemCells[targetCol][currentItemCells[targetCol].length - 1] += " " + t.text;
        } else {
          currentItemCells[targetCol].push(t.text);
          lastLineIdxPerCol[targetCol] = lIdx;
        }
      }
    }
  }

  flushCurrentItem(rowCounter++);

  return new DocxTable({
    layout: TableLayoutType.FIXED,
    columnWidths: colWidthsDxa,
    width: { size: printableWidthDxa, type: WidthType.DXA },
    rows: tableRows,
  });
}

function clusterTokensIntoSimpleLines(tokens: SpatialTextToken[], pageNum: number): ReconstructedLine[] {
  if (tokens.length === 0) return [];
  const sorted = [...tokens].sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: ReconstructedLine[] = [];
  let curTokens: SpatialTextToken[] = [];
  let curY = -1;

  for (const t of sorted) {
    const tol = Math.max(4, Math.min(6, (t.fontSize || 10) * 0.45));
    if (curY === -1 || Math.abs(t.y - curY) <= tol) {
      curTokens.push(t);
      if (curY === -1) curY = t.y;
    } else {
      lines.push(buildSimpleLine(curTokens, curY, pageNum));
      curTokens = [t];
      curY = t.y;
    }
  }

  if (curTokens.length > 0) {
    lines.push(buildSimpleLine(curTokens, curY, pageNum));
  }

  return lines;
}

function buildSimpleLine(curTokens: SpatialTextToken[], y: number, pageNum: number): ReconstructedLine {
  curTokens.sort((a, b) => a.x - b.x);
  let text = "";
  for (let i = 0; i < curTokens.length; i++) {
    const t = curTokens[i];
    if (i === 0) {
      text = t.text;
    } else {
      const prev = curTokens[i - 1];
      const gap = t.x - (prev.x + prev.width);
      const spaceThreshold = Math.max(1.5, (t.fontSize || 10) * 0.2);
      if (gap > spaceThreshold && !prev.text.endsWith(" ") && !t.text.startsWith(" ")) {
        text += " " + t.text;
      } else {
        text += t.text;
      }
    }
  }

  return {
    y,
    xStart: curTokens[0].x,
    xEnd: curTokens[curTokens.length - 1].x + curTokens[curTokens.length - 1].width,
    tokens: curTokens,
    text: text.trim(),
    fontSize: curTokens[0].fontSize,
    isBold: curTokens.filter((ct) => ct.isBold).length >= Math.ceil(curTokens.length / 2),
    isItalic: curTokens.some((ct) => ct.isItalic),
    page: pageNum,
  };
}

// ---------------------------------------------------------------------------
// CORE ENGINE PIPELINE (4 MODES + SELF-VERIFICATION + RETRY)
// ---------------------------------------------------------------------------

function normalizeRequestedMode(options: PdfToWordOptions): ReconstructionMode {
  if (options.reconstructionMode) return options.reconstructionMode;
  if (options.preset === "visual_fidelity") return "visual_fidelity";
  if (options.preset === "advanced_layout") return "advanced_layout";
  if (options.preset === "scanned_ocr") return "scanned_ocr";
  if (options.preset === "hybrid_auto") return "hybrid_auto";
  return "editable_word";
}

function buildDocxArchiveFromPages(params: {
  baseName: string;
  title: string;
  pages: PageExtractedData[];
  options: PdfToWordOptions;
  strategy: "primary" | "structured_flow_fallback";
}): {
  docx: DocxDocument;
  stats: {
    tablesCount: number;
    paragraphsCount: number;
    headingsCount: number;
    detectedTitle: string;
    hasInvoicePages: boolean;
    detectedSourceTables: number;
  };
} {
  const { baseName, title, pages, options, strategy } = params;
  const preset = options.preset || "max_accuracy";
  const detectionMode = options.detectionMode || "auto";
  const preserveTables = options.preserveTables !== false;

  let tablesCount = 0;
  let paragraphsCount = 0;
  let headingsCount = 0;
  let detectedTitle = title;
  let hasInvoicePages = false;
  let detectedSourceTables = 0;

  interface BuiltPageResult {
    widthPt: number;
    heightPt: number;
    isCompactMargin: boolean;
    elements: (Paragraph | DocxTable)[];
  }

  const builtPages: BuiltPageResult[] = [];

  for (const p of pages) {
    const isPageInvoice =
      strategy === "primary" &&
      detectionMode !== "flow" &&
      (detectionMode === "invoice" ||
        (options.documentProfile && /invoice|bill|statement|purchase_order|ledger|quotation|credit|debit/i.test(options.documentProfile)) ||
        checkIfTokensRepresentInvoice(p.tokens));

    if (isPageInvoice) hasInvoicePages = true;

    const isCompactMargin =
      isPageInvoice ||
      detectionMode === "invoice" ||
      preset === "financial_fidelity" ||
      preset === "visual_fidelity" ||
      preset === "advanced_layout";

    const marginInPts = isCompactMargin ? 36 : 54;
    const printableWidthDxa = Math.max(6800, Math.round((p.width - marginInPts * 2) * 20));
    let pageElements: (Paragraph | DocxTable)[] = [];

    if (isPageInvoice) {
      pageElements = reconstructInvoicePageLayout(
        p.tokens,
        p.width,
        p.height,
        p.pageNum,
        options,
        p.vectorMedia.images,
        p.vectorMedia
      );

      let pageTables = 0;
      for (const el of pageElements) {
        if (el instanceof DocxTable) {
          tablesCount++;
          pageTables++;
        } else {
          paragraphsCount++;
        }
      }
      detectedSourceTables += Math.max(1, pageTables);
    } else {
      const pageLines = clusterPageTokensIntoLines(p.tokens, p.width, p.pageNum);
      const pageBlocks = reconstructDocumentBlocks(pageLines, {
        preserveTables: preserveTables && detectionMode !== "flow",
        detectionMode,
        isFastMode: preset === "high_speed",
        pageWidth: p.width,
        verticalLines: p.vectorMedia.verticalLines,
      });

      // Interleave authentic non-full-scan images (or scanned region crops) cleanly in Y-order
      const nonScanImages = p.vectorMedia.images.filter(
        (im) => im.role !== "full_page_scan" || p.tokens.length < 15
      );
      const insertedImages = new Set<number>();

      // Emit top images before first block if Y is above first text line
      const firstTextY = pageLines[0]?.y ?? p.height;
      nonScanImages.forEach((im, idx) => {
        if (im.y + im.heightPt * 0.5 < firstTextY) {
          pageElements.push(buildNativeImageParagraph(im, p.width));
          insertedImages.add(idx);
        }
      });

      for (const block of pageBlocks) {
        const blockStartY = block.lines[0]?.y ?? 0;

        // Place any inline image belonging before this block
        nonScanImages.forEach((im, idx) => {
          if (!insertedImages.has(idx) && im.y <= blockStartY) {
            pageElements.push(buildNativeImageParagraph(im, p.width));
            insertedImages.add(idx);
          }
        });

        if (block.type === "heading") {
          headingsCount++;
          if (!detectedTitle && block.level === HeadingLevel.TITLE) {
            detectedTitle = block.text;
          }
        } else if (block.type === "table") {
          tablesCount++;
          detectedSourceTables++;
        } else {
          paragraphsCount++;
        }

        if (block.type === "table" && block.tableData) {
          pageElements.push(buildNativeWordTable(block.tableData, printableWidthDxa));
        } else {
          pageElements.push(buildNativeWordParagraph(block));
        }
      }

      // Append trailing bottom images (stamps/signatures/QRs)
      nonScanImages.forEach((im, idx) => {
        if (!insertedImages.has(idx)) {
          pageElements.push(buildNativeImageParagraph(im, p.width));
          insertedImages.add(idx);
        }
      });
    }

    if (pageElements.length === 0) {
      pageElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${p.pageNum} Blank / Scanned Content]`,
              italics: true,
              color: "94A3B8",
              size: 20,
            }),
          ],
        })
      );
    }

    builtPages.push({
      widthPt: p.width,
      heightPt: p.height,
      isCompactMargin,
      elements: pageElements,
    });
  }

  // Group consecutive pages sharing dimensions/margins into Word sections (<w:sectPr>)
  interface SectionGroup {
    widthDxa: number;
    heightDxa: number;
    marginDxa: number;
    children: (Paragraph | DocxTable)[];
  }

  const sectionGroups: SectionGroup[] = [];

  for (const bp of builtPages) {
    const wDxa = Math.round(bp.widthPt * 20);
    const hDxa = Math.round(bp.heightPt * 20);
    const mDxa = bp.isCompactMargin ? 720 : 1080;

    const lastSec = sectionGroups[sectionGroups.length - 1];
    if (
      lastSec &&
      Math.abs(lastSec.widthDxa - wDxa) <= 40 &&
      Math.abs(lastSec.heightDxa - hDxa) <= 40 &&
      lastSec.marginDxa === mDxa
    ) {
      if (lastSec.children.length > 0) {
        lastSec.children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      lastSec.children.push(...bp.elements);
    } else {
      sectionGroups.push({
        widthDxa: wDxa,
        heightDxa: hDxa,
        marginDxa: mDxa,
        children: [...bp.elements],
      });
    }
  }

  if (sectionGroups.length === 0) {
    sectionGroups.push({
      widthDxa: 11906,
      heightDxa: 16838,
      marginDxa: 1080,
      children: [
        new Paragraph({
          children: [new TextRun({ text: "No readable text content was detected in this document.", italics: true })],
        }),
      ],
    });
  }

  const docHeader = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: detectedTitle ? `${detectedTitle.slice(0, 50)} | PDFSun` : "PDFSun Reconstructed Document",
            size: 16,
            color: "94A3B8",
            font: "Calibri",
          }),
        ],
      }),
    ],
  });

  const docFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Page ", size: 16, color: "94A3B8", font: "Calibri" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "94A3B8", font: "Calibri" }),
          new TextRun({ text: " of ", size: 16, color: "94A3B8", font: "Calibri" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "94A3B8", font: "Calibri" }),
        ],
      }),
    ],
  });

  const docx = new DocxDocument({
    creator: "PDFSun In-Browser Enterprise Engine",
    title: detectedTitle || baseName,
    description: "Reconstructed Editable Microsoft Word Document (.docx)",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: "0F172A" },
          paragraph: { spacing: { line: 276, after: 110 } },
        },
      },
    },
    sections: sectionGroups.map((sg) => {
      const isLandscape = sg.widthDxa > sg.heightDxa;
      return {
        headers: { default: docHeader },
        footers: { default: docFooter },
        properties: {
          page: {
            size: {
              width: isLandscape ? sg.heightDxa : sg.widthDxa,
              height: isLandscape ? sg.widthDxa : sg.heightDxa,
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: sg.marginDxa, right: sg.marginDxa, bottom: sg.marginDxa, left: sg.marginDxa },
          },
        },
        children: sg.children,
      };
    }),
  });

  return {
    docx,
    stats: {
      tablesCount,
      paragraphsCount,
      headingsCount,
      detectedTitle,
      hasInvoicePages,
      detectedSourceTables: Math.max(detectedSourceTables, tablesCount > 0 ? 1 : 0),
    },
  };
}

function buildNativeImageParagraph(img: ExtractedPdfImage, pageWidth: number): Paragraph {
  const align =
    img.x >= pageWidth * 0.52
      ? AlignmentType.RIGHT
      : img.x + img.widthPt * 0.5 > pageWidth * 0.35 && img.x + img.widthPt * 0.5 < pageWidth * 0.65
      ? AlignmentType.CENTER
      : AlignmentType.LEFT;

  return new Paragraph({
    alignment: align,
    spacing: { before: 40, after: 40 },
    children: [
      new ImageRun({
        data: img.data,
        type: "png",
        transformation: { width: img.width, height: img.height },
      }),
    ],
  });
}

/**
 * Enterprise PDF to Word (.docx) reconstruction engine
 */
export async function convertPdfToWordEnterprise(
  file: File,
  options: PdfToWordOptions = {}
): Promise<PdfToWordResult> {
  const {
    preset = "max_accuracy",
    detectionMode = "auto",
    preserveTables = true,
    preserveImages = true,
    enableOcrFallback = true,
    dpiQuality = 300,
    onProgress,
  } = options;

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "PDFSun_Word_Doc";
  const arrayBuffer = await file.arrayBuffer();
  validatePdfBinaryInput(arrayBuffer);

  if (onProgress) onProgress(8, "Initializing in-browser WebAssembly PDF extraction engine...");

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer.slice(0),
    verbosity: 0,
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const activeMode = normalizeRequestedMode(options);
  const warnings: string[] = [];

  let totalExtractedWords = 0;
  let ocrUsedPages = 0;
  let totalImagesExtracted = 0;
  const ocrLowConfidencePages: number[] = [];
  const ocrConfidences: number[] = [];
  let fullPlainTextAccumulator = "";

  const allDocumentTokens: SpatialTextToken[] = [];
  const pageDimensionsList: { width: number; height: number }[] = [];
  const extractedPages: PageExtractedData[] = [];
  const perPageSummary: PerPageConversionSummary[] = [];

  // 1. Process Each Page Independently (Per-page Hybrid Native + Vector + Image + OCR)
  for (let pNum = 1; pNum <= numPages; pNum++) {
    const pageProgress = 10 + Math.round((pNum / Math.max(1, numPages)) * 52);
    if (onProgress) {
      onProgress(pageProgress, `Parsing text, vector table lines & graphics on page ${pNum} of ${numPages}...`);
    }

    const page = await pdf.getPage(pNum);
    const viewport = page.getViewport({ scale: 1.0 });
    pageDimensionsList.push({ width: viewport.width, height: viewport.height });

    const textContent = await (page.getTextContent as any)({ normalizeWhitespace: true });
    const rawItems = textContent.items as any[];

    const pageTokens = normalizePdfTextItems(rawItems, viewport.height, pNum);
    const pageTextLength = pageTokens.reduce((acc, t) => acc + t.text.trim().length, 0);

    // Extract Vector Lines, Shading Boxes & Embedded Images via CTM traversal
    const vectorMedia = await extractPageVectorAndMedia(page, viewport, preserveImages);
    totalImagesExtracted += vectorMedia.images.length;

    // Classify page mode (Native vs Scanned OCR vs Hybrid)
    const isScannedPage = pageTokens.length === 0 || pageTextLength < 25;
    const isMixedHybridPage =
      !isScannedPage &&
      vectorMedia.totalImageAreaRatio >= 0.35 &&
      vectorMedia.images.some((im) => im.areaRatio >= 0.25 && im.widthPt >= 160 && im.heightPt >= 120);

    const forceOcr = activeMode === "scanned_ocr" && isScannedPage;
    const shouldRunOcr =
      enableOcrFallback &&
      preset !== "high_speed" &&
      preset !== "compact_vector" &&
      (forceOcr ||
        (activeMode === "scanned_ocr" && pageTextLength < 80) ||
        isScannedPage ||
        (activeMode === "hybrid_auto" && isMixedHybridPage));

    let modeUsed: "native" | "ocr" | "hybrid" = "native";
    let pageOcrConfidence: number | undefined;

    if (shouldRunOcr) {
      if (onProgress) {
        onProgress(
          pageProgress + 2,
          `Page ${pNum}: Running ${isMixedHybridPage ? "Hybrid region" : "Scanned PDF"} WASM OCR...`
        );
      }
      ocrUsedPages++;

      try {
        const ocrRes = await performLightweightPageOcr(page, pNum, dpiQuality);
        pageOcrConfidence = ocrRes.confidence;
        ocrConfidences.push(ocrRes.confidence);

        if (isMixedHybridPage && pageTokens.length > 0) {
          // Merge ONLY OCR tokens falling in non-text image regions (prevent duplicates)
          const nonOverlapping = ocrRes.tokens.filter(
            (ot) =>
              !pageTokens.some(
                (nt) =>
                  Math.abs(nt.y - ot.y) <= Math.max(8, nt.fontSize) &&
                  nt.x <= ot.x + ot.width &&
                  nt.x + nt.width >= ot.x
              )
          );
          pageTokens.push(...nonOverlapping);
          modeUsed = "hybrid";
        } else {
          pageTokens.push(...ocrRes.tokens);
          modeUsed = pageTextLength > 0 ? "hybrid" : "ocr";
        }

        if (ocrRes.tokens.length === 0) {
          warnings.push(`Page ${pNum}: Scanned content detected but OCR yielded minimal text (verify source scan contrast).`);
        } else if (ocrRes.confidence < 75) {
          ocrLowConfidencePages.push(pNum);
          warnings.push(
            `Page ${pNum}: OCR confidence was moderate (${Math.round(ocrRes.confidence)}%) — inspect financial digits carefully.`
          );
        }
      } catch (ocrErr) {
        warnings.push(`Page ${pNum}: OCR engine encountered an error; retained native graphics/text.`);
      }
    }

    for (const t of pageTokens) {
      if (fullPlainTextAccumulator.length < 3000) {
        fullPlainTextAccumulator += t.text + " ";
      }
    }
    totalExtractedWords += pageTokens.filter((t) => t.text.trim().length > 0).length;
    allDocumentTokens.push(...pageTokens);

    extractedPages.push({
      pageNum: pNum,
      width: viewport.width,
      height: viewport.height,
      tokens: pageTokens,
      vectorMedia,
      modeUsed,
      ocrConfidence: pageOcrConfidence,
    });

    perPageSummary.push({
      pageNumber: pNum,
      mode: modeUsed,
      ocrConfidence: pageOcrConfidence,
      imagesExtracted: vectorMedia.images.length,
      tablesDetected: vectorMedia.horizontalLines.length >= 2 && vectorMedia.verticalLines.length >= 2 ? 1 : 0,
      widthPt: Math.round(viewport.width),
      heightPt: Math.round(viewport.height),
      orientation: viewport.width > viewport.height ? "landscape" : "portrait",
    });
  }

  // 2. Build Primary DOCX Candidate & Run Real OOXML Inspection
  if (onProgress) onProgress(76, "Assembling Microsoft Word OpenXML tables, images & page geometry...");

  const primaryBuild = buildDocxArchiveFromPages({
    baseName,
    title: "",
    pages: extractedPages,
    options: { ...options, preserveTables },
    strategy: "primary",
  });

  if (onProgress) onProgress(86, "Compiling binary OpenXML (.docx) package & validating XML integrity...");

  let bestBytes = new Uint8Array(await Packer.toArrayBuffer(primaryBuild.docx));
  let bestStats = primaryBuild.stats;

  let docxQualityReport = await validateDocxPackageDeep({
    sourceTokens: allDocumentTokens,
    sourcePageCount: numPages,
    docxBytes: bestBytes,
    fallbackText: fullPlainTextAccumulator,
    reconstructedTablesCount: bestStats.tablesCount,
    detectedSourceTables: bestStats.detectedSourceTables,
    sourceImagesCount: preserveImages
      ? extractedPages.reduce(
          (sum, p) => sum + p.vectorMedia.images.filter((im) => im.role !== "full_page_scan" || p.tokens.length < 15).length,
          0
        )
      : 0,
    ocrLowConfidencePages,
  });

  // 3. Automatic Quality-Driven Strategy Retry if Critical Failure or Low Retention Detected
  const shouldAttemptRetry =
    allDocumentTokens.length >= 10 &&
    (docxQualityReport.overallStatus === "FAIL" || docxQualityReport.textPreservationPct < 80);

  if (shouldAttemptRetry) {
    if (onProgress) onProgress(92, "Optimizing layout reconstruction strategy for higher fidelity...");
    const retryBuild = buildDocxArchiveFromPages({
      baseName,
      title: bestStats.detectedTitle,
      pages: extractedPages,
      options: { ...options, preserveTables },
      strategy: "structured_flow_fallback",
    });
    const retryBytes = new Uint8Array(await Packer.toArrayBuffer(retryBuild.docx));
    const retryReport = await validateDocxPackageDeep({
      sourceTokens: allDocumentTokens,
      sourcePageCount: numPages,
      docxBytes: retryBytes,
      fallbackText: fullPlainTextAccumulator,
      reconstructedTablesCount: retryBuild.stats.tablesCount,
      detectedSourceTables: retryBuild.stats.detectedSourceTables,
      sourceImagesCount: preserveImages ? totalImagesExtracted : 0,
      ocrLowConfidencePages,
    });

    if (
      retryReport.confidenceScore > docxQualityReport.confidenceScore ||
      retryReport.textPreservationPct > docxQualityReport.textPreservationPct + 5
    ) {
      bestBytes = retryBytes;
      bestStats = retryBuild.stats;
      docxQualityReport = retryReport;
      warnings.push("Applied structured layout recovery pass to maximize text & financial data retention.");
    }
  }

  // Merge QA warnings cleanly
  for (const w of docxQualityReport.warnings || []) {
    if (!warnings.includes(w)) warnings.push(w);
  }

  // 4. Financial & Global Document Intelligence Audit Against REAL Extracted DOCX XML Text
  const realDocxText =
    docxQualityReport.ooxmlDetails?.extractedXmlText && docxQualityReport.ooxmlDetails.extractedXmlText.length > 0
      ? docxQualityReport.ooxmlDetails.extractedXmlText
      : fullPlainTextAccumulator;

  const sourceFullText = allDocumentTokens.map((t) => t.text).join(" ") || fullPlainTextAccumulator;
  const classification = detectDocumentProfile(sourceFullText, file.name);
  if (options.documentProfile && DOCUMENT_PROFILES[options.documentProfile]) {
    classification.profile = options.documentProfile;
    classification.profileMeta = DOCUMENT_PROFILES[options.documentProfile];
  }

  const minOcrConf = ocrConfidences.length > 0 ? Math.min(...ocrConfidences) : 98;
  const qualityAudit = auditFinancialDocxIntegrity(classification, realDocxText, minOcrConf);

  const globalClassification = classifyGlobalDocument(allDocumentTokens, numPages);
  const technicalStructure = analyzePdfTechnicalStructure(
    allDocumentTokens,
    numPages,
    pageDimensionsList,
    totalImagesExtracted
  );

  if (onProgress) onProgress(100, "PDF to Word conversion complete!");

  return {
    bytes: bestBytes,
    fileName: `${baseName}.docx`,
    stats: {
      pagesCount: numPages,
      wordCount: totalExtractedWords,
      paragraphsCount: bestStats.paragraphsCount,
      tablesCount: bestStats.tablesCount,
      headingsCount: bestStats.headingsCount,
      ocrPagesCount: ocrUsedPages,
      imagesCount: totalImagesExtracted,
      detectedTitle: bestStats.detectedTitle || baseName,
      previewSnippet: realDocxText.trim().slice(0, 1500),
      reconstructionMode: activeMode,
      layoutFidelityScore: docxQualityReport.confidenceScore,
      isInvoiceDetected: bestStats.hasInvoicePages,
      globalCategory: globalClassification.primaryCategory.key,
      globalCategoryName: globalClassification.primaryCategory.name,
      structuralClass: technicalStructure.structuralClass,
    },
    classification,
    globalClassification,
    technicalStructure,
    qualityAudit,
    docxQualityReport,
    reconstructionMode: activeMode,
    perPageSummary,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// GENERAL FLOW LINE CLUSTERING, MULTI-COLUMN & NATIVE BLOCK ASSEMBLY
// ---------------------------------------------------------------------------

function clusterPageTokensIntoLines(
  tokens: SpatialTextToken[],
  pageWidth: number,
  pageNum: number,
  allowMultiColumn: boolean = true
): ReconstructedLine[] {
  if (tokens.length === 0) return [];

  const gutterX = findOptimalVerticalGutter(tokens, pageWidth, 0.38, 0.62);
  const leftTokens: SpatialTextToken[] = [];
  const rightTokens: SpatialTextToken[] = [];
  const spanningTokens: SpatialTextToken[] = [];

  for (const t of tokens) {
    if (t.x + t.width < gutterX - 12) {
      leftTokens.push(t);
    } else if (t.x > gutterX + 12) {
      rightTokens.push(t);
    } else {
      spanningTokens.push(t);
    }
  }

  const hasWideElements = tokens.some((t) => t.width > pageWidth * 0.48);
  const isTwoColumnLayout =
    allowMultiColumn &&
    !hasWideElements &&
    leftTokens.length > 25 &&
    rightTokens.length > 25 &&
    spanningTokens.length < (leftTokens.length + rightTokens.length) * 0.1;

  if (isTwoColumnLayout) {
    const leftLines = clusterTokensIntoLinesInternal(leftTokens, pageNum, 0);
    const rightLines = clusterTokensIntoLinesInternal(rightTokens, pageNum, 1);
    const topSpanning = clusterTokensIntoLinesInternal(
      spanningTokens.filter((t) => t.y < 200),
      pageNum,
      undefined
    );
    const bottomSpanning = clusterTokensIntoLinesInternal(
      spanningTokens.filter((t) => t.y >= 200),
      pageNum,
      undefined
    );

    return [...topSpanning, ...leftLines, ...rightLines, ...bottomSpanning];
  }

  return clusterTokensIntoLinesInternal(tokens, pageNum, undefined);
}

function clusterTokensIntoLinesInternal(
  tokens: SpatialTextToken[],
  pageNum: number,
  columnIdx?: number
): ReconstructedLine[] {
  if (tokens.length === 0) return [];

  const sorted = [...tokens].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: ReconstructedLine[] = [];

  let currentLineTokens: SpatialTextToken[] = [];
  let currentLineY = -1;

  for (const token of sorted) {
    const yTolerance = Math.max(4, Math.min(6, (token.fontSize || 10) * 0.42));
    if (currentLineY === -1 || Math.abs(token.y - currentLineY) <= yTolerance) {
      currentLineTokens.push(token);
      if (currentLineY === -1) currentLineY = token.y;
    } else {
      if (currentLineTokens.length > 0) {
        lines.push(buildLineFromTokens(currentLineTokens, currentLineY, pageNum, columnIdx));
      }
      currentLineTokens = [token];
      currentLineY = token.y;
    }
  }

  if (currentLineTokens.length > 0) {
    lines.push(buildLineFromTokens(currentLineTokens, currentLineY, pageNum, columnIdx));
  }

  return lines;
}

function buildLineFromTokens(
  tokens: SpatialTextToken[],
  y: number,
  page: number,
  columnIdx?: number
): ReconstructedLine {
  tokens.sort((a, b) => a.x - b.x);

  let fullText = "";
  let boldCount = 0;
  let italicCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.isBold) boldCount++;
    if (t.isItalic) italicCount++;

    if (i === 0) {
      fullText = t.text;
    } else {
      const prev = tokens[i - 1];
      const gap = t.x - (prev.x + prev.width);
      const spaceThreshold = Math.max(1.8, t.fontSize * 0.22);

      if (gap > spaceThreshold && !prev.text.endsWith(" ") && !t.text.startsWith(" ")) {
        fullText += " " + t.text;
      } else {
        fullText += t.text;
      }
    }
  }

  const fontSizes = tokens.map((t) => t.fontSize);
  const dominantFontSize = fontSizes.sort((a, b) => a - b)[Math.floor(fontSizes.length / 2)] || 10;

  return {
    y,
    xStart: tokens[0].x,
    xEnd: tokens[tokens.length - 1].x + tokens[tokens.length - 1].width,
    tokens,
    text: fullText.trim(),
    fontSize: dominantFontSize,
    isBold: boldCount >= Math.ceil(tokens.length / 2),
    isItalic: italicCount >= Math.ceil(tokens.length / 2),
    page,
    columnIdx,
  };
}

function reconstructDocumentBlocks(
  lines: ReconstructedLine[],
  options: {
    preserveTables: boolean;
    detectionMode: LayoutDetectionMode;
    isFastMode: boolean;
    pageWidth: number;
    verticalLines?: VerticalRule[];
  }
): ReconstructedParagraph[] {
  if (lines.length === 0) return [];

  const fontSizes = lines.map((l) => l.fontSize).sort((a, b) => a - b);
  const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 10;

  const blocks: ReconstructedParagraph[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Table & Multi-Column Grid Detection
    if (options.preserveTables && isPossibleTableRow(line, options.detectionMode)) {
      const tableLines: ReconstructedLine[] = [line];
      let j = i + 1;

      while (
        j < lines.length &&
        isPossibleTableRow(lines[j], options.detectionMode) &&
        lines[j].page === line.page &&
        lines[j].columnIdx === line.columnIdx &&
        lines[j].y - lines[j - 1].y <= 45
      ) {
        tableLines.push(lines[j]);
        j++;
      }

      if (tableLines.length >= 2) {
        const tableBlock = parseTableFromLines(tableLines, line.page, options.detectionMode, options.verticalLines);
        if (tableBlock) {
          blocks.push(tableBlock);
          i = j;
          continue;
        }
      }
    }

    // 2. Heading Classification
    const isHeadingCandidate =
      line.fontSize >= medianFontSize * 1.25 ||
      (line.isBold && line.text.length < 75 && !line.text.endsWith(".") && !line.text.endsWith(","));

    if (isHeadingCandidate && options.detectionMode !== "table") {
      let headingLevel: HeadingLevelType = HeadingLevel.HEADING_2;
      if (line.fontSize >= 20 || (line.text.length < 40 && line.fontSize >= medianFontSize * 1.6)) {
        headingLevel = HeadingLevel.TITLE;
      } else if (line.fontSize >= 15 || line.fontSize >= medianFontSize * 1.35) {
        headingLevel = HeadingLevel.HEADING_1;
      } else if (line.fontSize >= 12) {
        headingLevel = HeadingLevel.HEADING_2;
      } else {
        headingLevel = HeadingLevel.HEADING_3;
      }

      const pageMidpoint = options.pageWidth / 2;
      const lineCenter = (line.xStart + line.xEnd) / 2;
      const isCentered = Math.abs(lineCenter - pageMidpoint) < 45;

      blocks.push({
        type: "heading",
        level: headingLevel,
        lines: [line],
        text: line.text,
        isBold: true,
        fontSize: line.fontSize,
        alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
        page: line.page,
      });
      i++;
      continue;
    }

    // 3. Bullet & Numbered Lists
    const bulletMatch = line.text.match(/^([•\-\*▪–—]|([0-9]+|[a-zA-Z])[.)])\s+(.*)$/);
    if (bulletMatch) {
      const isNumbered = /^[0-9]+[.)]/.test(line.text);
      blocks.push({
        type: isNumbered ? "numbered" : "bullet",
        lines: [line],
        text: bulletMatch[3] || line.text,
        isBold: line.isBold,
        fontSize: line.fontSize,
        alignment: AlignmentType.LEFT,
        page: line.page,
      });
      i++;
      continue;
    }

    // 4. Fluid Body Paragraph Assembly
    const paragraphLines: ReconstructedLine[] = [line];
    let k = i + 1;

    while (k < lines.length) {
      const next = lines[k];
      const prev = lines[k - 1];
      const lineGap = next.y - prev.y;
      const samePage = next.page === prev.page;
      const sameColumn = next.columnIdx === prev.columnIdx;

      const isNextHeading =
        next.fontSize >= medianFontSize * 1.25 ||
        (next.isBold && next.text.length < 75 && !next.text.endsWith(".") && !next.text.endsWith(","));
      const isNextBullet = /^([•\-\*▪–—]|([0-9]+|[a-zA-Z])[.)])\s+/.test(next.text);

      if (
        !samePage ||
        !sameColumn ||
        lineGap > next.fontSize * 2.2 ||
        isNextHeading ||
        isNextBullet ||
        (options.preserveTables && isPossibleTableRow(next, options.detectionMode))
      ) {
        break;
      }

      paragraphLines.push(next);
      k++;
    }

    const combinedText = paragraphLines.map((l) => l.text).join(" ");
    blocks.push({
      type: "body",
      lines: paragraphLines,
      text: combinedText,
      isBold: line.isBold,
      fontSize: medianFontSize,
      alignment: AlignmentType.LEFT,
      page: line.page,
    });

    i = k;
  }

  return blocks;
}

function isPossibleTableRow(line: ReconstructedLine, mode?: LayoutDetectionMode): boolean {
  if (line.tokens.length < 2) return false;

  const gapThreshold = mode === "invoice" || mode === "fields" ? 18 : 16;
  let significantGaps = 0;
  for (let i = 1; i < line.tokens.length; i++) {
    const prev = line.tokens[i - 1];
    const curr = line.tokens[i];
    const gap = curr.x - (prev.x + prev.width);
    if (gap >= gapThreshold) significantGaps++;
  }

  return significantGaps >= 1;
}

function parseTableFromLines(
  lines: ReconstructedLine[],
  pageNum: number,
  mode: LayoutDetectionMode = "auto",
  verticalLines: VerticalRule[] = []
): ReconstructedParagraph | null {
  if (lines.length < 2) return null;

  // Merge close words on the header row first so "Taxable Value" isn't split into 2 columns
  const mergedHeaderTokens = mergeAdjacentTokensForColumnHeaders(lines[0].tokens, verticalLines, lines[0].y);
  let colStarts: number[] = [];

  if (mergedHeaderTokens.length >= 2) {
    colStarts = mergedHeaderTokens.map((t) => t.x);
  } else {
    const allXPositions: number[] = [];
    for (const line of lines) {
      for (const t of line.tokens) allXPositions.push(t.x);
    }
    allXPositions.sort((a, b) => a - b);
    const colTolerance = mode === "invoice" || mode === "fields" ? 18 : 22;
    for (const x of allXPositions) {
      if (!colStarts.some((cx) => Math.abs(cx - x) <= colTolerance)) {
        colStarts.push(x);
      }
    }
  }

  colStarts.sort((a, b) => a - b);
  if (colStarts.length < 2) return null;

  const colBounds: number[] = [];
  for (let c = 0; c < colStarts.length - 1; c++) {
    colBounds.push((colStarts[c] + colStarts[c + 1]) / 2);
  }

  const tableRows: string[][] = [];

  for (const line of lines) {
    const rowCells = new Array(colStarts.length).fill("");
    for (const token of line.tokens) {
      let targetCol = colStarts.length - 1;
      for (let c = 0; c < colBounds.length; c++) {
        if (token.x < colBounds[c]) {
          targetCol = c;
          break;
        }
      }
      rowCells[targetCol] = rowCells[targetCol] ? `${rowCells[targetCol]} ${token.text}` : token.text;
    }
    tableRows.push(rowCells.map((c) => c.trim()));
  }

  const validRows = tableRows.filter((r) => r.some((cell) => cell.length > 0));
  if (validRows.length < 2) return null;

  const headers = validRows[0];
  const rows = validRows.slice(1);
  const colCount = colStarts.length;

  const rawWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    if (c < colCount - 1) {
      rawWidths.push(Math.max(20, colStarts[c + 1] - colStarts[c]));
    } else {
      const avgWidth = rawWidths.length > 0 ? rawWidths.reduce((a, b) => a + b, 0) / rawWidths.length : 80;
      rawWidths.push(Math.max(25, Math.round(avgWidth)));
    }
  }

  const totalRaw = rawWidths.reduce((a, b) => a + b, 0);
  const colWidthsPct = rawWidths.map((w) => Math.max(5, Math.round((w / totalRaw) * 100)));
  const sumPct = colWidthsPct.reduce((a, b) => a + b, 0);
  if (sumPct !== 100 && colWidthsPct.length > 0) {
    colWidthsPct[colWidthsPct.length - 1] += 100 - sumPct;
  }

  const semantics = classifyTableSemantics([headers, ...rows]);
  const isBorderless = mode === "fields";

  return {
    type: "table",
    lines,
    text: `Table (${colCount} cols x ${validRows.length} rows)`,
    isBold: false,
    fontSize: 10,
    alignment: AlignmentType.LEFT,
    page: pageNum,
    tableData: {
      headers,
      rows,
      colWidthsPct,
      isBorderless,
      headerStyle: isBorderless ? "clean" : semantics.isFinancialTable ? "navy" : "clean",
    },
  };
}

export function detectOptimalFont(text: string, isMonospace?: boolean): string {
  if (isMonospace) return "Consolas";
  if (!text) return "Calibri";
  if (/[\u0900-\u097F]/.test(text)) return "Mangal";
  if (/[\u0600-\u06FF]/.test(text)) return "Traditional Arabic";
  if (/[\u4E00-\u9FFF\u3040-\u30FF]/.test(text)) return "Microsoft YaHei";
  return "Calibri";
}

function buildNativeWordTable(
  tableData: {
    headers: string[];
    rows: string[][];
    colWidthsPct: number[];
    isBorderless?: boolean;
    headerStyle?: "navy" | "clean" | "borderless";
  },
  printableWidthDxa: number
): DocxTable {
  const tableRows: TableRow[] = [];
  const colCount = tableData.headers.length;
  const isBorderless = tableData.isBorderless || false;
  const isNavy = tableData.headerStyle === "navy" && !isBorderless;

  const colWidthsDxa = tableData.colWidthsPct.map((pct) =>
    Math.max(400, Math.round((printableWidthDxa * pct) / 100))
  );
  const totalAssigned = colWidthsDxa.reduce((a, b) => a + b, 0);
  if (colWidthsDxa.length > 0 && totalAssigned !== printableWidthDxa) {
    colWidthsDxa[colWidthsDxa.length - 1] += printableWidthDxa - totalAssigned;
  }

  const headerCells: TableCell[] = [];
  for (let cIdx = 0; cIdx < colCount; cIdx++) {
    const hText = tableData.headers[cIdx] || " ";

    let span = 1;
    while (cIdx + span < colCount && !tableData.headers[cIdx + span]?.trim()) {
      span++;
    }

    let cellWidthDxa = 0;
    for (let s = 0; s < span; s++) {
      cellWidthDxa += colWidthsDxa[cIdx + s] || Math.floor(printableWidthDxa / colCount);
    }

    headerCells.push(
      new TableCell({
        columnSpan: span > 1 ? span : undefined,
        width: { size: cellWidthDxa, type: WidthType.DXA },
        shading: isBorderless
          ? undefined
          : isNavy
          ? { type: ShadingType.CLEAR, fill: "1E3A8A" }
          : { type: ShadingType.CLEAR, fill: "F1F5F9" },
        borders: isBorderless
          ? {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            }
          : thinGridBorder(isNavy ? "1E3A8A" : "CBD5E1"),
        margins: isBorderless
          ? { top: 60, bottom: 60, left: 80, right: 80 }
          : { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: hText,
                bold: true,
                color: isNavy ? "FFFFFF" : "0F172A",
                size: 19,
                font: detectOptimalFont(hText),
              }),
            ],
          }),
        ],
      })
    );

    cIdx += span - 1;
  }

  tableRows.push(new TableRow({ children: headerCells, tableHeader: true, cantSplit: true }));

  for (let rIdx = 0; rIdx < tableData.rows.length; rIdx++) {
    const row = tableData.rows[rIdx];
    const isAlt = !isBorderless && rIdx % 2 === 1;
    const cells: TableCell[] = [];

    for (let cIdx = 0; cIdx < colCount; cIdx++) {
      const cellText = row[cIdx] || " ";

      let span = 1;
      if (cellText.trim().length > 0 && rIdx === tableData.rows.length - 1 && /total|subtotal|amount in words/i.test(cellText)) {
        while (cIdx + span < colCount - 1 && !row[cIdx + span]?.trim()) {
          span++;
        }
      }

      let cellWidthDxa = 0;
      for (let s = 0; s < span; s++) {
        cellWidthDxa += colWidthsDxa[cIdx + s] || Math.floor(printableWidthDxa / colCount);
      }

      const isNum = /^[₹$€£-]?\s*[0-9,]+(\.[0-9]+)?%?$/.test(cellText.trim());

      cells.push(
        new TableCell({
          columnSpan: span > 1 ? span : undefined,
          width: { size: cellWidthDxa, type: WidthType.DXA },
          shading: isAlt ? { type: ShadingType.CLEAR, fill: "F8FAFC" } : undefined,
          margins: isBorderless
            ? { top: 50, bottom: 50, left: 80, right: 80 }
            : { top: 70, bottom: 70, left: 100, right: 100 },
          borders: isBorderless ? borderNone() : thinGridBorder("E2E8F0"),
          children: [
            new Paragraph({
              alignment: isNum ? AlignmentType.RIGHT : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: cellText,
                  size: 18,
                  color: "1E293B",
                  font: detectOptimalFont(cellText, isNum),
                }),
              ],
            }),
          ],
        })
      );

      cIdx += span - 1;
    }

    tableRows.push(new TableRow({ children: cells, cantSplit: true }));
  }

  return new DocxTable({
    layout: TableLayoutType.FIXED,
    columnWidths: colWidthsDxa,
    rows: tableRows,
    width: { size: printableWidthDxa, type: WidthType.DXA },
  });
}

function buildNativeWordParagraph(block: ReconstructedParagraph): Paragraph {
  if (block.type === "heading") {
    const font = detectOptimalFont(block.text);
    return new Paragraph({
      heading: block.level || HeadingLevel.HEADING_1,
      alignment: block.alignment,
      spacing: { before: 200, after: 100 },
      keepNext: true,
      children: [
        new TextRun({
          text: block.text,
          bold: true,
          size: Math.max(22, Math.round(block.fontSize * 2)),
          color: "0F172A",
          font,
        }),
      ],
    });
  }

  if (block.type === "bullet") {
    const font = detectOptimalFont(block.text);
    return new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 40, after: 80, line: 276 },
      children: [
        new TextRun({
          text: block.text,
          bold: block.isBold,
          size: 21,
          color: "1E293B",
          font,
        }),
      ],
    });
  }

  if (block.type === "numbered") {
    const font = detectOptimalFont(block.text);
    return new Paragraph({
      spacing: { before: 40, after: 80, line: 276 },
      children: [
        new TextRun({
          text: `• ${block.text}`,
          bold: block.isBold,
          size: 21,
          color: "1E293B",
          font,
        }),
      ],
    });
  }

  const textRuns: TextRun[] = [];
  interface UnifiedRun {
    text: string;
    isBold: boolean;
    isItalic: boolean;
    fontSize: number;
  }
  const mergedRuns: UnifiedRun[] = [];

  for (const line of block.lines) {
    for (let tIdx = 0; tIdx < line.tokens.length; tIdx++) {
      const token = line.tokens[tIdx];
      const prevToken = tIdx > 0 ? line.tokens[tIdx - 1] : null;

      let prefix = "";
      if (prevToken) {
        const gap = token.x - (prevToken.x + prevToken.width);
        const spaceThreshold = Math.max(1.8, token.fontSize * 0.22);
        if (gap > spaceThreshold && !prevToken.text.endsWith(" ") && !token.text.startsWith(" ")) {
          prefix = " ";
        }
      } else if (mergedRuns.length > 0 && !mergedRuns[mergedRuns.length - 1].text.endsWith(" ")) {
        prefix = " ";
      }

      const tokenText = prefix + token.text;
      const lastRun = mergedRuns.length > 0 ? mergedRuns[mergedRuns.length - 1] : null;
      if (
        lastRun &&
        lastRun.isBold === token.isBold &&
        lastRun.isItalic === token.isItalic &&
        Math.abs(lastRun.fontSize - token.fontSize) <= 1
      ) {
        lastRun.text += tokenText;
      } else {
        mergedRuns.push({
          text: tokenText,
          isBold: token.isBold,
          isItalic: token.isItalic,
          fontSize: token.fontSize,
        });
      }
    }
  }

  for (const r of mergedRuns) {
    if (!r.text) continue;
    textRuns.push(
      new TextRun({
        text: r.text,
        bold: r.isBold,
        italics: r.isItalic,
        size: Math.max(18, Math.round(r.fontSize * 2)),
        color: "0F172A",
        font: detectOptimalFont(r.text),
      })
    );
  }

  if (textRuns.length === 0) {
    textRuns.push(
      new TextRun({
        text: block.text || " ",
        size: 21,
        color: "0F172A",
        font: detectOptimalFont(block.text),
      })
    );
  }

  return new Paragraph({
    alignment: block.alignment,
    spacing: { before: 0, after: 120, line: 276 },
    children: textRuns,
  });
}

/**
 * In-browser WASM OCR fallback for scanned/hybrid PDF pages with contrast enhancement & real confidence reporting
 */
async function performLightweightPageOcr(
  page: any,
  pageNum: number,
  dpiQuality: 150 | 300 = 300
): Promise<{ tokens: SpatialTextToken[]; confidence: number }> {
  const scale = dpiQuality === 300 ? 3.0 : 2.0;
  const viewport = page.getViewport({ scale });
  const canvas = createSafeCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { tokens: [], confidence: 0 };

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Lightweight adaptive contrast boost to sharpen faint GST numbers & table digits for Tesseract
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = imgData.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        const stretched = lum < 210 ? Math.max(0, Math.round((lum - 30) * 1.15)) : 255;
        px[i] = stretched;
        px[i + 1] = stretched;
        px[i + 2] = stretched;
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Skip if canvas does not support getImageData
    }

    const dataUrl = canvas.toDataURL("image/png");
    const worker = await createWorker("eng");
    const ret = await worker.recognize(dataUrl);
    await worker.terminate();

    const ocrTokens: SpatialTextToken[] = [];
    const lines = (ret.data as any)?.lines || [];
    const overallConfidence = Number((ret.data as any)?.confidence ?? 85);

    for (const line of lines) {
      const rawText = (line.text || "").trim();
      if (!rawText) continue;

      const words = line.words || [];
      if (words.length > 0) {
        for (const w of words) {
          const wText = (w.text || "").trim();
          if (!wText) continue;
          const box = w.bbox || { x0: 0, y0: 0, x1: 50, y1: 15 };
          const x = Math.round(box.x0 / scale);
          const y = Math.round(box.y0 / scale);
          const width = Math.max(4, Math.round((box.x1 - box.x0) / scale));
          const height = Math.max(6, Math.round((box.y1 - box.y0) / scale));
          const fontSize = Math.max(9, Math.round(height * 0.8));

          ocrTokens.push({
            text: wText,
            x,
            y,
            width,
            height,
            fontSize,
            fontName: "Calibri",
            isBold: w.is_bold || false,
            isItalic: false,
            page: pageNum,
          });
        }
      } else {
        const box = line.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
        const x = Math.round(box.x0 / scale);
        const y = Math.round(box.y0 / scale);
        const width = Math.max(8, Math.round((box.x1 - box.x0) / scale));
        const height = Math.max(8, Math.round((box.y1 - box.y0) / scale));
        const fontSize = Math.max(9, Math.round(height * 0.8));

        ocrTokens.push({
          text: rawText,
          x,
          y,
          width,
          height,
          fontSize,
          fontName: "Calibri",
          isBold: /^[A-Z0-9\s:_-]+$/.test(rawText) && rawText.length < 50,
          isItalic: false,
          page: pageNum,
        });
      }
    }

    canvas.width = 0;
    canvas.height = 0;

    return { tokens: ocrTokens, confidence: overallConfidence };
  } catch {
    canvas.width = 0;
    canvas.height = 0;
    return { tokens: [], confidence: 0 };
  }
}
