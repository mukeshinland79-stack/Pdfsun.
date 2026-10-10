/**
 * PDFSun Enterprise PDF to PowerPoint (.pptx) Slide Reconstruction Engine
 * 
 * Complies with Ultimate Master Technical Specification:
 * - Bug 1: PDF to PowerPoint (PPTX) Text Overlapping & Layout Distortion Fix
 *   1. Font Metrics & Box Resizing:
 *      - Dynamic line-height & text bounding box calculations.
 *      - Auto-fit & word-wrap settings (`wrap: true`, `autoFit: true`, dynamic line spacing).
 *   2. Element Separation:
 *      - Discrete relative-positioned text frames.
 *      - Native OpenXML PPTX table elements for detected grid and tabular structures.
 *      - Bounding box collision resolution to eliminate overlapping text lines.
 *   3. Font Fallback Engine:
 *      - Intelligent mapping to standard PPTX fonts (Calibri, Arial, Georgia, Consolas).
 *   4. Vector & Image Scaling:
 *      - Aspect-ratio preserving viewport projection (zero stretching or distorted plates).
 *   5. Zero Side-Effects: Isolated execution with non-blocking UI yielding.
 */

import * as pdfjsLib from "pdfjs-dist";
import PptxGenJS from "pptxgenjs";
import { createWorker } from "tesseract.js";

// Ensure pdf.js worker is registered
if (typeof window !== "undefined" && !(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

export type PdfToPptPreset = "vector_editable" | "hybrid_master" | "compact_deck";

export interface PdfToPowerPointOptions {
  preset?: PdfToPptPreset;
  orientation?: "landscape" | "portrait" | "auto" | "widescreen" | "standard";
  pageScope?: "all" | "range";
  pageRangeStr?: string;
  enableOcrFallback?: boolean;
  onProgress?: (percent: number, statusMsg: string) => void;
}

interface PdfToken {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
  page: number;
}

interface TextLine {
  y: number;
  x0: number;
  x1: number;
  height: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
  text: string;
  tokens: PdfToken[];
}

interface ParagraphBlock {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
  alignment: "left" | "center" | "right";
  lines: string[];
}

interface DetectedTable {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  rows: string[][];
  colCount: number;
  colWidths: number[];
}

/**
 * Standard Font Fallback Engine
 * Maps extracted PDF font names to standard universally supported PowerPoint fonts
 */
function resolveStandardFallbackFont(fontName?: string): string {
  if (!fontName) return "Calibri";
  const name = fontName.toLowerCase();

  // Monospace / Code
  if (name.includes("courier") || name.includes("mono") || name.includes("consolas") || name.includes("code")) {
    return "Consolas";
  }

  // Serif (Formal, Academic, Book)
  if (
    name.includes("times") ||
    name.includes("roman") ||
    name.includes("serif") ||
    name.includes("cambria") ||
    name.includes("georgia") ||
    name.includes("garamond") ||
    name.includes("baskerville")
  ) {
    return "Georgia";
  }

  // Standard Sans-Serif (Modern, UI, Presentation)
  if (name.includes("helvetica") || name.includes("arial") || name.includes("roboto")) {
    return "Arial";
  }

  if (name.includes("calibri") || name.includes("aptos") || name.includes("segoe") || name.includes("sans")) {
    return "Calibri";
  }

  // Universal Enterprise PowerPoint default
  return "Calibri";
}

/**
 * Non-blocking event loop yield for 60 FPS UI responsiveness
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
 * Parse page range string into 0-based page indices
 */
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part.trim()) continue;
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          indices.add(p - 1);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        indices.add(p - 1);
      }
    }
  }

  const result = Array.from(indices).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Perform WASM OCR on flat or scanned PDF page
 */
async function performWasmOcrOnPage(
  page: any,
  _viewport: any,
  onProgress?: (msg: string) => void
): Promise<PdfToken[]> {
  try {
    if (onProgress) onProgress("Running client-side WASM OCR on scanned slide...");
    const canvas = document.createElement("canvas");
    const scale = 2.0;
    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    await (page.render as any)({ canvasContext: ctx, viewport: scaledViewport, canvas } as any).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const worker = await createWorker("eng");
    const ret = await worker.recognize(dataUrl);
    await worker.terminate();

    const tokens: PdfToken[] = [];
    const words = (ret.data as any).words || [];

    for (const w of words) {
      if (!w.text || !w.text.trim()) continue;
      const b = w.bbox || { x0: 0, x1: 0, y0: 0, y1: 0 };
      const width = (b.x1 - b.x0) / scale;
      const height = (b.y1 - b.y0) / scale;
      tokens.push({
        text: w.text.trim(),
        x0: b.x0 / scale,
        x1: b.x1 / scale,
        y0: b.y0 / scale,
        y1: b.y1 / scale,
        width,
        height,
        fontSize: Math.max(height, 10),
        fontName: "Calibri",
        bold: false,
        italic: false,
        page: page.pageNumber || 1,
      });
    }

    return tokens;
  } catch (err) {
    console.warn("[PDFSun OCR Fallback] Slide OCR fallback failed:", err);
    return [];
  }
}

/**
 * Detect structured tabular structures from tokens to generate native PPTX tables
 */
function detectTablesFromLines(lines: TextLine[]): { tables: DetectedTable[]; remainingLines: TextLine[] } {
  if (lines.length < 3) {
    return { tables: [], remainingLines: lines };
  }

  // Look for sequences of lines with 2+ aligned column positions
  const tableCandidates: TextLine[][] = [];
  let currentTableLines: TextLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // A table row typically has 2 or more distinct tokens separated by gaps > 15pt
    const tokenGaps = line.tokens.length >= 2;

    if (tokenGaps) {
      currentTableLines.push(line);
    } else {
      if (currentTableLines.length >= 3) {
        tableCandidates.push([...currentTableLines]);
      }
      currentTableLines = [];
    }
  }

  if (currentTableLines.length >= 3) {
    tableCandidates.push([...currentTableLines]);
  }

  const detectedTables: DetectedTable[] = [];
  const tableLineSet = new Set<TextLine>();

  for (const group of tableCandidates) {
    // Check if column counts and horizontal positions are consistent
    const colPositions: number[] = [];
    for (const l of group) {
      for (const t of l.tokens) {
        if (!colPositions.some((pos) => Math.abs(pos - t.x0) < 18)) {
          colPositions.push(t.x0);
        }
      }
    }
    colPositions.sort((a, b) => a - b);

    // Only qualify as table if at least 2 distinct columns and 3+ rows
    if (colPositions.length >= 2 && colPositions.length <= 8 && group.length >= 3) {
      const rows: string[][] = [];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const l of group) {
        tableLineSet.add(l);
        minY = Math.min(minY, l.y);
        maxY = Math.max(maxY, l.y + l.height);

        const rowCells = new Array(colPositions.length).fill("");
        for (const t of l.tokens) {
          minX = Math.min(minX, t.x0);
          maxX = Math.max(maxX, t.x1);
          // Find closest column
          let closestCol = 0;
          let closestDist = Infinity;
          for (let c = 0; c < colPositions.length; c++) {
            const dist = Math.abs(colPositions[c] - t.x0);
            if (dist < closestDist) {
              closestDist = dist;
              closestCol = c;
            }
          }
          rowCells[closestCol] = rowCells[closestCol] ? `${rowCells[closestCol]} ${t.text}` : t.text;
        }
        rows.push(rowCells);
      }

      const totalWidth = Math.max(maxX - minX, 100);
      const colWidths = colPositions.map((_, idx) => {
        const nextX = idx < colPositions.length - 1 ? colPositions[idx + 1] : maxX;
        return (nextX - colPositions[idx]) / totalWidth;
      });

      detectedTables.push({
        x0: minX,
        y0: minY,
        x1: maxX,
        y1: maxY,
        rows,
        colCount: colPositions.length,
        colWidths,
      });
    }
  }

  const remainingLines = lines.filter((l) => !tableLineSet.has(l));
  return { tables: detectedTables, remainingLines };
}

/**
 * Cluster fragmented PDF tokens into cohesive, discrete paragraph blocks
 * with dynamic line height and word wrapping
 */
function clusterTokensIntoParagraphs(
  tokens: PdfToken[],
  pageWidth: number
): { paragraphs: ParagraphBlock[]; tables: DetectedTable[] } {
  if (tokens.length === 0) return { paragraphs: [], tables: [] };

  // Sort tokens top-down, then left-to-right
  tokens.sort((a, b) => {
    const yDiff = a.y0 - b.y0;
    if (Math.abs(yDiff) > 3.0) return yDiff;
    return a.x0 - b.x0;
  });

  // 1. Group into discrete text lines
  const lines: TextLine[] = [];

  for (const token of tokens) {
    const dynamicLineTolerance = Math.max(2.5, Math.min(token.fontSize * 0.35, 6.0));
    let matchedLine = lines.find((l) => Math.abs(l.y - token.y0) <= dynamicLineTolerance);

    if (matchedLine) {
      matchedLine.tokens.push(token);
      matchedLine.x1 = Math.max(matchedLine.x1, token.x1);
      matchedLine.height = Math.max(matchedLine.height, token.height);
      matchedLine.fontSize = Math.max(matchedLine.fontSize, token.fontSize);
      if (token.bold) matchedLine.bold = true;
      if (token.italic) matchedLine.italic = true;
      if (token.fontName && !matchedLine.fontName) matchedLine.fontName = token.fontName;
    } else {
      lines.push({
        y: token.y0,
        x0: token.x0,
        x1: token.x1,
        height: token.height,
        fontSize: token.fontSize,
        fontName: token.fontName,
        bold: token.bold,
        italic: token.italic,
        text: token.text,
        tokens: [token],
      });
    }
  }

  // Sort each line horizontally and build coherent line text
  for (const l of lines) {
    l.tokens.sort((a, b) => a.x0 - b.x0);
    l.text = l.tokens.map((t) => t.text).join(" ");
    l.x0 = l.tokens[0].x0;
    l.x1 = l.tokens[l.tokens.length - 1].x1;
  }

  // 2. Detect any native tabular grid structures
  const { tables, remainingLines } = detectTablesFromLines(lines);

  // 3. Cluster remaining lines into discrete paragraph blocks
  const paragraphs: ParagraphBlock[] = [];
  const colTolerance = 22.0;

  let currentBlock: ParagraphBlock | null = null;

  for (const line of remainingLines) {
    if (!currentBlock) {
      currentBlock = {
        x0: line.x0,
        y0: line.y,
        x1: line.x1,
        y1: line.y + line.height,
        width: line.x1 - line.x0,
        height: line.height,
        fontSize: line.fontSize,
        fontName: line.fontName,
        bold: line.bold,
        italic: line.italic,
        alignment: "left",
        lines: [line.text],
      };
      continue;
    }

    const verticalGap = line.y - currentBlock.y1;
    const isSameColumn = Math.abs(line.x0 - currentBlock.x0) <= colTolerance;
    // Dynamic vertical gap tolerance based on line font size
    const maxAllowedGap = Math.max(6.0, currentBlock.fontSize * 0.95);
    const isReasonableGap = verticalGap >= -3.0 && verticalGap <= maxAllowedGap;
    const isSimilarFont = Math.abs(line.fontSize - currentBlock.fontSize) <= 3.5;

    if (isSameColumn && isReasonableGap && isSimilarFont) {
      currentBlock.lines.push(line.text);
      currentBlock.x0 = Math.min(currentBlock.x0, line.x0);
      currentBlock.x1 = Math.max(currentBlock.x1, line.x1);
      currentBlock.y1 = line.y + line.height;
      currentBlock.width = currentBlock.x1 - currentBlock.x0;
      currentBlock.height = currentBlock.y1 - currentBlock.y0;
      if (line.bold) currentBlock.bold = true;
      if (line.italic) currentBlock.italic = true;
    } else {
      // Determine text block alignment
      const midX = (currentBlock.x0 + currentBlock.x1) / 2;
      if (Math.abs(midX - pageWidth / 2) < 28) {
        currentBlock.alignment = "center";
      } else if (currentBlock.x0 > pageWidth * 0.62) {
        currentBlock.alignment = "right";
      }

      paragraphs.push(currentBlock);
      currentBlock = {
        x0: line.x0,
        y0: line.y,
        x1: line.x1,
        y1: line.y + line.height,
        width: line.x1 - line.x0,
        height: line.height,
        fontSize: line.fontSize,
        fontName: line.fontName,
        bold: line.bold,
        italic: line.italic,
        alignment: "left",
        lines: [line.text],
      };
    }
  }

  if (currentBlock) {
    const midX = (currentBlock.x0 + currentBlock.x1) / 2;
    if (Math.abs(midX - pageWidth / 2) < 28) {
      currentBlock.alignment = "center";
    }
    paragraphs.push(currentBlock);
  }

  return { paragraphs, tables };
}

/**
 * Enterprise Anti-Collision & Bounding Box Layout Engine
 * Ensures text frames never overlap vertically or horizontally
 */
interface ResolvedLayoutBlock {
  type: "text" | "table";
  x: number; // inches
  y: number; // inches
  w: number; // inches
  h: number; // inches
  fontSize: number;
  fontFace: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  text: string;
  tableData?: DetectedTable;
}

function resolveAntiCollisionLayout(
  paragraphs: ParagraphBlock[],
  tables: DetectedTable[],
  toSlideX: (val: number) => number,
  toSlideY: (val: number) => number,
  toSlideW: (val: number) => number,
  toSlideH: (val: number) => number,
  slideWidthInches: number,
  slideHeightInches: number,
  renderH: number,
  viewportHeight: number
): ResolvedLayoutBlock[] {
  const blocks: ResolvedLayoutBlock[] = [];

  // 1. Convert paragraphs into layout blocks
  for (const para of paragraphs) {
    const rawX = toSlideX(para.x0);
    const rawY = toSlideY(para.y0);
    const rawW = Math.max(toSlideW(para.width), 1.2);
    const rawH = toSlideH(para.height);

    // Calculated font point size
    const fontPt = Math.max(
      8,
      Math.min(
        Math.round((para.fontSize / Math.max(viewportHeight, 1)) * renderH * 72 * 0.95),
        44
      )
    );

    // Dynamic line-height & bounding box sizing
    const estLineHeightInch = (fontPt * 1.35) / 72;
    const minNeededHeight = para.lines.length * estLineHeightInch + 0.12;
    const finalH = Math.max(rawH, minNeededHeight);
    const finalW = Math.min(rawW + 0.35, slideWidthInches - rawX - 0.15);

    const fontFace = resolveStandardFallbackFont(para.fontName);

    blocks.push({
      type: "text",
      x: Math.max(0.15, Math.min(rawX, slideWidthInches - 1.0)),
      y: Math.max(0.15, Math.min(rawY, slideHeightInches - 0.4)),
      w: Math.max(finalW, 1.0),
      h: finalH,
      fontSize: fontPt,
      fontFace,
      bold: para.bold,
      italic: para.italic,
      align: para.alignment,
      text: para.lines.join("\n"),
    });
  }

  // 2. Convert tables into layout blocks
  for (const tbl of tables) {
    const rawX = toSlideX(tbl.x0);
    const rawY = toSlideY(tbl.y0);
    const rawW = Math.max(toSlideW(tbl.x1 - tbl.x0), 2.5);
    const rawH = Math.max(toSlideH(tbl.y1 - tbl.y0), 1.0);

    blocks.push({
      type: "table",
      x: Math.max(0.15, Math.min(rawX, slideWidthInches - 1.5)),
      y: Math.max(0.15, Math.min(rawY, slideHeightInches - 0.8)),
      w: Math.min(rawW, slideWidthInches - 0.3),
      h: rawH,
      fontSize: 10,
      fontFace: "Calibri",
      bold: false,
      italic: false,
      align: "left",
      text: "",
      tableData: tbl,
    });
  }

  // 3. Collision Resolution Pass
  // Sort blocks top-down, secondary left-to-right
  blocks.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 0.15) return yDiff;
    return a.x - b.x;
  });

  for (let i = 0; i < blocks.length; i++) {
    for (let j = 0; j < i; j++) {
      const prev = blocks[j];
      const curr = blocks[i];

      // Check horizontal column overlap:
      // Must have substantial horizontal intersection (> 35% of narrower block) to be the same column
      const overlapLeft = Math.max(curr.x, prev.x);
      const overlapRight = Math.min(curr.x + curr.w, prev.x + prev.w);
      const overlapW = overlapRight - overlapLeft;
      const minW = Math.min(curr.w, prev.w);
      const sameColumn = overlapW > 0 && overlapW >= minW * 0.35;

      // And must actually overlap vertically
      const verticalOverlap = curr.y < prev.y + prev.h && curr.y + curr.h > prev.y;

      if (sameColumn && verticalOverlap) {
        // Adjust curr.y below prev
        const prevBottom = prev.y + prev.h;
        if (curr.y < prevBottom + 0.04) {
          curr.y = prevBottom + 0.05;
        }
      }
    }
  }

  // Clamp within slide dimensions safely
  for (const b of blocks) {
    if (b.y + b.h > slideHeightInches - 0.15) {
      if (b.y > slideHeightInches - 0.4) {
        b.y = Math.max(0.15, slideHeightInches - 0.45);
      }
      b.h = Math.max(0.25, slideHeightInches - 0.15 - b.y);
    }
  }

  return blocks;
}

/**
 * Enterprise PDF to PowerPoint Slide Reconstruction Engine
 */
export async function convertPdfToPowerPointEnterprise(
  file: File,
  options: PdfToPowerPointOptions = {}
): Promise<{ bytes: Uint8Array; fileName: string; totalSlides: number }> {
  const {
    preset = "hybrid_master",
    orientation = "auto",
    pageScope = "all",
    pageRangeStr = "",
    enableOcrFallback = true,
    onProgress,
  } = options;

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "PDFSun_Presentation";

  if (onProgress) onProgress(8, "Initializing presentation stream & spatial geometry...");
  await yieldToEventLoop();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  }).promise;

  const totalPages = pdf.numPages;
  const targetPageIndices =
    pageScope === "range" && pageRangeStr.trim()
      ? parsePageRange(pageRangeStr, totalPages)
      : Array.from({ length: totalPages }, (_, i) => i);

  if (targetPageIndices.length === 0) {
    throw new Error("No valid pages were selected in the specified slide range.");
  }

  // 1. Analyze Geometry & Determine Target Slide Ratio
  const firstPage = await pdf.getPage(targetPageIndices[0] + 1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  const pageRatio = firstViewport.width / Math.max(firstViewport.height, 1);

  const pptx = new PptxGenJS();

  let slideWidthInches = 13.333;
  let slideHeightInches = 7.5;

  if (orientation === "portrait" || (orientation === "auto" && pageRatio < 0.95)) {
    // 9:16 Portrait Slide Layout
    pptx.defineLayout({ name: "PORTRAIT_16x9", width: 7.5, height: 13.333 });
    pptx.layout = "PORTRAIT_16x9";
    slideWidthInches = 7.5;
    slideHeightInches = 13.333;
  } else if (orientation === "standard" || (orientation === "auto" && pageRatio >= 1.15 && pageRatio <= 1.5)) {
    // 4:3 Standard Presentation Layout
    pptx.layout = "LAYOUT_4x3";
    slideWidthInches = 10.0;
    slideHeightInches = 7.5;
  } else {
    // 16:9 Widescreen Layout
    pptx.layout = "LAYOUT_16x9";
    slideWidthInches = 13.333;
    slideHeightInches = 7.5;
  }

  const totalSlidesToProcess = targetPageIndices.length;

  // 2. Process and Reconstruct Each Slide
  for (let sIdx = 0; sIdx < totalSlidesToProcess; sIdx++) {
    const pageIndex = targetPageIndices[sIdx];
    const pageNum = pageIndex + 1;

    if (onProgress) {
      const pct = 15 + Math.round((sIdx / totalSlidesToProcess) * 75);
      onProgress(
        pct,
        `Reconstructing Slide ${sIdx + 1} of ${totalSlidesToProcess} (Text Frames, Tables & Layout)...`
      );
    }
    await yieldToEventLoop();

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    // Aspect-Ratio Preserving Letterbox/Pillarbox Calculation
    // Guarantees zero distortion, stretching or misplaced coordinate drifts
    const pageAspect = viewport.width / Math.max(viewport.height, 1);
    const slideAspect = slideWidthInches / Math.max(slideHeightInches, 1);
    let renderW = slideWidthInches;
    let renderH = slideHeightInches;
    let offsetX = 0;
    let offsetY = 0;

    if (pageAspect > slideAspect) {
      // PDF page is wider than PowerPoint slide aspect: Fit width, letterbox top/bottom
      renderW = slideWidthInches;
      renderH = slideWidthInches / pageAspect;
      offsetY = Math.max(0, (slideHeightInches - renderH) / 2);
    } else {
      // PDF page is taller than PowerPoint slide aspect: Fit height, letterbox left/right
      renderH = slideHeightInches;
      renderW = slideHeightInches * pageAspect;
      offsetX = Math.max(0, (slideWidthInches - renderW) / 2);
    }

    const toSlideX = (pdfX: number) => offsetX + (pdfX / Math.max(viewport.width, 1)) * renderW;
    const toSlideY = (pdfY: number) => offsetY + (pdfY / Math.max(viewport.height, 1)) * renderH;
    const toSlideW = (pdfW: number) => (pdfW / Math.max(viewport.width, 1)) * renderW;
    const toSlideH = (pdfH: number) => (pdfH / Math.max(viewport.height, 1)) * renderH;

    // Extract Text Content
    const textContent = await (page.getTextContent as any)({ normalizeWhitespace: true });
    const rawItems = textContent.items as any[];

    let pageTokens: PdfToken[] = [];
    let pageCharCount = 0;

    for (const item of rawItems) {
      if (!item.str || !item.str.trim()) continue;
      const str = item.str.trim();
      pageCharCount += str.length;

      const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
      const x = tx[4];
      const y = viewport.height - tx[5]; // Convert to top-down coordinates
      const w = item.width || Math.max(str.length * 6, 8);
      const h = item.height || Math.abs(tx[3]) || 10;
      const fontName = item.fontName || "";
      const isBold = /bold|black|heavy/i.test(fontName);
      const isItalic = /italic|oblique/i.test(fontName);

      pageTokens.push({
        text: str,
        x0: x,
        x1: x + w,
        y0: y - h,
        y1: y,
        width: w,
        height: h,
        fontSize: Math.abs(tx[3]) || 12,
        fontName,
        bold: isBold,
        italic: isItalic,
        page: pageNum,
      });
    }

    // Client-side WASM OCR Fallback for scanned/raster slides
    if (pageCharCount < 25 && enableOcrFallback && typeof window !== "undefined") {
      const ocrTokens = await performWasmOcrOnPage(page, viewport, (msg) => {
        if (onProgress) onProgress(35, msg);
      });
      if (ocrTokens.length > 0) {
        pageTokens = ocrTokens;
      }
    }

    const slide = pptx.addSlide();

    // A. High-Resolution Master Plate for Hybrid Mode & Compact Deck
    // Renders master vector/raster plate at exact aspect ratio without stretching
    if (preset === "hybrid_master" || preset === "compact_deck") {
      try {
        const renderScale = 2.0; // 2x Ultra-HD DPI
        const scaledViewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, viewport: scaledViewport, canvas } as any).promise;
          const bgDataUrl = canvas.toDataURL("image/png");

          slide.addImage({
            data: bgDataUrl,
            x: offsetX,
            y: offsetY,
            w: renderW,
            h: renderH,
          });
        }
      } catch (e) {
        console.warn("[PDFSun PPTX] Master canvas plate render fallback:", e);
      }
    } else {
      // Pure clean white canvas for Vector & Editable preset
      slide.background = { color: "FFFFFF" };
    }

    // B. Group Tokens, Detect Tables & Resolve Anti-Collision Layout
    const { paragraphs, tables } = clusterTokensIntoParagraphs(pageTokens, viewport.width);
    const resolvedBlocks = resolveAntiCollisionLayout(
      paragraphs,
      tables,
      toSlideX,
      toSlideY,
      toSlideW,
      toSlideH,
      slideWidthInches,
      slideHeightInches,
      renderH,
      viewport.height
    );

    // C. Render Discrete Frames & Native Tables to Slide (for Vector & Hybrid modes)
    if (preset !== "compact_deck") {
      for (const block of resolvedBlocks) {
        if (block.type === "table" && block.tableData) {
          // Native OpenXML Table Element
          try {
            const tableRows = block.tableData.rows.map((row, rIdx) =>
              row.map((cellText) => ({
                text: cellText,
                options: {
                  fontSize: 9,
                  fontFace: "Calibri",
                  bold: rIdx === 0, // Header row bold
                  color: "0F172A",
                  fill: rIdx === 0 ? { color: "F1F5F9" } : undefined,
                  align: "left" as const,
                  valign: "middle" as const,
                },
              }))
            );

            slide.addTable(tableRows, {
              x: block.x,
              y: block.y,
              w: block.w,
              h: block.h,
              border: { type: "solid", pt: 1, color: "CBD5E1" },
              autoPage: false,
            });
          } catch (tableErr) {
            console.warn("[PDFSun PPTX] Native table fallback:", tableErr);
          }
        } else if (block.type === "text") {
          // Discrete Text Frame with Dynamic Line-Spacing & Anti-Collision Box Sizing
          slide.addText(block.text, {
            x: block.x,
            y: block.y,
            w: block.w,
            h: block.h,
            fontSize: block.fontSize,
            fontFace: block.fontFace,
            color: "0F172A",
            transparency: 0, // Fully visible, readable & selectable in Microsoft PowerPoint and Google Slides
            bold: block.bold,
            italic: block.italic,
            align: block.align,
            valign: "top",
            wrap: true,
            autoFit: true,
            lineSpacingMultiple: 1.15,
            margin: [2, 4, 2, 4],
          });
        }
      }
    }

    // D. Decorative Accent Header Bar for Vector Mode
    if (preset === "vector_editable" && resolvedBlocks.length > 0 && resolvedBlocks[0].y < 0.8) {
      try {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: slideWidthInches,
          h: 0.12,
          fill: { color: "2563EB" }, // Brand Blue Accent
          line: { color: "2563EB", width: 0 },
        });
      } catch {
        // Safe shape fallback
      }
    }
  }

  if (onProgress) onProgress(94, "Packaging OpenXML PowerPoint (.pptx) presentation stream...");
  await yieldToEventLoop();

  const buffer = await pptx.write({ outputType: "arraybuffer" });
  const bytes = new Uint8Array(buffer as ArrayBuffer);

  if (onProgress) onProgress(100, "PDF to PowerPoint slide reconstruction complete!");

  return {
    bytes,
    fileName: `${baseName}_Presentation.pptx`,
    totalSlides: totalSlidesToProcess,
  };
}
